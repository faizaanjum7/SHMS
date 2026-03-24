import React from 'react';
import { firebaseConfig } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const FirebaseConnectionStatus: React.FC = () => {
  const { currentUser } = useAuth();
  const projectId = firebaseConfig.projectId || 'Not Configured';

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 1000,
      fontFamily: 'monospace',
      lineHeight: '1.6'
    }}>
      <div><strong>Project ID:</strong> {projectId}</div>
      <div><strong>Auth Status:</strong> {currentUser ? `Logged In As` : 'Logged Out'}</div>
      {currentUser && <div style={{ color: '#66ff66' }}><strong>Email:</strong> {currentUser.email}</div>}
    </div>
  );
};

export default FirebaseConnectionStatus;
