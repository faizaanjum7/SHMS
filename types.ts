import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  PATIENT = 'Patient',
  RECEPTIONIST = 'Receptionist',
  MEDICAL_ADMIN = 'Medical Admin',
  DOCTOR = 'Doctor',
  HOSPITAL_STAFF = 'Hospital Staff',
  OTHER = 'Other',
}

// Hospital inventory item managed by Medical Admins
export interface InventoryItem {
  id: string;
  hospital: string; // hospital name
  category: 'Medicines' | 'Salines' | 'Consumables' | 'Equipment' | 'Other';
  name: string;
  description?: string;
  company?: string;
  dateBroughtISO?: string; // ISO date
  expiryDateISO?: string; // ISO date (optional for non-expiring)
  quantity: number;
  createdAt: string; // ISO
}

export interface Doctor {
  id: string | number;
  name: string;
  specialty: string;
  hospital: string;
  contact: string;
  imageUrl: string;
  field?: string;
  workDescription?: string;
  availability?: string;
  schedule?: string;
  assistantContact?: string;
}

export interface Hospital {
  id: number;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  bedsAvailable?: number;
  otherInfo?: string;
}

// Centralized Appointment interface for use across the app
export interface Appointment {
  id: string;
  patientUid: string;
  hospital: string;
  department: string;
  doctorId: string;
  doctorName: string;
  date: string;
  appointmentTime: string;
  patientName: string;
  patientContact: string;
  patientDOB: string;
  patientGender: string;
  reasonForVisit: string;
  // OPD vs procedural visit classification
  visitType?: 'OPD' | 'Surgery' | 'Emergency';
  // Whether patient is directly booking a bed (post-checkup for procedure)
  bedBooking?: boolean;
  status: 'Confirmed' | 'In-Progress' | 'Completed' | 'Cancelled' | 'No-show';
  createdAt: string; // ISO string format
  resultNotes?: string;
  cancellationReason?: string;
  // Overrun tracking
  startedAtISO?: string; // when consultation actually started (ISO)
  completedAtISO?: string; // when it completed (ISO)
  actualDurationMin?: number; // measured duration in minutes
  // Admission workflow
  admitted?: boolean; // whether patient is admitted per doctor's suggestion
  admissionNotes?: string; // notes related to admission
  requiredInventory?: { name: string; qty: number }[]; // inventory items and quantities
  // Medical Admin approval & provisioning
  adminApproved?: boolean; // admin has approved admission & inventory
  approvedByUid?: string; // admin uid who approved
  approvedAtISO?: string; // when approved
  inventoryProvided?: boolean; // inventory issued to patient
  providedAtISO?: string; // when inventory provided
  // Wait time management
  predictedWaitTimeMin?: number; // AI/Logic predicted wait
  receptionistWaitTimeOverride?: number; // Manual override by receptionist
  waitTimeUpdatedAt?: string; // ISO timestamp of when the wait time was last set/predicted
  notified0Min?: boolean; // Whether the patient has been notified when wait time hit 0
  reviewed?: boolean; // Whether the patient has left a review
}

export interface Notification {
  id: string;
  recipientUid: string;
  title: string;
  message: string;
  type: 'WaitTimeUpdate' | 'EmergencyUpdate' | 'General';
  read: boolean;
  createdAt: string; // ISO string
  relatedAppointmentId?: string;
}

export interface Review {
  id: string;
  patientUid: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  hospital: string;
  appointmentId: string;
  doctorRating: number; // 1-5
  hospitalRating: number; // 1-5
  comment: string;
  createdAt: string; // ISO
}