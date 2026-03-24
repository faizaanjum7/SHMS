import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Appointment } from '../types';
import CloseIcon from './icons/CloseIcon';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onUpdate: () => void;
}

const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({ isOpen, onClose, appointment, onUpdate }) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage("Please provide a reason for cancelling.");
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const appointmentRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        status: 'Cancelled',
        cancellationReason: reason,
      });
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Failed to cancel appointment:", error);
       if (error.code === 'permission-denied') {
            setErrorMessage("Permission Denied: Your account cannot perform this action. Please check your Firestore security rules to ensure patients can update their own appointments to a 'Cancelled' status.");
        } else {
            setErrorMessage("Could not cancel the appointment. Please try again.");
        }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  
  const commonInputClasses = "mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-emerald-500 focus:border-emerald-500";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
          <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Cancel Appointment</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You are cancelling your appointment with Dr. {appointment.doctorName} on {appointment.date}.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reason" className={commonLabelClasses}>Reason for Cancellation <span className="text-red-500">*</span></label>
            <textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={commonInputClasses}
              placeholder="e.g., Schedule conflict, feeling better..."
              required
            />
          </div>

          {errorMessage && <p className="text-sm text-red-500 dark:text-red-400">{errorMessage}</p>}
          
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition">
              Keep Appointment
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-red-400 transition">
              {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;