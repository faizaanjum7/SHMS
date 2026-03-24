import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Appointment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CloseIcon from './icons/CloseIcon';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSuccess: () => void;
}

const StarRating: React.FC<{ 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
}> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <p className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">{label}</p>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition-all hover:scale-125 ${
            star <= value ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  </div>
);

const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({ isOpen, onClose, appointment, onSuccess }) => {
  const { currentUser } = useAuth();
  const [doctorRating, setDoctorRating] = useState(5);
  const [hospitalRating, setHospitalRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'reviews'), {
        patientUid: currentUser.uid,
        patientName: appointment.patientName,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        hospital: appointment.hospital,
        appointmentId: appointment.id,
        doctorRating,
        hospitalRating,
        comment,
        createdAt: new Date().toISOString(),
      });

      // Update the appointment document to mark it as reviewed
      const appRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appRef, { reviewed: true });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-lg relative border border-gray-100 dark:border-gray-700">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <CloseIcon />
        </button>

        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">How was your visit?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Your feedback helps us improve our services for everyone.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <StarRating 
              label={`Dr. ${appointment.doctorName}`} 
              value={doctorRating} 
              onChange={setDoctorRating} 
            />
            <StarRating 
              label="The Hospital" 
              value={hospitalRating} 
              onChange={setHospitalRating} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Your Experience</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 h-32"
              placeholder="Tell us what you liked or what could be better..."
            />
          </div>

          {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveReviewModal;
