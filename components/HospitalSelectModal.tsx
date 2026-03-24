import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { HOSPITALS } from '../constants';
import CloseIcon from './icons/CloseIcon';

interface HospitalSelectModalProps {
  isOpen: boolean;
  userUid: string;
  currentHospital?: string;
  onSaved: () => void;
}

const HospitalSelectModal: React.FC<HospitalSelectModalProps> = ({ isOpen, userUid, currentHospital, onSaved }) => {
  const [hospital, setHospital] = useState<string>(currentHospital || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setHospital(currentHospital || '');
    setError('');
  }, [currentHospital, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) {
      setError('Please select a hospital.');
      return;
    }
    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', userUid);
      await updateDoc(userRef, { hospital });
      onSaved();
    } catch (err) {
      console.error('Failed to save hospital:', err);
      setError('Failed to save hospital. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close" onClick={onSaved}>
          <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Select Your Hospital</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please choose the hospital you work under to continue.</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hospital</label>
            <select
              id="hospital"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">-- Select hospital --</option>
              {HOSPITALS.map(h => (
                <option key={h.id} value={h.name}>{h.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" disabled={isLoading || !hospital} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 transition">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalSelectModal;
