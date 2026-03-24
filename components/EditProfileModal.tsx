import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc, DocumentData } from 'firebase/firestore';
import { UserRole } from '../types';
import CloseIcon from './icons/CloseIcon';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: DocumentData;
  onProfileUpdate: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, userProfile, onProfileUpdate }) => {
  const [formData, setFormData] = useState({ ...userProfile });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setFormData({ ...userProfile });
    setErrorMessage('');
    setSuccessMessage('');
  }, [userProfile, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setErrorMessage('Full Name cannot be empty.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const userDocRef = doc(db, "users", userProfile.uid);
      await updateDoc(userDocRef, {
        fullName: formData.fullName,
        license: formData.license || null,
        specialty: formData.specialty || null,
        employeeId: formData.employeeId || null,
      });
      setSuccessMessage('Profile updated successfully!');
      onProfileUpdate();
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error: any) {
      setErrorMessage('Failed to update profile. Please try again.');
      console.error("Profile update error:", error);
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className={commonLabelClasses}>Full Name</label>
            <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} className={commonInputClasses} required />
          </div>

          {userProfile.role === UserRole.PATIENT && (
             <div>
                <label htmlFor="username" className={commonLabelClasses}>Username</label>
                <input type="text" id="username" name="username" value={formData.username} className={`${commonInputClasses} bg-gray-100 dark:bg-gray-600 cursor-not-allowed`} readOnly />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Username cannot be changed.</p>
             </div>
          )}

          {userProfile.role === UserRole.DOCTOR && (
            <>
              <div>
                <label htmlFor="license" className={commonLabelClasses}>Medical License No.</label>
                <input type="text" id="license" name="license" value={formData.license || ''} onChange={handleChange} className={commonInputClasses} />
              </div>
              <div>
                <label htmlFor="specialty" className={commonLabelClasses}>Specialization</label>
                <input type="text" id="specialty" name="specialty" value={formData.specialty || ''} onChange={handleChange} className={commonInputClasses} />
              </div>
            </>
          )}

          {[UserRole.MEDICAL_ADMIN, UserRole.HOSPITAL_STAFF].includes(userProfile.role) && (
            <div>
              <label htmlFor="employeeId" className={commonLabelClasses}>Employee ID</label>
              <input type="text" id="employeeId" name="employeeId" value={formData.employeeId || ''} onChange={handleChange} className={commonInputClasses} />
            </div>
          )}
          
          {errorMessage && <p className="text-sm text-red-500 dark:text-red-400">{errorMessage}</p>}
          {successMessage && <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>}

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 transition">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
