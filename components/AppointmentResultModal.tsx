import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Appointment } from '../types';
import { calculateWaitTimesForQueue, getNowMinutes } from '../utils/wait-time-utils';
import { createNotification } from '../services/NotificationService';

interface AppointmentResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onUpdate: () => void;
}

const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const INVENTORY_ITEMS = ['Medicines', 'Salines', 'Consumables', 'Equipment', 'Other'];

const AppointmentResultModal: React.FC<AppointmentResultModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onUpdate,
}) => {
  const [status, setStatus] = useState<Appointment['status']>(appointment.status);
  const [notes, setNotes] = useState(appointment.resultNotes || '');
  const [startedAtISO, setStartedAtISO] = useState(appointment.startedAtISO || '');
  const [completedAtISO, setCompletedAtISO] = useState(appointment.completedAtISO || '');
  const [actualDurationMin, setActualDurationMin] = useState(appointment.actualDurationMin || undefined);
  const [admitted, setAdmitted] = useState(!!appointment.admitted);
  const [admissionNotes, setAdmissionNotes] = useState(appointment.admissionNotes || '');
  const [requiredInventory, setRequiredInventory] = useState(appointment.requiredInventory || []);
  const [visitType, setVisitType] = useState(appointment.visitType || 'OPD');
  const [bedBooking, setBedBooking] = useState(!!appointment.bedBooking);
  const [receptionistWaitTimeOverride, setReceptionistWaitTimeOverride] = useState<number | undefined>(appointment.receptionistWaitTimeOverride);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canEdit = true; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMessage('');

      // 1. Fetch current queue for the doctor to handle ripple-effect notifications and batch updates
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', appointment.doctorId),
        where('date', '==', appointment.date),
        where('hospital', '==', appointment.hospital)
      );
      
      const snapshot = await getDocs(appointmentsQuery);
      const currentAppointments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
      const nowDate = new Date();
      const oldWaitTimes = calculateWaitTimesForQueue(currentAppointments, appointment.date, appointment.doctorId, nowDate);

      // 2. Perform the main update
      const appointmentRef = doc(db, 'appointments', appointment.id);
      const updateData: any = {
        status: status,
        resultNotes: notes,
        startedAtISO: startedAtISO || null,
        completedAtISO: completedAtISO || null,
        actualDurationMin: actualDurationMin ?? null,
        admitted: !!admitted,
        admissionNotes: admissionNotes || null,
        requiredInventory: (admitted && requiredInventory && requiredInventory.length > 0) ? requiredInventory.map(i => ({ name: i.name, qty: Number(i.qty) || 0 })) : [],
        visitType: visitType || 'OPD',
        bedBooking: !!bedBooking,
        receptionistWaitTimeOverride: receptionistWaitTimeOverride !== undefined ? Number(receptionistWaitTimeOverride) : null,
        waitTimeUpdatedAt: new Date().toISOString(),
        notified0Min: false,
      };
      
      await updateDoc(appointmentRef, updateData);

      // 3. Calculate "new" wait times for the whole queue
      const updatedAppointments = currentAppointments.map(a => 
        a.id === appointment.id 
          ? { 
              ...a, 
              ...updateData,
              receptionistWaitTimeOverride: receptionistWaitTimeOverride !== undefined ? Number(receptionistWaitTimeOverride) : null
            } 
          : a
      );
      
      const newWaitTimes = calculateWaitTimesForQueue(updatedAppointments, appointment.date, appointment.doctorId, nowDate);

      // 4. Batch update and notify everyone whose wait time changed
      const nowISO = new Date().toISOString();
      const notificationPromises: Promise<any>[] = [];
      const batchPromises: Promise<any>[] = [];

      for (const [appId, newWait] of newWaitTimes.entries()) {
        const oldWait = oldWaitTimes.get(appId) || 0;
        const targetApp = updatedAppointments.find(a => a.id === appId);
        
        if (!targetApp) continue;

        // Persist the new prediction to the database (ripple effect)
        if (appId !== appointment.id) {
          const appRef = doc(db, 'appointments', appId);
          batchPromises.push(updateDoc(appRef, {
            predictedWaitTimeMin: newWait,
            waitTimeUpdatedAt: nowISO,
            notified0Min: false
          }));
        }

        if (targetApp.status !== 'Confirmed') continue;

        const diff = newWait - oldWait;
        if (Math.abs(diff) >= 1) { 
          const directionalWord = diff > 0 ? 'increased' : 'decreased';
          const reasonNotice = (appId === appointment.id && visitType === 'Emergency' && appointment.visitType !== 'Emergency')
            ? 'Your appointment has been prioritized as an Emergency.'
            : (appointment.visitType !== visitType && visitType === 'Emergency')
              ? 'due to an emergency patient being prioritized.'
              : (receptionistWaitTimeOverride !== undefined && appId === appointment.id)
                ? 'due to a manual update by the receptionist.'
                : 'due to a scheduling update.';

          notificationPromises.push(
            createNotification({
              recipientUid: targetApp.patientUid,
              title: `Wait Time ${directionalWord.charAt(0).toUpperCase() + directionalWord.slice(1)}`,
              message: `Your estimated wait time with Dr. ${targetApp.doctorName} has ${directionalWord} by ${Math.abs(diff)} min. New estimate: ${newWait} min ${reasonNotice}`,
              type: 'WaitTimeUpdate',
              relatedAppointmentId: targetApp.id
            }).catch(err => console.error(`Failed to notify patient ${targetApp.patientUid}:`, err))
          );
        }
      }

      // Finalize updates
      await Promise.allSettled(batchPromises);
      await Promise.allSettled(notificationPromises);

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Failed to update appointment:", error);
      setErrorMessage(`Error: ${error.message || 'Could not update the appointment. Please check your connection or Firestore indexes.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNow = async () => {
    try {
      setIsLoading(true);
      const nowISO = new Date().toISOString();
      const appointmentRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        status: 'In-Progress',
        startedAtISO: nowISO,
        waitTimeUpdatedAt: nowISO
      });
      setStatus('In-Progress');
      setStartedAtISO(nowISO);
      onUpdate();
    } catch (error) {
      console.error('Failed to start appointment:', error);
      setErrorMessage('Failed to mark as started.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteNow = async () => {
    try {
      setIsLoading(true);
      const end = new Date();
      const endISO = end.toISOString();
      let start = startedAtISO ? new Date(startedAtISO) : new Date();
      if (!startedAtISO) start = new Date();
      const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
      
      const appointmentRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        status: 'Completed',
        startedAtISO: startedAtISO || start.toISOString(),
        completedAtISO: endISO,
        actualDurationMin: duration,
        resultNotes: notes || null,
        admitted: !!admitted,
        admissionNotes: admissionNotes || null,
        requiredInventory: (admitted && requiredInventory && requiredInventory.length > 0) ? requiredInventory.map(i => ({ name: i.name, qty: Number(i.qty) || 0 })) : [],
        visitType: visitType || 'OPD',
        bedBooking: !!bedBooking,
        receptionistWaitTimeOverride: receptionistWaitTimeOverride !== undefined ? Number(receptionistWaitTimeOverride) : null,
        waitTimeUpdatedAt: new Date().toISOString(),
        notified0Min: false,
      });
      setStatus('Completed');
      setCompletedAtISO(endISO);
      setActualDurationMin(duration);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to complete appointment:', error);
      setErrorMessage('Failed to mark as completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmit = () => {
    setAdmitted(!admitted);
    if (admitted) {
      setAdmissionNotes('');
      setRequiredInventory([]);
    }
  };

  const handleAddInventoryItem = () => setRequiredInventory(prev => [...prev, { name: '', qty: 1 }]);
  
  const handleInventoryNameChange = (idx: number, value: string) => {
    setRequiredInventory(prev => prev.map((it, i) => i === idx ? { ...it, name: value } : it));
  };
  
  const handleInventoryQtyChange = (idx: number, value: number) => {
    const qty = Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
    setRequiredInventory(prev => prev.map((it, i) => i === idx ? { ...it, qty } : it));
  };
  
  const handleRemoveInventoryItem = (idx: number) => {
    setRequiredInventory(prev => prev.filter((_, i) => i !== idx));
  };

  if (!isOpen) return null;

  const commonInputClasses = "mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-emerald-500 focus:border-emerald-500";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-xl md:max-w-3xl relative max-h-[95vh] overflow-y-auto border dark:border-gray-700">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Close">
          <CloseIcon />
        </button>
        
        <div className="mb-6">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Update Consultation</h2>
            <div className="flex items-center gap-2 mt-2">
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight">
                    Patient: {appointment.patientName}
                </span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">
                    ID: {appointment.id.toUpperCase()}
                </span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="status" className={commonLabelClasses}>Current Status</label>
                <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Appointment['status'])}
                className={commonInputClasses}
                >
                <option value="Confirmed">Confirmed</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No-show">No-show</option>
                </select>
            </div>
            <div>
                <label className={commonLabelClasses}>Visit Type</label>
                <select
                    value={visitType || 'OPD'}
                    onChange={(e) => setVisitType(e.target.value as any)}
                    className={commonInputClasses}
                >
                    <option value="OPD">OPD</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Emergency">Emergency</option>
                </select>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Started At</label>
              <p className="font-mono text-gray-900 dark:text-white">{startedAtISO ? new Date(startedAtISO).toLocaleTimeString() : 'Not started'}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Completed At</label>
              <p className="font-mono text-gray-900 dark:text-white">{completedAtISO ? new Date(completedAtISO).toLocaleTimeString() : 'Not completed'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label htmlFor="wait-override" className={commonLabelClasses}>Manual Wait Time (min)</label>
              <input
                id="wait-override"
                type="number"
                min="0"
                value={receptionistWaitTimeOverride ?? ''}
                onChange={(e) => setReceptionistWaitTimeOverride(e.target.value ? Number(e.target.value) : undefined)}
                className={commonInputClasses}
                placeholder="AI Predicted"
              />
            </div>
            <p className="text-[11px] text-gray-500 italic leading-tight">
                Setting this will manually override the AI estimate and notify the patient. The value will decay every minute automatically.
            </p>
          </div>

          <div>
            <label htmlFor="notes" className={commonLabelClasses}>Consultation Notes</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={commonInputClasses}
              placeholder="Diagnosis, prescription, advice..."
            />
          </div>

          <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-100">Admit Patient</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Mark if specialized ward care is required.</p>
              </div>
              <button
                type="button"
                onClick={handleToggleAdmit}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${admitted ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${admitted ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {admitted && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <label htmlFor="admissionNotes" className={commonLabelClasses}>Admission Instructions</label>
                  <textarea
                    id="admissionNotes"
                    rows={2}
                    value={admissionNotes}
                    onChange={(e) => setAdmissionNotes(e.target.value)}
                    className={commonInputClasses}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={commonLabelClasses}>Required Inventory</label>
                    <button type="button" onClick={handleAddInventoryItem} className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 underline">Add Item</button>
                  </div>
                  <div className="space-y-2">
                    {requiredInventory.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <select
                          value={item.name}
                          onChange={(e) => handleInventoryNameChange(idx, e.target.value)}
                          className={`${commonInputClasses} flex-1`}
                        >
                          <option value="">Select item</option>
                          {INVENTORY_ITEMS.map((inv) => <option key={inv} value={inv}>{inv}</option>)}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleInventoryQtyChange(idx, Number(e.target.value))}
                          className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                        />
                        <button type="button" onClick={() => handleRemoveInventoryItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMessage && <p className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">{errorMessage}</p>}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="flex-1 flex gap-3">
              <button type="button" onClick={handleStartNow} disabled={isLoading || status === 'In-Progress' || !!startedAtISO} className="flex-1 px-4 py-3 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-blue-500/20">
                Start Now
              </button>
              <button type="button" onClick={handleCompleteNow} disabled={isLoading} className="flex-1 px-4 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-emerald-500/20">
                Complete
              </button>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black uppercase tracking-widest text-xs rounded-xl hover:scale-105 transition-all shadow-xl">
                {isLoading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentResultModal;
