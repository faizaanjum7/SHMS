import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const RequireRole: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { userProfile, loading } = useAuth();
  if (loading) return null;
  const role: UserRole | undefined = userProfile?.role as UserRole | undefined;
  if (!role || !roles.includes(role)) {
    return <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md"><h1 className="text-2xl font-bold">Access Denied</h1><p className="mt-2">You do not have permission to view this page.</p></div>;
  }
  return <>{children}</>;
};

export const RedirectIfAuthed: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <>{children}</>;
  const role: UserRole | undefined = userProfile?.role as UserRole | undefined;
  if (role === UserRole.MEDICAL_ADMIN) return <Navigate to="/admin-inventory" replace />;
  if (role === UserRole.DOCTOR || role === UserRole.RECEPTIONIST || role === UserRole.HOSPITAL_STAFF) return <Navigate to="/dashboard" replace />;
  if (role === UserRole.PATIENT) return <Navigate to="/book-appointment" replace />;
  return <Navigate to="/" replace />;
};

export const HomeOrRoleLanding: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <>{children}</>;
  const role: UserRole | undefined = userProfile?.role as UserRole | undefined;
  if (role === UserRole.MEDICAL_ADMIN) return <Navigate to="/admin-inventory" replace />;
  if (role === UserRole.DOCTOR || role === UserRole.RECEPTIONIST || role === UserRole.HOSPITAL_STAFF) return <Navigate to="/dashboard" replace />;
  if (role === UserRole.PATIENT) return <Navigate to="/book-appointment" replace />;
  return <>{children}</>;
};
