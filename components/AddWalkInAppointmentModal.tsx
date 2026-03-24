import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../services/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import CloseIcon from './icons/CloseIcon';

interface DoctorOption { uid: string; fullName: string; department?: string; specialty?: string }

interface AddWalkInAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: string;
  doctors: DoctorOption[];
  receptionistUid: string;
  onCreated: () => void;
}

const AddWalkInAppointmentModal: React.FC<AddWalkInAppointmentModalProps> = ({ isOpen, onClose, hospital, doctors, receptionistUid, onCreated }) => {
  const [form, setForm] = useState({
    patientName: '',
    patientContact: '',
    patientDOB: '',
    patientGender: '',
    department: '',
    doctorId: '',
    doctorName: '',
    date: '',
    appointmentTime: '',
    reasonForVisit: '',
    visitType: 'OPD' as 'OPD' | 'Surgery' | 'Emergency',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm({
        patientName: '', patientContact: '', patientDOB: '', patientGender: '',
        department: '', doctorId: '', doctorName: '', date: '', appointmentTime: '',
        reasonForVisit: '', visitType: 'OPD'
      });
      setErrors({});
      setIsLoading(false);
    }
  }, [isOpen]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const d of doctors) {
      const dep = d.department || d.specialty;
      if (dep) set.add(dep);
    }
    return Array.from(set.values()).sort();
  }, [doctors]);

  const availableDoctors = useMemo(() => {
    if (!form.department) return doctors;
    return doctors.filter(d => ((d.department || d.specialty || '') as string).toLowerCase() === form.department.toLowerCase());
  }, [doctors, form.department]);

  if (!isOpen) return null;

  const commonInputClasses = "mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-emerald-500 focus:border-emerald-500";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [id, name] = e.target.value.split('|');
    setForm(prev => ({ ...prev, doctorId: id, doctorName: name }));
    if (errors['doctor']) setErrors(prev => ({ ...prev, doctor: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.patientName) errs.patientName = 'Required';
    if (!form.patientContact) errs.patientContact = 'Required';
    if (!form.patientDOB) errs.patientDOB = 'Required';
    if (!form.patientGender) errs.patientGender = 'Required';
    if (!form.department) errs.department = 'Required';
    if (!form.doctorId) errs.doctor = 'Required';
    if (!form.date) errs.date = 'Required';
    if (!form.appointmentTime) errs.appointmentTime = 'Required';
    if (!form.reasonForVisit) errs.reasonForVisit = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      // IMPORTANT: Firestore rules must allow receptionist create in their hospital.
      // For now, set patientUid to a placeholder; recommended to adjust rules accordingly.
      await addDoc(collection(db, 'appointments'), {
        patientUid: 'OFFLINE',
        hospital,
        department: form.department,
        doctorId: form.doctorId,
        doctorName: form.doctorName,
        date: form.date,
        appointmentTime: form.appointmentTime,
        patientName: form.patientName,
        patientContact: form.patientContact,
        patientDOB: form.patientDOB,
        patientGender: form.patientGender,
        reasonForVisit: form.reasonForVisit,
        visitType: form.visitType,
        status: 'Confirmed',
        createdAt: serverTimestamp(),
        createdBy: receptionistUid,
        offlineRegistration: true,
        waitTimeUpdatedAt: new Date().toISOString(),
      });
      onCreated();
      onClose();
    } catch (err) {
      alert('Failed to create walk-in appointment. Check your security rules.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-xl md:max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
          <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Add Walk-in / OPD Appointment</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hospital: {hospital}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={commonLabelClasses}>Patient Name</label>
              <input name="patientName" className={commonInputClasses} value={form.patientName} onChange={handleChange} />
              {errors.patientName && <p className="text-sm text-red-500">{errors.patientName}</p>}
            </div>
            <div>
              <label className={commonLabelClasses}>Contact</label>
              <input name="patientContact" className={commonInputClasses} value={form.patientContact} onChange={handleChange} />
              {errors.patientContact && <p className="text-sm text-red-500">{errors.patientContact}</p>}
            </div>
            <div>
              <label className={commonLabelClasses}>DOB</label>
              <input type="date" name="patientDOB" className={commonInputClasses} value={form.patientDOB} onChange={handleChange} />
              {errors.patientDOB && <p className="text-sm text-red-500">{errors.patientDOB}</p>}
            </div>
            <div>
              <label className={commonLabelClasses}>Gender</label>
              <select name="patientGender" className={commonInputClasses} value={form.patientGender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.patientGender && <p className="text-sm text-red-500">{errors.patientGender}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={commonLabelClasses}>Department</label>
              <select name="department" className={commonInputClasses} value={form.department} onChange={handleChange}>
                <option value="">Select</option>
                {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
              {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
            </div>
            <div>
              <label className={commonLabelClasses}>Doctor</label>
              <select name="doctor" className={commonInputClasses} value={form.doctorId ? `${form.doctorId}|${form.doctorName}` : ''} onChange={handleDoctorChange}>
                <option value="">{availableDoctors.length > 0 ? 'Select a doctor' : 'No doctors available'}</option>
                {availableDoctors.map(d => <option key={d.uid} value={`${d.uid}|${d.fullName}`}>{d.fullName}</option>)}
              </select>
              {errors.doctor && <p className="text-sm text-red-500">{errors.doctor}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={commonLabelClasses}>Date</label>
              <input type="date" name="date" className={commonInputClasses} value={form.date} onChange={handleChange} />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>
            <div>
              <label className={commonLabelClasses}>Time</label>
              <input type="time" name="appointmentTime" className={commonInputClasses} value={form.appointmentTime} onChange={handleChange} />
              {errors.appointmentTime && <p className="text-sm text-red-500">{errors.appointmentTime}</p>}
            </div>
          </div>

          <div>
            <label className={commonLabelClasses}>Reason for Visit</label>
            <textarea name="reasonForVisit" rows={3} className={commonInputClasses} value={form.reasonForVisit} onChange={handleChange} />
            {errors.reasonForVisit && <p className="text-sm text-red-500">{errors.reasonForVisit}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={commonLabelClasses}>Visit Type</label>
              <select name="visitType" className={commonInputClasses} value={form.visitType} onChange={handleChange}>
                <option value="OPD">OPD</option>
                <option value="Surgery">Surgery</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition w-full sm:w-auto">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 transition w-full sm:w-auto">{isLoading ? 'Saving...' : 'Create Appointment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWalkInAppointmentModal;
