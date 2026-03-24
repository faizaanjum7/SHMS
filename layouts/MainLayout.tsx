import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FirebaseConnectionStatus from '../components/FirebaseConnectionStatus';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import HospitalSelectModal from '../components/HospitalSelectModal';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const isNonPatient = userProfile?.role && userProfile.role !== UserRole.PATIENT;
  const needsHospital = Boolean(currentUser && isNonPatient && !userProfile?.hospital);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
      <FirebaseConnectionStatus />

      <HospitalSelectModal
        isOpen={needsHospital}
        userUid={currentUser?.uid || ''}
        currentHospital={userProfile?.hospital}
        onSaved={refreshUserProfile}
      />
    </div>
  );
};

export default MainLayout;