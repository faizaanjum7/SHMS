import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../services/firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!currentUser || !auth.currentUser) {
      setErrorMessage("Could not verify user. Please log in again.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');

    const userToDelete = auth.currentUser;
    const userDocRef = doc(db, "users", currentUser.uid);

    try {
      // Step 1: Delete the user from Firebase Authentication. This is the critical action.
      await deleteUser(userToDelete);

      // Step 2: If Auth deletion succeeds, then clean up the Firestore document.
      // This is a secondary cleanup step. If it fails, the account is still deleted.
      try {
        await deleteDoc(userDocRef);
      } catch (firestoreError) {
        console.error("Firestore document deletion failed after Auth user was deleted:", firestoreError);
        // We don't show this error to the user, as their account is effectively gone.
      }

      // Step 3: Navigate away. The onAuthStateChanged listener will handle cleanup.
      onClose();
      navigate('/');
      
    } catch (error: any) {
      console.error("Account deletion error:", error);
      if (error.code === 'auth/requires-recent-login') {
        setErrorMessage("This is a sensitive security action. To proceed, please log out and log back in before deleting your account.");
      } else {
        setErrorMessage("An error occurred while deleting your account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-4">Delete Account</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Are you sure you want to permanently delete your account? All your data, including appointment history, will be lost.
          <br />
          <strong className="dark:text-red-400">This action cannot be undone.</strong>
        </p>

        {errorMessage && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{errorMessage}</p>}

        <div className="flex justify-end space-x-4">
          <button onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-red-400 transition">
            {isLoading ? 'Deleting...' : 'Confirm Deletion'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;