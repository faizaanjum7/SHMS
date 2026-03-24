import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { Appointment, UserRole } from '../types';
import AppointmentResultModal from '../components/AppointmentResultModal';
import { calculateWaitTimesForQueue, getNowMinutes } from '../utils/wait-time-utils';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Precise Clock - update every second
  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    if (!currentUser || !userProfile) return;

    let q;
    // Security Rules requirement: staff must filter by hospital, doctors by doctorId
    if (userProfile.role === UserRole.DOCTOR) {
      q = query(collection(db, 'appointments'), where('doctorId', '==', currentUser.uid));
    } else if ([UserRole.RECEPTIONIST, UserRole.MEDICAL_ADMIN, UserRole.HOSPITAL_STAFF].includes(userProfile.role)) {
      q = query(collection(db, 'appointments'), where('hospital', '==', userProfile.hospital));
    } else {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          waitTimeUpdatedAt: data.waitTimeUpdatedAt?.toDate ? data.waitTimeUpdatedAt.toDate().toISOString() : data.waitTimeUpdatedAt
        } as Appointment;
      });
      setAppointments(apps);
      setLoading(false);
    }, (error) => {
      console.error("Dashboard snapshot error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, userProfile]);

  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  // Compute all wait times based on the current minute clock
  const allWaitTimes = useMemo(() => {
    const doctorDates = new Set(appointments.map(a => `${a.doctorId}|${a.date}`));
    const fullMap = new Map<string, number>();
    
    doctorDates.forEach((dd: any) => {
      const parts = (dd as string).split('|');
      const doctorId = parts[0];
      const date = parts[1];
      const queue = appointments.filter(a => String(a.doctorId) === String(doctorId) && a.date === date);
      const waitTimes = calculateWaitTimesForQueue(queue, date, doctorId, currentTime);
      waitTimes.forEach((val, id) => fullMap.set(id, val));
    });
    
    return fullMap;
  }, [appointments, currentTime]);

  const handleUpdateClick = (app: Appointment) => {
    setSelectedAppointment(app);
    setIsResultModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300';
      case 'In-Progress': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300';
      case 'Completed': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'Cancelled': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  const filteredAppointments = appointments
    .filter(a => activeTab === 'active' 
      ? (a.status === 'Confirmed' || a.status === 'In-Progress')
      : (a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'No-show')
    )
    .sort((a,b) => {
        if (activeTab === 'active') {
            return (a.status === 'In-Progress' ? -1 : 1);
        }
        // For historical records, sort by date/time descending
        return new Date(`${b.date} ${b.appointmentTime}`).getTime() - new Date(`${a.date} ${a.appointmentTime}`).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Staff Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Live appointment management and wait-time monitoring.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
            <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-widest">Real-Time Clock</span>
            <span className="text-2xl font-black tabular-nums text-gray-900 dark:text-white">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-2xl w-fit border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
            activeTab === 'active' 
              ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Active Queue
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
            activeTab === 'past' 
              ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Patient Records
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Patient</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Time</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Doctor</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Wait</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                    No {activeTab} records found
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-900 dark:text-white">{app.patientName}</p>
                    <p className="text-xs text-gray-500">{app.reasonForVisit}</p>
                  </td>
                  <td className="p-4 font-mono text-sm">{app.appointmentTime}</td>
                  <td className="p-4 text-sm font-medium">{app.doctorName}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {allWaitTimes.get(app.id) ?? 0}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase font-black">min</span>
                      {app.receptionistWaitTimeOverride !== undefined && (
                        <span className="h-2 w-2 rounded-full bg-amber-500" title="Manual Override Active"></span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleUpdateClick(app)}
                      className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black rounded-xl hover:scale-105 transition-transform"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {isResultModalOpen && selectedAppointment && (
        <AppointmentResultModal 
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          appointment={selectedAppointment}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
};

export default DashboardPage;