import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import DeleteAccountModal from '../components/DeleteAccountModal';

const SettingsPage: React.FC = () => {
  const { userProfile, refreshUserProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleProfileUpdate = async () => {
    await refreshUserProfile();
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000); // Hide message after 3 seconds
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">Settings</h1>
      
      {updateSuccess && (
        <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-500/50 text-sm text-green-700 dark:text-green-300 rounded-md">
            Profile updated successfully!
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profile</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
            <p className="text-gray-800 dark:text-gray-200">{userProfile?.fullName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Account Email / Username</label>
            <p className="text-gray-800 dark:text-gray-200">{userProfile?.email || userProfile?.username || 'No login identifier found'}</p>
          </div>
          <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 transition">
            Edit Profile
          </button>
        </div>
      </div>
      
      {/* Account Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Account</h2>
        <div className="mt-4 space-y-4">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50" disabled>
            Change Password
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">Password changes are handled via the 'Forgot Password' link on the login page for staff accounts.</p>
          <div>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-500">Delete Account</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
            <button onClick={() => setIsDeleteModalOpen(true)} className="mt-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition">
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {isEditModalOpen && userProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default SettingsPage;
