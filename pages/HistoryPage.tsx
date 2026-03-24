import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Appointment } from '../types';
import CancelAppointmentModal from '../components/CancelAppointmentModal';
import LeaveReviewModal from '../components/LeaveReviewModal';
import { getDecayedWaitTime } from '../utils/wait-time-utils';
import { getTodayDateString } from '../utils/date-utils';
import { createNotification } from '../services/NotificationService';
import { HOSPITALS } from '../constants';

const HistoryPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState('');

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedAppForCancel, setSelectedAppForCancel] = useState<Appointment | null>(null);
    
    const [selectedAppForReview, setSelectedAppForReview] = useState<Appointment | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    // Precise Clock - update every second to ensure it matches real time
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "appointments"),
            where("patientUid", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribeHistory = onSnapshot(q, (snapshot) => {
            const userAppointments = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure createdAt is safe for Date constructor
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                    waitTimeUpdatedAt: data.waitTimeUpdatedAt?.toDate ? data.waitTimeUpdatedAt.toDate().toISOString() : data.waitTimeUpdatedAt
                } as Appointment;
            });
            setAppointments(userAppointments);
            setLoading(false);
        }, (err: any) => {
            console.error("Error fetching appointments:", err);
            setError("Failed to load appointment history. Please check your internet or permissions.");
            setLoading(false);
        });

        return () => unsubscribeHistory();
    }, [currentUser]);

    // Track 0-min notifications
    useEffect(() => {
        if (!currentUser) return;

        const checkAndNotify = async () => {
            const today = getTodayDateString();
            for (const app of appointments) {
                // Only notify for today's confirmed appointments that hit 0 wait time
                if (app.status === 'Confirmed' && app.date === today && !app.notified0Min) {
                    const wait = getDecayedWaitTime(app, currentTime);
                    if (wait === 0) {
                        try {
                            // 1. Create the notification in Firestore
                            await createNotification({
                                recipientUid: app.patientUid,
                                title: "It's your turn!",
                                message: `Dr. ${app.doctorName} is ready to see you. Please proceed to the consultation room.`,
                                type: 'General',
                                relatedAppointmentId: app.id
                            });

                            // 2. Mark as notified in the appointment document to prevent duplicate triggers
                            const appRef = doc(db, 'appointments', app.id);
                            await updateDoc(appRef, { notified0Min: true });
                            
                            console.log(`Sent 0-min notification for appointment ${app.id}`);
                        } catch (err) {
                            console.error("Failed to trigger 0-min notification:", err);
                        }
                    }
                }
            }
        };

        checkAndNotify();
    }, [currentTime, appointments, currentUser]);

    const computeWaitTime = (app: Appointment) => {
        const wait = getDecayedWaitTime(app, currentTime);
        
        // Show wait time if it's for today and confirmed
        return (app.date === getTodayDateString() && app.status === 'Confirmed') ? wait : null;
    };

    const getHospitalId = (name: string) => {
        const h = HOSPITALS.find(h => h.name === name);
        return h ? h.id : null;
    };

    const handleOpenCancelModal = (app: Appointment) => {
        setSelectedAppForCancel(app);
        setIsCancelModalOpen(true);
    };

    const handleOpenReviewModal = (app: Appointment) => {
        setSelectedAppForReview(app);
        setIsReviewModalOpen(true);
    };

    const getStatusChipClass = (status: Appointment['status']) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'No-show': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading your appointments...</p>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-xl shadow-md border dark:border-gray-700 text-center max-w-2xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 italic">Access Denied</h1>
                <p className="mt-6 text-gray-600 dark:text-gray-300 text-lg">Please log in to view your personalized appointment history.</p>
                <Link to="/login" className="mt-8 inline-block px-10 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/20">
                    Login / Register
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div>
                    <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">Appointment History</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Track your visits and live wait times in real-time.</p>
                </div>
                <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 flex flex-col items-center justify-center min-w-[140px]">
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Current Time</span>
                    <span className="text-2xl font-black tabular-nums">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-3">
                    <span className="text-xl">⚠️</span> {error}
                </div>
            )}

            {!error && appointments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-xl border dark:border-gray-700 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">You haven't booked any appointments yet.</p>
                    <Link to="/book-appointment" className="mt-6 inline-block text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-500 transition-colors">
                        Start by booking your first visit &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {appointments.map(app => {
                        const isCancellable = app.status === 'Confirmed' && new Date(app.date) >= new Date(new Date().toDateString());
                        const waitTime = computeWaitTime(app);
                        const hospitalId = getHospitalId(app.hospital);
                        
                        return (
                            <div key={app.id} className="group bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden">
                                {waitTime !== null && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex flex-col lg:flex-row justify-between gap-6">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center flex-wrap gap-2">
                                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Dr. {app.doctorName}</h2>
                                            <span className={`px-3 py-1 text-xs font-black uppercase rounded-lg ${getStatusChipClass(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                                            <span className="text-emerald-500">🏥</span> {app.department} at {app.hospital}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            Ref: <span className="font-mono">{app.id.slice(0, 8).toUpperCase()}</span> • Booked: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>

                                    <div className="lg:text-right space-y-1">
                                        <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{app.appointmentTime}</p>
                                        <p className="text-gray-500 dark:text-gray-400 font-bold">{app.date}</p>
                                    </div>
                                </div>

                                {waitTime !== null && (
                                    <div className="mt-6 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 dark:text-emerald-400">Current Live Queue Wait</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-emerald-800 dark:text-emerald-200 tabular-nums">{waitTime}</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">min</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {app.receptionistWaitTimeOverride !== undefined && (
                                                <span className="text-[9px] bg-amber-500 text-white px-2 py-1 rounded-md font-black uppercase tracking-tighter">
                                                    Manual Override
                                                </span>
                                            )}
                                            <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 italic">Refreshing live...</p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        {app.reasonForVisit && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                                <span className="font-bold text-gray-400 dark:text-gray-500">Reason:</span> {app.reasonForVisit}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isCancellable && (
                                            <button
                                                onClick={() => handleOpenCancelModal(app)}
                                                className="px-5 py-2.5 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                            >
                                                Cancel Appointment
                                            </button>
                                        )}

                                        {app.status === 'Completed' && !app.reviewed && (
                                            <button
                                                onClick={() => handleOpenReviewModal(app)}
                                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                                            >
                                                Leave Review
                                            </button>
                                        )}
                                        
                                        {app.reviewed && (
                                            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest rounded-xl">
                                                Review Submitted
                                            </span>
                                        )}
                                        <Link
                                            to={hospitalId ? `/hospitals/${hospitalId}` : '/hospitals'}
                                            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-sm rounded-xl hover:scale-105 transition-transform shadow-lg hover:shadow-emerald-500/10"
                                        >
                                            View Hospital Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            
            {isCancelModalOpen && selectedAppForCancel && (
                <CancelAppointmentModal
                    isOpen={isCancelModalOpen}
                    onClose={() => setIsCancelModalOpen(false)}
                    appointment={selectedAppForCancel}
                    onUpdate={() => {}}
                />
            )}

            {isReviewModalOpen && selectedAppForReview && (
                <LeaveReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    appointment={selectedAppForReview}
                    onSuccess={() => {}}
                />
            )}
        </div>
    );
};

export default HistoryPage;