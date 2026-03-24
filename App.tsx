import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DoctorsPage from './pages/DoctorsPage';
import DoctorDetailsPage from './pages/DoctorDetailsPage';
import HospitalsPage from './pages/HospitalsPage';
import HospitalDetailsPage from './pages/HospitalDetailsPage';
import BookingPage from './pages/BookingPage';
import SupportPage from './pages/SupportPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import SettingsPage from './pages/SettingsPage';
import AdminInventoryPage from './pages/AdminInventoryPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';
import AdminInventoryAlertsPage from './pages/AdminInventoryAlertsPage';
import { RequireAuth, RequireRole, RedirectIfAuthed } from './components/RouteGuards';
import { UserRole } from './types';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-800 dark:text-gray-200">
          <HashRouter>
            <Routes>
              <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
              <Route path="/doctors" element={<MainLayout><DoctorsPage /></MainLayout>} />
              <Route path="/doctors/:id" element={<MainLayout><DoctorDetailsPage /></MainLayout>} />
              <Route path="/hospitals" element={<MainLayout><HospitalsPage /></MainLayout>} />
              <Route path="/hospitals/:id" element={<MainLayout><HospitalDetailsPage /></MainLayout>} />
              <Route path="/support" element={<MainLayout><SupportPage /></MainLayout>} />
              <Route path="/settings" element={<MainLayout><RequireAuth><SettingsPage /></RequireAuth></MainLayout>} />
              <Route path="/history" element={<MainLayout><RequireAuth><HistoryPage /></RequireAuth></MainLayout>} />
              <Route path="/dashboard" element={<MainLayout><RequireAuth><RequireRole roles={[UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.HOSPITAL_STAFF, UserRole.MEDICAL_ADMIN]}><DashboardPage /></RequireRole></RequireAuth></MainLayout>} />
              <Route path="/admin-inventory" element={<MainLayout><RequireAuth><RequireRole roles={[UserRole.MEDICAL_ADMIN]}><AdminInventoryPage /></RequireRole></RequireAuth></MainLayout>} />
              <Route path="/admin-inventory-alerts" element={<MainLayout><RequireAuth><RequireRole roles={[UserRole.MEDICAL_ADMIN]}><AdminInventoryAlertsPage /></RequireRole></RequireAuth></MainLayout>} />
              <Route path="/book-appointment" element={<MainLayout><RequireAuth><RequireRole roles={[UserRole.PATIENT]}><BookingPage /></RequireRole></RequireAuth></MainLayout>} />
              <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
              <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            </Routes>
          </HashRouter>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;