const doctorModel = require('../models/doctorModel');

// Enhanced hospital knowledge base with symptom-to-doctor mapping
const symptomKeywords = {
  // Cardiology symptoms
  'chest pain': 'Cardiology',
  'heart': 'Cardiology',
  'palpitation': 'Cardiology',
  'blood pressure': 'Cardiology',
  'cardiac': 'Cardiology',
  'heart attack': 'Cardiology',
  'shortness of breath': 'Cardiology',
  'breath': 'Cardiology',
  
  // Neurology symptoms
  'headache': 'Neurology',
  'migraine': 'Neurology',
  'seizure': 'Neurology',
  'dizziness': 'Neurology',
  'numbness': 'Neurology',
  'brain': 'Neurology',
  'nerve': 'Neurology',
  
  // Pediatrics symptoms
  'child': 'Pediatrics',
  'baby': 'Pediatrics',
  'infant': 'Pediatrics',
  'vaccination': 'Pediatrics',
  'growth': 'Pediatrics',
  
  // Orthopedics symptoms
  'bone': 'Orthopedics',
  'joint': 'Orthopedics',
  'fracture': 'Orthopedics',
  'back pain': 'Orthopedics',
  'knee': 'Orthopedics',
  'shoulder': 'Orthopedics',
  'sprain': 'Orthopedics',
  'arthritis': 'Orthopedics',
  
  // Dermatology symptoms
  'skin': 'Dermatology',
  'rash': 'Dermatology',
  'acne': 'Dermatology',
  'eczema': 'Dermatology',
  'hair': 'Dermatology',
  'allergy': 'Dermatology',
  
  // ENT symptoms
  'ear': 'ENT',
  'throat': 'ENT',
  'nose': 'ENT',
  'sinus': 'ENT',
  'hearing': 'ENT',
  'tonsils': 'ENT',
  
  // Gynecology symptoms
  'period': 'Gynecology',
  'pregnancy': 'Gynecology',
  'menstrual': 'Gynecology',
  'fertility': 'Gynecology',
  'menopause': 'Gynecology',
  'women': 'Gynecology',
  
  // General Medicine
  'fever': 'General Medicine',
  'cold': 'General Medicine',
  'flu': 'General Medicine',
  'cough': 'General Medicine',
  'diabetes': 'General Medicine',
  'thyroid': 'General Medicine',
  'checkup': 'General Medicine',
  'general': 'General Medicine',
  'cardiology': 'Cardiology',
  'neurology': 'Neurology',
  'pediatrics': 'Pediatrics',
  'orthopedics': 'Orthopedics',
  'dermatology': 'Dermatology',
  'ent': 'ENT',
  'gynecology': 'Gynecology',
  'medicine': 'General Medicine'
};

// Detect intent from user message
const detectIntent = (message) => {
  const lowerMsg = message.toLowerCase();
  
  // Check for appointment booking intent
  if (lowerMsg.includes('book') || lowerMsg.includes('appointment') || lowerMsg.includes('schedule')) {
    return { intent: 'BOOK_APPOINTMENT', confidence: 0.9 };
  }
  
  // Check for symptom/doctor recommendation intent
  if (lowerMsg.includes('symptom') || lowerMsg.includes('pain') || lowerMsg.includes('doctor for') || 
      lowerMsg.includes('which doctor') || lowerMsg.includes('what doctor') ||
      lowerMsg.includes('i have') || lowerMsg.includes('my') || lowerMsg.includes('feeling') ||
      lowerMsg.includes('suffering') || lowerMsg.includes('experiencing') ||
      lowerMsg.includes('specialist') || lowerMsg.includes('specialization') ||
      lowerMsg.includes('find me') || lowerMsg.includes('show me')) {
    return { intent: 'FIND_DOCTOR', confidence: 0.9 };
  }
  
  // Check for availability intent
  if (lowerMsg.includes('available') || lowerMsg.includes('when is') || lowerMsg.includes('schedule of')) {
    return { intent: 'CHECK_AVAILABILITY', confidence: 0.8 };
  }
  
  // Check for my appointments intent
  if (lowerMsg.includes('my appointment') || lowerMsg.includes('my booking')) {
    return { intent: 'VIEW_APPOINTMENTS', confidence: 0.9 };
  }
  
  return { intent: 'GENERAL', confidence: 0.5 };
};

// Find specialty based on symptoms
const findSpecialtyBySymptom = (message) => {
  const lowerMsg = message.toLowerCase();
  
  for (const [keyword, specialty] of Object.entries(symptomKeywords)) {
    if (lowerMsg.includes(keyword.toLowerCase())) {
      return specialty;
    }
  }
  
  return null;
};

// Find doctors for symptoms
const findDoctorsForSymptoms = (input) => {
  let specialty = null;
  
  if (Array.isArray(input)) {
    // If input is an array of symptoms, try to find a matching specialty
    for (const symptom of input) {
      specialty = findSpecialtyBySymptom(symptom);
      if (specialty) break;
    }
  } else if (typeof input === 'string') {
    specialty = findSpecialtyBySymptom(input);
  }
  
  if (!specialty) {
    return null;
  }
  
  const doctors = doctorModel.getDoctorsBySpecialization(specialty);
  
  if (doctors.length === 0) {
    return {
      found: false,
      specialty: specialty,
      message: `I recommend a ${specialty} specialist, but we don't have any available at the moment.`
    };
  }
  
  return {
    found: true,
    specialty: specialty,
    doctors: doctors.map(d => ({
      id: d.id,
      name: d.name,
      qualifications: d.qualifications,
      experience: d.experience,
      availableDays: d.availableDays,
      availableTimeSlots: d.availableTimeSlots
    }))
  };
};

// Check doctor availability
const checkDoctorAvailability = (doctorName, date) => {
  const doctors = doctorModel.getAllDoctors();
  const doctor = doctors.find(d => 
    d.name.toLowerCase().includes(doctorName.toLowerCase()) || 
    doctorName.toLowerCase().includes(d.name.split(' ')[1].toLowerCase())
  );
  
  if (!doctor) {
    return { found: false, message: `I couldn't find a doctor named "${doctorName}". Would you like to see our list of doctors?` };
  }
  
  const availability = doctorModel.getDoctorAvailability(doctor.id, date);
  return {
    found: true,
    doctor: doctor,
    availability: availability
  };
};

// Book appointment
const bookAppointment = (patientInfo) => {
  return doctorModel.bookAppointment(patientInfo);
};

// Get patient appointments
const getPatientAppointments = (patientPhone) => {
  return doctorModel.getPatientAppointments(patientPhone);
};

// Cancel appointment
const cancelAppointment = (appointmentId) => {
  return doctorModel.cancelAppointment(appointmentId);
};

// Get all doctors
const getAllDoctors = () => {
  return doctorModel.getAllDoctors().map(d => ({
    id: d.id,
    name: d.name,
    specialization: d.specialization,
    qualifications: d.qualifications,
    experience: d.experience,
    availableDays: d.availableDays
  }));
};

module.exports = {
  detectIntent,
  findSpecialtyBySymptom,
  findDoctorsForSymptoms,
  checkDoctorAvailability,
  bookAppointment,
  getPatientAppointments,
  cancelAppointment,
  getAllDoctors,
  symptomKeywords
};
