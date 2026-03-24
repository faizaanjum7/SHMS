import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DOCTORS } from '../constants';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Appointment } from '../types';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AVG_SERVICE_MIN = 15;

const parseTimeToMinutes = (t: string) => {
  const ampmMatch = t.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (ampmMatch) {
    let hh = parseInt(ampmMatch[1], 10);
    const mm = parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3].toUpperCase();
    if (meridiem === 'PM' && hh !== 12) hh += 12;
    if (meridiem === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  }
  const [hhStr, mmStr] = t.split(':');
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);
  return hh * 60 + mm;
};

const DoctorDetailsPage: React.FC = () => {
  const { id } = useParams();
  const doctor = DOCTORS.find(d => d.id === Number(id));
  
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctor) return;

    const appointmentsCollection = collection(db, "appointments");
    // We use the doctor's name or ID for filtering. Since DOCTORS constants use number IDs, 
    // we should ideally use UID, but the appointments in the DB likely use 'doctorId' or 'doctorName'.
    // In DashboardPage, it uses 'doctorId'. Let's assume the appointment has doctorId mapping to the numeric ID as a string or UID.
    // However, looking at DashboardPage, it fetches by UID: where("doctorId", "==", currentUser.uid).
    // The DOCTORS IDs (1, 2, 3...) are not UIDs.
    // In HospitalDetailsPage, it fetches by doctor.name via fallbackDoctors.
    
    // For this demonstration, we'll try to find appointments where doctorName matches or doctorId matches.
    // Given the previous session context, appointments in our system likely use the doctor's name or a mapping.
    // Let's use doctor.name for now as it's the most reliable link between DOCTORS constant and DB records for patients.
    const q = query(
      appointmentsCollection,
      where("doctorName", "==", doctor.name),
      where("date", "==", selectedDate),
      orderBy("appointmentTime")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Appointment[];
      setAppointments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [doctor, selectedDate]);

  const liveStatus = useMemo(() => {
    if (selectedDate !== getTodayDateString()) return null;
    
    const inProgress = appointments.find(a => a.status === 'In-Progress');
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    
    if (inProgress) {
      // Calculate remaining time
      let remaining = AVG_SERVICE_MIN;
      if (inProgress.startedAtISO) {
        const started = new Date(inProgress.startedAtISO);
        const elapsed = Math.max(0, Math.floor((now.getTime() - started.getTime()) / 60000));
        remaining = Math.max(1, AVG_SERVICE_MIN - elapsed);
      }
      
      // Find following appointments
      const following = appointments
        .filter(a => a.status === 'Confirmed' && parseTimeToMinutes(a.appointmentTime) > nowMins)
        .sort((a, b) => parseTimeToMinutes(a.appointmentTime) - parseTimeToMinutes(b.appointmentTime));
        
      return {
        type: 'busy',
        message: 'Currently attending a patient',
        remaining,
        nextWait: following.length * AVG_SERVICE_MIN + remaining
      };
    }
    
    return { type: 'available', message: 'Currently Available' };
  }, [appointments, selectedDate]);

  if (!doctor) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Doctor not found</h1>
        <Link to="/doctors" className="text-emerald-600 mt-4 inline-block hover:underline">Back to all doctors</Link>
      </div>
    );
  }

  const firstName = doctor.name.replace(/^\s*dr\.?\s*/i, '').split(' ')[0].toLowerCase();
  const computedSrc = doctor.imageUrl || `/images/doctors/${firstName}.jpg`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/doctors" className="text-emerald-600 font-semibold flex items-center gap-2 hover:translate-x-1 transition-transform inline-block">
        &larr; Back to Experts
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <img
              src={computedSrc}
              alt={doctor.name}
              className="w-full h-full object-cover aspect-square md:aspect-auto"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src.endsWith('/images/doctors/default.svg')) return;
                img.src = '/images/doctors/default.svg';
              }}
            />
          </div>
          <div className="p-8 md:w-2/3 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{doctor.name}</h1>
                <p className="text-emerald-600 dark:text-emerald-400 text-xl font-medium">{doctor.specialty}</p>
                {doctor.field && (
                  <p className="text-gray-500 dark:text-gray-400 mt-1 italic">Focus: {doctor.field}</p>
                )}
              </div>
              
              {liveStatus && (
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-sm ${liveStatus.type === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${liveStatus.type === 'available' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  {liveStatus.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              <span>{doctor.hospital}</span>
            </div>

            {liveStatus?.type === 'busy' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30">
                <p className="text-amber-800 dark:text-amber-300 text-sm">
                  <strong>Estimated Next Availability:</strong> ~{liveStatus.remaining} mins for current patient. 
                  {liveStatus.nextWait > liveStatus.remaining && ` Total wait for new walk-ins: approx. ${liveStatus.nextWait} mins.`}
                </p>
              </div>
            )}

            <div className="pt-4 flex flex-wrap gap-4">
               <Link 
                to="/book-appointment" 
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 dark:shadow-none"
               >
                Book Appointment
               </Link>
               <a 
                href={`mailto:${doctor.contact}`} 
                className="px-6 py-3 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
               >
                Contact PA
               </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border dark:border-gray-700 space-y-6">
          <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Check Availability
            </h2>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500 py-4">Checking schedule...</p>
            ) : appointments.length === 0 ? (
              <div className="text-center py-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">No appointments booked for this day.</p>
                <p className="text-xs text-emerald-600/70 mt-1">Commonly available: {doctor.schedule || '09:00 AM - 05:00 PM'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Booked Slots</p>
                {appointments.map(app => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border dark:border-gray-700">
                    <span className="font-bold text-gray-700 dark:text-gray-200">{app.appointmentTime}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      app.status === 'In-Progress' ? 'bg-amber-100 text-amber-700' :
                      app.status === 'Completed' ? 'bg-gray-200 text-gray-600' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-md space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Consultation Info
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-emerald-500 pb-2">
              <span className="font-medium opacity-90">Days Available:</span>
              <span className="font-bold">{doctor.availability || 'Mon - Fri'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-emerald-500 pb-2">
              <span className="font-medium opacity-90">Hours:</span>
              <span className="font-bold">{doctor.schedule || '09:00 AM - 05:00 PM'}</span>
            </div>
            <div className="pt-2">
              <p className="text-sm opacity-90">Assistant / Contact:</p>
              <p className="font-bold mt-1 text-lg">{doctor.assistantContact || doctor.contact}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl text-sm">
                <p><strong>Note:</strong> Live status is updated by the hospital desk. Approximate times are estimates based on average consultation durations.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border dark:border-gray-700 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Professional Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
          {doctor.workDescription || `Dr. ${doctor.name.replace(/^\s*dr\.?\s*/i, '')} is a dedicated ${doctor.specialty} specialist at ${doctor.hospital}. With years of clinical experience, they provide comprehensive care for patients with various ${doctor.specialty.toLowerCase()} conditions.`}
        </p>
      </div>
    </div>
  );
};

export default DoctorDetailsPage;
