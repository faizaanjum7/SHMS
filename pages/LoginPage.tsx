import React, { useState, useEffect } from 'react';
// Fix: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { auth, db } from '../services/firebase';
// Fix: Added firebase v9 modular imports for auth functions.
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { HOSPITALS } from '../constants';

const LoginPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.PATIENT);
  // Fix: Replaced useHistory with useNavigate.
  const navigate = useNavigate();

  // Form state
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [license, setLicense] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [hospital, setHospital] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  // Reset form when view or role changes
  useEffect(() => {
    setEmailOrUsername('');
    setPassword('');
    setFullName('');
    setLicense('');
    setSpecialty('');
    setEmployeeId('');
    setHospital('');
    setErrorMessage('');
    setSuccessMessage('');
  }, [isLoginView, selectedRole]);

  const getFirebaseEmail = (input: string, role: UserRole): string => {
    if (role === UserRole.PATIENT) {
      // For patients, create a dummy email from their username. This email doesn't
      // need to be real, just a unique identifier for Firebase Auth. It must be
      // a valid email format.
      return `${input.toLowerCase().replace(/\s/g, '')}@shms-patient.local`;
    }
    return input; // For other roles, the input is the actual email.
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const firebaseEmail = getFirebaseEmail(emailOrUsername, selectedRole);
      // Fix: Updated to Firebase v9 auth method.
      const userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error("Login failed, user not found.");
      }

      // For non-patients, enforce email verification
      if (selectedRole !== UserRole.PATIENT && !user.emailVerified) {
        setErrorMessage('Please verify your email before logging in. Another verification email has been sent.');
        // Fix: Updated to Firebase v9 user method.
        await sendEmailVerification(user);
        // Fix: Updated to Firebase v9 auth method.
        await signOut(auth); // Log out user until they are verified
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Login successful! Redirecting...');
      // Fetch user profile to determine role and route accordingly
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        const role = userSnap.exists() ? (userSnap.data() as any).role : selectedRole;
        const go = (path: string) => setTimeout(() => navigate(path), 800);
        if (role === UserRole.MEDICAL_ADMIN) go('/admin-inventory');
        else if (role === UserRole.PATIENT) go('/book-appointment');
        else if ([UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.HOSPITAL_STAFF].includes(role)) go('/dashboard');
        else go('/');
      } catch {
        // Fallback if profile read fails
        setTimeout(() => navigate('/'), 800);
      }

    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const missingFields: string[] = [];
      if (!emailOrUsername) {
        missingFields.push(selectedRole === UserRole.PATIENT ? 'Username' : 'Email address');
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
      }
      if (selectedRole === UserRole.DOCTOR) {
        if (!license) missingFields.push('Medical License No.');
        if (!specialty) missingFields.push('Specialization');
      }
      if (selectedRole !== UserRole.PATIENT) {
        if (!hospital) missingFields.push('Hospital');
      }
      if ([UserRole.MEDICAL_ADMIN, UserRole.HOSPITAL_STAFF, UserRole.RECEPTIONIST].includes(selectedRole)) {
        if (!employeeId) missingFields.push('Employee ID');
      }
      if (missingFields.length) {
        setErrorMessage(`Please fill: ${missingFields.join(', ')}`);
        setIsLoading(false);
        return;
      }

      const firebaseEmail = getFirebaseEmail(emailOrUsername, selectedRole);
      // Fix: Updated to Firebase v9 auth method.
      const userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
      const user = userCredential.user;
      
      if (!user) {
        throw new Error("Registration failed, user not created.");
      }

      // --- Store user data in Firestore ---
      const userData = {
        uid: user.uid,
        role: selectedRole,
        fullName,
        email: selectedRole !== UserRole.PATIENT ? emailOrUsername : null,
        username: selectedRole === UserRole.PATIENT ? emailOrUsername : null,
        license: selectedRole === UserRole.DOCTOR ? license : null,
        specialty: selectedRole === UserRole.DOCTOR ? specialty : null,
        hospital: selectedRole !== UserRole.PATIENT ? hospital : null,
        employeeId: [UserRole.MEDICAL_ADMIN, UserRole.HOSPITAL_STAFF, UserRole.RECEPTIONIST].includes(selectedRole) ? employeeId : null,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", user.uid), userData);


      if (selectedRole === UserRole.PATIENT) {
        // For patients, registration is complete. Log them in by redirecting.
        setSuccessMessage('Registration successful! Redirecting...');
        setTimeout(() => navigate('/book-appointment'), 1000);
      } else {
        // For other roles, send verification email and switch to login view.
        // Fix: Updated to Firebase v9 user method.
        await sendEmailVerification(user);
        setSuccessMessage('Registration successful! A verification link has been sent to your email.');
        setTimeout(() => {
          setIsLoginView(true);
          setSuccessMessage('');
        }, 3000);
      }
      
    } catch (error: any) {
      const code = error?.code as string | undefined;
      let message = error?.message || 'Failed to register.';
      switch (code) {
        case 'auth/email-already-in-use':
          message = 'This email/username is already registered. Try logging in instead.';
          break;
        case 'auth/invalid-email':
          message = 'Enter a valid email address.';
          break;
        case 'auth/weak-password':
          message = 'Password must be at least 6 characters long.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Check your internet connection and try again.';
          break;
        case 'permission-denied':
          message = 'Could not save your profile. Please ensure you are signed in and try again.';
          break;
      }
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "peer h-10 w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-transparent focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500";
  const labelClass = "absolute left-0 -top-3.5 text-gray-600 dark:text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 dark:peer-focus:text-gray-400 peer-focus:text-sm";
  const selectClass = "w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-md";


  const renderRegistrationFields = () => (
    <>
      <div className="relative">
        <input id="name" name="name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputClass} placeholder="John Doe" />
        <label htmlFor="name" className={labelClass}>Full Name</label>
      </div>
      {selectedRole === UserRole.DOCTOR && (
        <>
          <div className="relative">
            <input id="license" name="license" type="text" value={license} onChange={e => setLicense(e.target.value)} required className={inputClass} placeholder="Med12345" />
            <label htmlFor="license" className={labelClass}>Medical License No.</label>
          </div>
          <div className="relative">
            <input id="specialty" name="specialty" type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} required className={inputClass} placeholder="Cardiology" />
            <label htmlFor="specialty" className={labelClass}>Specialization</label>
          </div>
        </>
      )}
      {selectedRole !== UserRole.PATIENT && (
        <div className="space-y-1">
            <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hospital</label>
            <select id="hospital" name="hospital" value={hospital} onChange={e => setHospital(e.target.value)} required className={selectClass}>
                <option value="" disabled>Select a hospital</option>
                {HOSPITALS.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
            </select>
        </div>
      )}
      {[UserRole.MEDICAL_ADMIN, UserRole.HOSPITAL_STAFF, UserRole.RECEPTIONIST].includes(selectedRole) && (
        <div className="relative">
          <input id="employeeId" name="employeeId" type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required className={inputClass} placeholder="EMP123" />
          <label htmlFor="employeeId" className={labelClass}>Employee ID</label>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <Link to="/" className="flex items-center justify-center space-x-2">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">SHMS Portal</span>
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex border-b-2 border-gray-200 dark:border-gray-700 mb-6">
            <button onClick={() => setIsLoginView(true)} className={`w-1/2 py-3 text-center font-semibold transition-colors duration-300 ${isLoginView ? 'text-emerald-600 dark:text-emerald-500 border-b-2 border-emerald-600 dark:border-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>Login</button>
            <button onClick={() => setIsLoginView(false)} className={`w-1/2 py-3 text-center font-semibold transition-colors duration-300 ${!isLoginView ? 'text-emerald-600 dark:text-emerald-500 border-b-2 border-emerald-600 dark:border-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>Register</button>
          </div>
          
          <form onSubmit={isLoginView ? handleLogin : handleRegister} className="space-y-8">
            <div className="mb-6">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a...</label>
              <select id="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className={selectClass}>
                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            <div className="relative">
              <input 
                id="loginId" 
                name="loginId"
                type={selectedRole === UserRole.PATIENT ? 'text' : 'email'} 
                value={emailOrUsername} 
                onChange={e => setEmailOrUsername(e.target.value)} 
                required 
                className={inputClass} 
                placeholder={selectedRole === UserRole.PATIENT ? 'johndoe123' : 'john@doe.com'}
              />
              <label 
                htmlFor="loginId" 
                className={labelClass}
              >
                {selectedRole === UserRole.PATIENT ? 'Username' : 'Email address'}
              </label>
            </div>
            
            <div className="relative">
              <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} placeholder="Password" />
              <label htmlFor="password" className={labelClass}>Password</label>
            </div>
            
            {!isLoginView && renderRegistrationFields()}

            {errorMessage && <p className="text-sm text-red-500 dark:text-red-400 text-center">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-green-600 dark:text-green-400 text-center">{successMessage}</p>}
            
            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 disabled:bg-emerald-400">
              {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
            </button>
            
            {isLoginView && <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              <button type="button" onClick={() => setIsForgotPasswordModalOpen(true)} className="hover:text-emerald-600 dark:hover:text-emerald-500">Forgot password?</button>
            </div>}
          </form>
        </div>
      </div>
       <ForgotPasswordModal 
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </div>
  );
};

export default LoginPage;