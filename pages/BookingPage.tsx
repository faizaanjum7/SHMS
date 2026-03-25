import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HOSPITALS, APPOINTMENT_TIME_SLOTS, DOCTORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { UserRole } from '../types';
import { useLocation } from 'react-router-dom';

const BookingPage: React.FC = () => {
  const location = useLocation();
  const suggestedSpecialty = location.state?.suggestedSpecialty;

  const { currentUser, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [allDoctors, setAllDoctors] = useState<DocumentData[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  const [bookingDetails, setBookingDetails] = useState({
    hospital: '',
    department: suggestedSpecialty || '',
    doctorId: '',
    doctorName: '',
    date: '',
    appointmentTime: '',
    patientName: '',
    patientContact: '',
    patientDOB: '',
    patientGender: '',
    reasonForVisit: '',
    visitType: 'OPD' as 'OPD' | 'Surgery' | 'Emergency',
    bedBooking: false,
    previousPrescriptions: '',
    reports: '',
    wheelchairSupport: false,
    languagePreference: '',
    specificDoctorPreference: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (currentUser && userProfile) {
        setBookingDetails(prev => ({ ...prev, patientName: userProfile.fullName }));
    }
  }, [currentUser, userProfile]);

  useEffect(() => {
    const fetchDoctors = async () => {
        setDoctorsLoading(true);
        setErrorMessage('');
        try {
            // Fetch from 'doctors' collection primarily
            const doctorsRef = collection(db, "doctors");
            const snap = await getDocs(doctorsRef);
            let doctorsList = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

            // Fallback to 'users' if empty
            if (doctorsList.length === 0) {
              const doctorsQuery = query(collection(db, "users"), where("role", "==", UserRole.DOCTOR));
              const querySnapshot = await getDocs(doctorsQuery);
              doctorsList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            }
            setAllDoctors(doctorsList);
        } catch (error: any) {
            console.error("Failed to fetch doctors:", error);
            setErrorMessage("Could not load medical experts. Please try again.");
        } finally {
            setDoctorsLoading(false);
        }
    };
    fetchDoctors();
  }, []);

  // Name helpers: normalize and standardize display once
  const normalizeDoctorName = (name: string) => name
    .replace(/^\s*dr\.?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const displayDoctorName = (name: string) => `Dr. ${normalizeDoctorName(name)}`;

  // Fallback: map constants DOCTORS to the UI/Firestore-like shape
  const fallbackDoctors = useMemo(() => DOCTORS.map(d => ({
    uid: `const-${d.id}`,
    fullName: displayDoctorName(d.name),
    hospital: d.hospital,
    specialty: d.specialty,
    _normalizedName: normalizeDoctorName(d.name),
    _source: 'const' as const,
  })), []);

  // Combine Firestore doctors with fallback constants so selectors always populate
  const combinedDoctors = useMemo(() => {
    // Build a map keyed by normalized name + hospital + specialty
    const byKey = new Map<string, any>();

    // First, add Firestore doctors (preferred)
    for (const d of allDoctors) {
      const normalized = normalizeDoctorName(String(d.fullName || ''));
      const key = `${normalized}|${d.hospital}|${d.specialty}`;
      if (!byKey.has(key)) {
        byKey.set(key, {
          ...d,
          fullName: displayDoctorName(String(d.fullName || '')),
          _normalizedName: normalized,
          _source: 'db' as const,
        });
      }
    }

    // Then, add fallback constants only if not present
    for (const d of fallbackDoctors) {
      const key = `${d._normalizedName}|${d.hospital}|${d.specialty}`;
      if (!byKey.has(key)) {
        byKey.set(key, d);
      }
    }

    return Array.from(byKey.values());
  }, [allDoctors, fallbackDoctors]);

  const departments = useMemo(() => {
    if (!bookingDetails.hospital || combinedDoctors.length === 0) return [];
    const hospitalDoctors = combinedDoctors.filter(d => d.hospital === bookingDetails.hospital);
    return [...new Set(hospitalDoctors.map(d => d.specialty))].sort();
  }, [combinedDoctors, bookingDetails.hospital]);

  const availableDoctors = useMemo(() => {
    if (!bookingDetails.hospital || !bookingDetails.department || combinedDoctors.length === 0) return [];
    return combinedDoctors.filter(d => d.hospital === bookingDetails.hospital && d.specialty === bookingDetails.department);
  }, [combinedDoctors, bookingDetails.hospital, bookingDetails.department]);

  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (step === 1) {
        if (!bookingDetails.hospital) newErrors.hospital = 'Hospital selection is required.';
        if (!bookingDetails.department) newErrors.department = 'Department selection is required.';
    } else if (step === 2) {
        if (!bookingDetails.doctorId) newErrors.doctor = 'Doctor selection is required.';
        if (!bookingDetails.date) newErrors.date = 'Please select a date.';
        if (!bookingDetails.appointmentTime) newErrors.appointmentTime = 'Please select a time slot.';
    } else if (step === 3) {
        if (!bookingDetails.patientName) newErrors.patientName = 'Full name is required.';
        if (!bookingDetails.patientDOB) newErrors.patientDOB = 'Date of birth is required.';
        if (!bookingDetails.patientGender) newErrors.patientGender = 'Gender is required.';
        if (!bookingDetails.patientContact) newErrors.patientContact = 'Contact number is required.';
        if (!bookingDetails.reasonForVisit) newErrors.reasonForVisit = 'Reason for visit is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
      if (validateStep()) {
          setStep(prev => prev + 1);
      }
  };
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
        setErrorMessage("You must be logged in to book an appointment.");
        return;
    }
     if (!validateStep()) {
        return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
        // Double booking check
        const q = query(
          collection(db, 'appointments'),
          where('doctorId', '==', bookingDetails.doctorId),
          where('date', '==', bookingDetails.date),
          where('appointmentTime', '==', bookingDetails.appointmentTime),
          where('status', '!=', 'Cancelled')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setErrorMessage('This slot is already booked. Please select another time or doctor.');
          setIsLoading(false);
          return;
        }

        const appointmentData = {
            patientUid: currentUser.uid,
            hospital: bookingDetails.hospital,
            department: bookingDetails.department,
            doctorId: bookingDetails.doctorId,
            doctorName: bookingDetails.doctorName,
            date: bookingDetails.date,
            appointmentTime: bookingDetails.appointmentTime,
            patientName: bookingDetails.patientName,
            patientContact: bookingDetails.patientContact,
            patientDOB: bookingDetails.patientDOB,
            patientGender: bookingDetails.patientGender,
            reasonForVisit: bookingDetails.reasonForVisit,
            visitType: bookingDetails.visitType,
            bedBooking: bookingDetails.bedBooking,
            status: 'Confirmed',
            createdAt: serverTimestamp(),
            waitTimeUpdatedAt: new Date().toISOString(),
            previousPrescriptions: bookingDetails.previousPrescriptions || null,
            reports: bookingDetails.reports || null,
            specialRequests: {
                wheelchairSupport: bookingDetails.wheelchairSupport,
                languagePreference: bookingDetails.languagePreference || null,
                specificDoctorPreference: bookingDetails.specificDoctorPreference || null,
            },
        };

        await addDoc(collection(db, 'appointments'), appointmentData);
        handleNext();
    } catch (error: any) {
        console.error("Detailed booking error:", error);
        if (error.code === 'permission-denied') {
            setErrorMessage('Permission Denied: Your account does not have permission to book appointments. This is an issue with the database security rules in your Firebase project, not the app. Please ensure your Firestore rules allow authenticated users to write to the "appointments" collection.');
        } else {
            setErrorMessage(`Failed to book appointment: ${error.message || 'Please check your connection and try again.'}`);
        }
    } finally {
        setIsLoading(false);
    }
  };
  
  const commonInputClasses = "mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setBookingDetails(prev => ({...prev, [name]: val}));
    if(errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const handleHospitalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBookingDetails({
      ...bookingDetails,
      hospital: e.target.value,
      department: '',
      doctorId: '',
      doctorName: '',
    });
     if (errors.hospital) setErrors(prev => ({ ...prev, hospital: '' }));
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBookingDetails({
      ...bookingDetails,
      department: e.target.value,
      doctorId: '',
      doctorName: '',
    });
    if (errors.department) setErrors(prev => ({ ...prev, department: '' }));
  };

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [id, name] = e.target.value.split('|');
    setBookingDetails(prev => ({ ...prev, doctorId: id, doctorName: name }));
    if(errors.doctor) {
      setErrors(prev => ({...prev, doctor: ''}));
    }
  };

  // visitType and bedBooking are set by receptionist later; no patient controls needed
  
  if (!currentUser) {
    return (
        <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 text-center mb-8">Book an Appointment</h1>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Please Login to Continue</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-4">You need to be logged in to book an appointment. Please log in or create an account to proceed.</p>
                <Link to="/login" className="mt-6 inline-block px-8 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-transform transform hover:scale-105 duration-300">
                    Login / Register
                </Link>
            </div>
        </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Step 1: Select Hospital & Department</h2>
            <div className="space-y-4">
              <div>
                <label className={commonLabelClasses}>Hospital <span className="text-red-500">*</span></label>
                <select name="hospital" className={commonInputClasses} value={bookingDetails.hospital} onChange={handleHospitalChange}>
                  <option value="">Select a hospital</option>
                  {HOSPITALS.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                </select>
                {errors.hospital && <p className="text-sm text-red-500 mt-1">{errors.hospital}</p>}
              </div>
              <div>
                <label className={commonLabelClasses}>Department <span className="text-red-500">*</span></label>
                <select 
                    name="department" 
                    className={commonInputClasses} 
                    value={bookingDetails.department} 
                    onChange={handleDepartmentChange} 
                    disabled={!bookingDetails.hospital || doctorsLoading || departments.length === 0}
                >
                   <option value="">
                        {doctorsLoading 
                            ? 'Loading doctors...' 
                            : !bookingDetails.hospital 
                            ? 'Select a hospital first'
                            : departments.length > 0
                            ? 'Select a department'
                            : 'No departments available'}
                   </option>
                   {departments.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                </select>
                 {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Step 2: Choose Doctor & Time</h2>
            <div className="space-y-4">
              <div>
                <label className={commonLabelClasses}>Doctor <span className="text-red-500">*</span></label>
                <select 
                    name="doctor"
                    className={commonInputClasses} 
                    value={`${bookingDetails.doctorId}|${bookingDetails.doctorName}`} 
                    onChange={handleDoctorChange} 
                    disabled={!bookingDetails.department || doctorsLoading || availableDoctors.length === 0}
                >
                  <option value="|">
                    {doctorsLoading
                        ? 'Loading...'
                        : !bookingDetails.department
                        ? 'Select a department first'
                        : availableDoctors.length > 0
                        ? 'Select a doctor'
                        : 'No doctors available for this department'}
                  </option>
                  {availableDoctors.map(d => <option key={d.uid} value={`${d.uid}|${d.fullName}`}>{d.fullName}</option>)}
                </select>
                {errors.doctor && <p className="text-sm text-red-500 mt-1">{errors.doctor}</p>}
              </div>
              {/* Visit type and bed booking are managed by receptionist post-checkup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={commonLabelClasses}>Date <span className="text-red-500">*</span></label>
                  <input name="date" type="date" className={commonInputClasses} value={bookingDetails.date} onChange={handleChange} min={new Date().toISOString().split("T")[0]} />
                  {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
                </div>
                <div>
                  <label className={commonLabelClasses}>Time Slot <span className="text-red-500">*</span></label>
                  <select name="appointmentTime" className={commonInputClasses} value={bookingDetails.appointmentTime} onChange={handleChange}>
                    <option value="">Select a time</option>
                    {APPOINTMENT_TIME_SLOTS.filter(time => {
                        const selectedDoctor = combinedDoctors.find(d => d.uid === bookingDetails.doctorId);
                        
                        // Check profile-based slots first
                        if (selectedDoctor?.availableSlots) {
                          const slot = selectedDoctor.availableSlots.find((s: any) => {
                            // Convert Firestore Timestamp to YYYY-MM-DD if needed
                            const slotDate = s.date?.toDate ? s.date.toDate().toISOString().split('T')[0] : s.date;
                            return slotDate === bookingDetails.date && s.time === time;
                          });
                          if (slot && slot.isBooked) return false;
                        }

                        if (bookingDetails.date !== new Date().toISOString().split("T")[0]) return true;
                        
                        const [hoursStr, minutesStr, meridiem] = time.match(/(\d+):(\d+)\s*([AP]M)/i)?.slice(1) || [];
                        let hours = parseInt(hoursStr, 10);
                        const minutes = parseInt(minutesStr, 10);
                        if (meridiem?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                        if (meridiem?.toUpperCase() === 'AM' && hours === 12) hours = 0;
                        
                        const slotTime = new Date();
                        slotTime.setHours(hours, minutes, 0, 0);
                        
                        const nowWithBuffer = new Date();
                        nowWithBuffer.setMinutes(nowWithBuffer.getMinutes() + 5);
                        
                        return slotTime > nowWithBuffer;
                    }).map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                  {errors.appointmentTime && <p className="text-sm text-red-500 mt-1">{errors.appointmentTime}</p>}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Step 3: Patient Details</h2>
            <div className="space-y-4">
               <div>
                <label className={commonLabelClasses}>Full Name <span className="text-red-500">*</span></label>
                <input name="patientName" type="text" placeholder="John Doe" className={commonInputClasses} value={bookingDetails.patientName} onChange={handleChange}/>
                {errors.patientName && <p className="text-sm text-red-500 mt-1">{errors.patientName}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={commonLabelClasses}>Date of Birth <span className="text-red-500">*</span></label>
                    <input name="patientDOB" type="date" className={commonInputClasses} value={bookingDetails.patientDOB} onChange={handleChange} />
                    {errors.patientDOB && <p className="text-sm text-red-500 mt-1">{errors.patientDOB}</p>}
                  </div>
                   <div>
                    <label className={commonLabelClasses}>Gender <span className="text-red-500">*</span></label>
                    <select name="patientGender" className={commonInputClasses} value={bookingDetails.patientGender} onChange={handleChange}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.patientGender && <p className="text-sm text-red-500 mt-1">{errors.patientGender}</p>}
                  </div>
              </div>
              <div>
                <label className={commonLabelClasses}>Contact Number <span className="text-red-500">*</span></label>
                <input name="patientContact" type="tel" placeholder="123-456-7890" className={commonInputClasses} value={bookingDetails.patientContact} onChange={handleChange} />
                {errors.patientContact && <p className="text-sm text-red-500 mt-1">{errors.patientContact}</p>}
              </div>
              <div>
                <label className={commonLabelClasses}>Reason for Visit <span className="text-red-500">*</span></label>
                <textarea name="reasonForVisit" rows={3} placeholder="Briefly describe your symptoms or reason for visit..." className={commonInputClasses} value={bookingDetails.reasonForVisit} onChange={handleChange} />
                {errors.reasonForVisit && <p className="text-sm text-red-500 mt-1">{errors.reasonForVisit}</p>}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Additional Information (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className={commonLabelClasses}>Previous Prescriptions</label>
                    <input name="previousPrescriptions" type="text" placeholder="Link or reference to previous prescriptions" className={commonInputClasses} value={bookingDetails.previousPrescriptions} onChange={handleChange} />
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Reports (X-rays, blood tests, etc.)</label>
                    <input name="reports" type="text" placeholder="Link or reference to medical reports" className={commonInputClasses} value={bookingDetails.reports} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Special Requests</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                    <input 
                        name="wheelchairSupport" 
                        type="checkbox" 
                        id="wheelchairSupport"
                        className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" 
                        checked={bookingDetails.wheelchairSupport} 
                        onChange={handleChange} 
                    />
                    <label htmlFor="wheelchairSupport" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Require Wheelchair Support
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={commonLabelClasses}>Language Preference</label>
                      <input name="languagePreference" type="text" placeholder="e.g. English, Hindi" className={commonInputClasses} value={bookingDetails.languagePreference} onChange={handleChange} />
                    </div>
                    <div>
                      <label className={commonLabelClasses}>Specific Doctor Preference</label>
                      <input name="specificDoctorPreference" type="text" placeholder="Any specific doctor details" className={commonInputClasses} value={bookingDetails.specificDoctorPreference} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
            <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h2 className="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-100">Appointment Booked Successfully!</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Your appointment has been saved. You can view it in your history.</p>
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left text-gray-800 dark:text-gray-200 space-y-2">
                    <p><strong>Patient:</strong> {bookingDetails.patientName}</p>
                    <p><strong>Doctor:</strong> {bookingDetails.doctorName} ({bookingDetails.department})</p>
                    <p><strong>Hospital:</strong> {bookingDetails.hospital}</p>
                    <p><strong>Date & Time:</strong> {bookingDetails.date} at {bookingDetails.appointmentTime}</p>
                    <p><strong>Reason:</strong> {bookingDetails.reasonForVisit}</p>
                </div>
                <button onClick={() => { setStep(1); }} className="mt-6 px-6 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700">
                    Book Another Appointment
                </button>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 text-center mb-8">Book an Appointment</h1>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            {step < 4 && (
                <>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mb-6">
                        <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((step -1) / 3) * 100}%` }}></div>
                    </div>
                     <div className="text-right text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">Step {step} of 3</div>
                </>
            )}
            
            {step < 4 ? (
                <form onSubmit={handleSubmit}>
                    {errorMessage && <p className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/50 text-sm text-red-700 dark:text-red-300 rounded-md">{errorMessage}</p>}
                    
                    {renderStep()}
                    
                    <div className="mt-8 flex justify-between items-center">
                        <div>
                        {step > 1 && (
                            <button type="button" onClick={handleBack} className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition">Back</button>
                        )}
                        </div>

                        {step < 3 ? (
                            <button type="button" onClick={handleNext} className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 transition">Next</button>
                        ) : (
                            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-wait transition">
                                {isLoading ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        )}
                    </div>
                </form>
            ) : renderStep()}
        </div>
    </div>
  );
};

export default BookingPage;