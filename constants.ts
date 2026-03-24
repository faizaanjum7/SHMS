import type { Doctor, Hospital } from './types';

export const DOCTORS: Doctor[] = [
  { 
    id: 1, 
    name: 'Dr. Evelyn Reed', 
    specialty: 'Cardiology', 
    hospital: 'King George Hospital Visakhapatnam', 
    contact: 'pa.reed@kghvizag.in', 
    imageUrl: '/images/doctors/evelyn.jpg',
    field: 'Interventional Cardiology',
    workDescription: 'Specializes in minimally invasive procedures to diagnose and treat cardiovascular diseases.',
    availability: 'Mon, Wed, Fri',
    schedule: '09:00 AM - 08:00 PM',
    assistantContact: 'assistant.reed@kghvizag.in'
  },
  { 
    id: 2, 
    name: 'Dr. Kenji Tanaka', 
    specialty: 'Orthopedics', 
    hospital: 'King George Hospital Visakhapatnam', 
    contact: 'pa.tanaka@kghvizag.in', 
    imageUrl: '/images/doctors/kenji.jpg',
    field: 'Sports Medicine',
    workDescription: 'Expert in treating athletic injuries and degenerative joint conditions.',
    availability: 'Tue, Thu, Sat',
    schedule: '10:00 AM - 08:00 PM',
    assistantContact: 'assistant.tanaka@kghvizag.in'
  },
  { 
    id: 3, 
    name: 'Dr. Priya Nair', 
    specialty: 'Endocrinology', 
    hospital: 'King George Hospital Visakhapatnam', 
    contact: 'pa.nair@kghvizag.in', 
    imageUrl: '/images/doctors/priya.jpg',
    field: 'Diabetes Management',
    workDescription: 'Focused on complex endocrine disorders and advanced diabetes care.',
    availability: 'Mon-Thu',
    schedule: '08:30 AM - 08:00 PM',
    assistantContact: 'assistant.nair@kghvizag.in'
  },
  { id: 4, name: 'Dr. Omar Haddad', specialty: 'Gastroenterology', hospital: 'King George Hospital Visakhapatnam', contact: 'pa.haddad@kghvizag.in', imageUrl: '/images/doctors/omar.jpg', field: 'Hepatology', availability: 'Mon, Wed', schedule: '11:00 AM - 08:00 PM' },
  { id: 5, name: 'Dr. Laura Kim', specialty: 'Pulmonology', hospital: 'King George Hospital Visakhapatnam', contact: 'pa.kim@kghvizag.in', imageUrl: '/images/doctors/laura.jpg', field: 'Sleep Medicine', availability: 'Tue, Fri', schedule: '09:00 AM - 08:00 PM' },

  { id: 6, name: 'Dr. Marcus Thorne', specialty: 'Neurology', hospital: 'Government General Hospital Vijayawada', contact: 'pa.thorne@gghvij.in', imageUrl: '/images/doctors/marcus.jpg', field: 'Neuro-oncology', availability: 'Mon-Fri', schedule: '10:00 AM - 08:00 PM' },
  { id: 7, name: 'Dr. Sofia Rossi', specialty: 'Dermatology', hospital: 'Government General Hospital Vijayawada', contact: 'pa.rossi@gghvij.in', imageUrl: '/images/doctors/sofia.jpg', field: 'Cosmetic Dermatology' },
  { id: 8, name: 'Dr. Alan Wright', specialty: 'Urology', hospital: 'Government General Hospital Vijayawada', contact: 'pa.wright@gghvij.in', imageUrl: '/images/doctors/alan.jpg' },
  { id: 9, name: 'Dr. Mei Chen', specialty: 'Ophthalmology', hospital: 'Government General Hospital Vijayawada', contact: 'pa.chen@gghvij.in', imageUrl: '/images/doctors/mei.jpg' },
  { id: 10, name: 'Dr. David Park', specialty: 'Rheumatology', hospital: 'Government General Hospital Vijayawada', contact: 'pa.park@gghvij.in', imageUrl: '/images/doctors/david.jpg' },

  { id: 11, name: 'Dr. Anya Sharma', specialty: 'Pediatrics', hospital: 'SVIMS Tirupati', contact: 'pa.sharma@svims.tirupati.in', imageUrl: '/images/doctors/anya.jpg', field: 'Neonatology' },
  { id: 12, name: 'Dr. Ben Carter', specialty: 'Oncology', hospital: 'SVIMS Tirupati', contact: 'pa.carter@svims.tirupati.in', imageUrl: '/images/doctors/ben.jpg' },
  { id: 13, name: 'Dr. Miguel Alvarez', specialty: 'General Surgery', hospital: 'SVIMS Tirupati', contact: 'pa.alvarez@svims.tirupati.in', imageUrl: '/images/doctors/miguel.jpg' },
  { id: 14, name: 'Dr. Hannah Lee', specialty: 'Gynecology', hospital: 'SVIMS Tirupati', contact: 'pa.lee@svims.tirupati.in', imageUrl: '/images/doctors/hannah.jpg' },
  { id: 15, name: 'Dr. Robert King', specialty: 'Nephrology', hospital: 'SVIMS Tirupati', contact: 'pa.king@svims.tirupati.in', imageUrl: '/images/doctors/robert.jpg' },

  { id: 16, name: 'Dr. Ethan Brooks', specialty: 'Cardiothoracic Surgery', hospital: 'NRI General Hospital Guntur', contact: 'pa.brooks@nrihospitals.com', imageUrl: '/images/doctors/ethan.jpg' },
  { id: 17, name: 'Dr. Sara Ahmed', specialty: 'Neurology', hospital: 'NRI General Hospital Guntur', contact: 'pa.ahmed@nrihospitals.com', imageUrl: '/images/doctors/sara.jpg' },
  { id: 18, name: 'Dr. Victor Hugo', specialty: 'Orthopedics', hospital: 'NRI General Hospital Guntur', contact: 'pa.hugo@nrihospitals.com', imageUrl: '/images/doctors/victor.jpg' },
  { id: 19, name: 'Dr. Naomi Patel', specialty: 'Dermatology', hospital: 'NRI General Hospital Guntur', contact: 'pa.patel@nrihospitals.com', imageUrl: '/images/doctors/naomi.jpg' },
  { id: 20, name: 'Dr. George Brown', specialty: 'ENT (Otolaryngology)', hospital: 'NRI General Hospital Guntur', contact: 'pa.brown@nrihospitals.com', imageUrl: '/images/doctors/george.jpg' },

  { id: 21, name: 'Dr. Isabella Moretti', specialty: 'Cardiology', hospital: 'Narayana Medical College and Hospital Nellore', contact: 'pa.moretti@narayanamedicalcollege.com', imageUrl: '/images/doctors/isabella.jpg' },
  { id: 22, name: 'Dr. Daniel Ortiz', specialty: 'Gastroenterology', hospital: 'Narayana Medical College and Hospital Nellore', contact: 'pa.ortiz@narayanamedicalcollege.com', imageUrl: '/images/doctors/daniel.jpg' },
  { id: 23, name: 'Dr. Chloe Martin', specialty: 'Endocrinology', hospital: 'Narayana Medical College and Hospital Nellore', contact: 'pa.martin@narayanamedicalcollege.com', imageUrl: '/images/doctors/chloe.jpg' },
  { id: 24, name: 'Dr. Yuki Sato', specialty: 'Hematology', hospital: 'Narayana Medical College and Hospital Nellore', contact: 'pa.sato@narayanamedicalcollege.com', imageUrl: '/images/doctors/yuki.jpg' },
  { id: 25, name: 'Dr. Peter Novak', specialty: 'Pulmonology', hospital: 'Narayana Medical College and Hospital Nellore', contact: 'pa.novak@narayanamedicalcollege.com', imageUrl: '/images/doctors/peter.jpg' },
  { id: 26, name: 'Dr. Marcus Thorne', specialty: 'Neurology', hospital: "St. Jude's Medical Center", contact: 'pa.thorne@stjude.ap.in', imageUrl: '/images/doctors/marcus.jpg' },
];

export const HOSPITALS: Hospital[] = [
  { id: 1, name: 'King George Hospital Visakhapatnam', location: 'Visakhapatnam, Andhra Pradesh', description: 'Major government teaching hospital serving north coastal Andhra Pradesh.', imageUrl: '/images/hospitals/visakhapatnam.jpg', bedsAvailable: 1500, otherInfo: 'Largest government hospital in North Andhra.' },
  { id: 2, name: 'Government General Hospital Vijayawada', location: 'Vijayawada, Andhra Pradesh', description: 'Tertiary care government hospital catering to Krishna district and beyond.', imageUrl: '/images/hospitals/vijayawada.jpg', bedsAvailable: 1200, otherInfo: 'Centrally located with advanced trauma care.' },
  { id: 3, name: 'SVIMS Tirupati', location: 'Tirupati, Andhra Pradesh', description: 'Sri Venkateswara Institute of Medical Sciences, a premier institute and hospital.', imageUrl: '/images/hospitals/tirupati.jpg', bedsAvailable: 1000, otherInfo: 'Premier medical research and care institute.' },
  { id: 4, name: 'NRI General Hospital Guntur', location: 'Guntur, Andhra Pradesh', description: 'Multispecialty teaching hospital associated with NRI Medical College.', imageUrl: '/images/hospitals/guntur.jpg', bedsAvailable: 850, otherInfo: 'State-of-the-art facilities with super-specialty departments.' },
  { id: 5, name: 'Narayana Medical College and Hospital Nellore', location: 'Nellore, Andhra Pradesh', description: 'Teaching hospital offering comprehensive medical services.', imageUrl: '/images/hospitals/nellore.jpg', bedsAvailable: 750, otherInfo: 'Known for excellence in medical education and patient care.' },
  { id: 6, name: "St. Jude's Medical Center", location: 'Kurnool, Andhra Pradesh', description: 'Multispecialty hospital providing comprehensive patient care and services.', imageUrl: '/images/hospitals/kurnool.jpg', bedsAvailable: 500, otherInfo: 'Modern community hospital with specialized maternal and child care.' },
];

export const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Book Appointment', path: '/book-appointment' },
  { name: 'Support', path: '/support' },
];

export const ABOUT_DROPDOWN_LINKS = [
  { name: 'About SHMS', path: '/about' },
  { name: 'Doctors', path: '/doctors' },
  { name: 'Hospitals', path: '/hospitals' },
];

export const TESTIMONIALS = [
    {
        quote: "The booking process was incredibly smooth and easy. I found a specialist and booked an appointment in under five minutes. Highly recommended!",
        name: "Sarah L.",
        location: "Metropolis"
    },
    {
        quote: "I used the AI symptom checker and it pointed me to the exact department I needed. It saved me so much time and worry. A fantastic feature!",
        name: "Michael B.",
        location: "Star City"
    },
    {
        quote: "Managing my family's appointments has never been easier. The platform is intuitive and keeps everything organized in one place.",
        name: "Jessica P.",
        location: "Central County"
    }
];

export const APPOINTMENT_TIME_SLOTS = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
    "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
];

// Predefined hospital inventory items for admission workflow
export const INVENTORY_ITEMS = [
  'IV Fluids',
  'Syringes',
  'Catheters',
  'Gauze Pads',
  'Bandages',
  'Gloves',
  'Masks',
  'Antibiotics',
  'Painkillers',
  'Saline',
  'Oxygen Cylinder',
  'Nebulizer Kit',
  'ECG Leads',
  'Blood Collection Tubes',
  // Specific catalog names used by defaults and inventories
  'Amoxicillin 500mg',
  'Paracetamol 650mg',
  '0.9% Normal Saline 500ml',
  "Ringer's Lactate 500ml",
  'Syringes 5ml',
  'Gloves (M)',
  'Nebulizer Machine'
];

export const INVENTORY_CATEGORIES = ['Medicines', 'Salines', 'Consumables', 'Equipment', 'Other'] as const;

// Sample defaults for St. Jude's Medical Center inventory
export const DEFAULT_INVENTORY_BY_HOSPITAL: Record<string, Array<{
  category: 'Medicines' | 'Salines' | 'Consumables' | 'Equipment' | 'Other';
  name: string;
  description?: string;
  company?: string;
  quantity: number;
  expiryDateISO?: string;
}>> = {
  "St. Jude's Medical Center": [
    { category: 'Medicines', name: 'Amoxicillin 500mg', description: 'Antibiotic', company: 'ACME Pharma', quantity: 120, expiryDateISO: '2026-01-31' },
    { category: 'Medicines', name: 'Paracetamol 650mg', description: 'Analgesic/Antipyretic', company: 'HealthCorp', quantity: 250, expiryDateISO: '2027-03-15' },
    { category: 'Salines', name: '0.9% Normal Saline 500ml', description: 'Isotonic saline', company: 'MediSal', quantity: 80, expiryDateISO: '2026-08-01' },
    { category: 'Salines', name: 'Ringer\'s Lactate 500ml', description: 'Balanced crystalloid', company: 'InfuTech', quantity: 60, expiryDateISO: '2026-06-20' },
    { category: 'Consumables', name: 'Syringes 5ml', description: 'Disposable sterile syringes', company: 'SafeMed', quantity: 500 },
    { category: 'Consumables', name: 'Gloves (M)', description: 'Nitrile examination gloves', company: 'GloveCo', quantity: 300 },
    { category: 'Equipment', name: 'Nebulizer Machine', description: 'For aerosol therapy', company: 'BreatheEZ', quantity: 4 },
  ],
  // Government General Hospital Vijayawada starter catalog
  'Government General Hospital Vijayawada': [
    { category: 'Medicines', name: 'Amoxicillin 500mg', description: 'Antibiotic', company: 'ACME Pharma', quantity: 100, expiryDateISO: '2026-04-30' },
    { category: 'Medicines', name: 'Paracetamol 650mg', description: 'Analgesic/Antipyretic', company: 'HealthCorp', quantity: 200, expiryDateISO: '2027-01-15' },
    { category: 'Salines', name: '0.9% Normal Saline 500ml', description: 'Isotonic saline', company: 'MediSal', quantity: 70, expiryDateISO: '2026-09-15' },
    { category: 'Salines', name: "Ringer's Lactate 500ml", description: 'Balanced crystalloid', company: 'InfuTech', quantity: 50, expiryDateISO: '2026-07-10' },
    { category: 'Consumables', name: 'Syringes 5ml', description: 'Disposable sterile syringes', company: 'SafeMed', quantity: 400 },
    { category: 'Consumables', name: 'Gloves (M)', description: 'Nitrile examination gloves', company: 'GloveCo', quantity: 250 },
    { category: 'Equipment', name: 'Nebulizer Machine', description: 'For aerosol therapy', company: 'BreatheEZ', quantity: 3 },
  ],
};

// Fallback starter items when a hospital has no dedicated defaults
export const DEFAULT_INVENTORY_GENERIC: Array<{
  category: 'Medicines' | 'Salines' | 'Consumables' | 'Equipment' | 'Other';
  name: string;
  description?: string;
  company?: string;
  quantity: number;
  expiryDateISO?: string;
}> = [
  { category: 'Medicines', name: 'Ibuprofen 400mg', description: 'NSAID pain reliever', company: 'Unified Pharma', quantity: 100, expiryDateISO: '2026-12-31' },
  { category: 'Salines', name: '0.9% Normal Saline 500ml', description: 'Isotonic saline', company: 'MediSal', quantity: 40, expiryDateISO: '2026-08-01' },
  { category: 'Consumables', name: 'Gauze Pads', description: 'Sterile dressing pads', company: 'SafeMed', quantity: 200 },
];