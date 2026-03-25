// Doctor data model with specializations and availability
const doctors = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialization: "Cardiology",
    qualifications: "MD, FACC",
    experience: "15 years",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
    availableTimeSlots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    maxPatientsPerDay: 8,
    currentBookings: {},
    symptoms: ["chest pain", "heart palpitations", "shortness of breath", "high blood pressure", "irregular heartbeat"]
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialization: "Neurology",
    qualifications: "MD, PhD",
    experience: "12 years",
    availableDays: ["Monday", "Wednesday", "Thursday", "Friday"],
    availableTimeSlots: ["10:00", "11:00", "13:00", "14:00", "15:00"],
    maxPatientsPerDay: 6,
    currentBookings: {},
    symptoms: ["headache", "migraine", "seizures", "dizziness", "numbness", "memory loss"]
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    specialization: "Pediatrics",
    qualifications: "MD, FAAP",
    experience: "10 years",
    availableDays: ["Tuesday", "Wednesday", "Thursday", "Saturday"],
    availableTimeSlots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    maxPatientsPerDay: 10,
    currentBookings: {},
    symptoms: ["fever", "cough", "cold", "vomiting", "diarrhea", "growth issues", "vaccination"]
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    specialization: "Orthopedics",
    qualifications: "MD, FAAOS",
    experience: "18 years",
    availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
    availableTimeSlots: ["09:00", "11:00", "13:00", "15:00", "16:00"],
    maxPatientsPerDay: 7,
    currentBookings: {},
    symptoms: ["joint pain", "back pain", "fracture", "sports injury", "arthritis", "bone problems"]
  },
  {
    id: 5,
    name: "Dr. Priya Sharma",
    specialization: "Dermatology",
    qualifications: "MD",
    experience: "8 years",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
    availableTimeSlots: ["10:00", "11:00", "13:00", "14:00", "15:00"],
    maxPatientsPerDay: 9,
    currentBookings: {},
    symptoms: ["skin rash", "acne", "eczema", "psoriasis", "skin infection", "hair loss"]
  },
  {
    id: 6,
    name: "Dr. Robert Kim",
    specialization: "ENT",
    qualifications: "MD, FACS",
    experience: "14 years",
    availableDays: ["Tuesday", "Wednesday", "Thursday", "Friday"],
    availableTimeSlots: ["09:00", "10:00", "11:00", "14:00", "15:00"],
    maxPatientsPerDay: 8,
    currentBookings: {},
    symptoms: ["ear pain", "hearing loss", "sore throat", "sinus problems", "nasal congestion", "tonsillitis"]
  },
  {
    id: 7,
    name: "Dr. Lisa Thompson",
    specialization: "Gynecology",
    qualifications: "MD, FACOG",
    experience: "11 years",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    availableTimeSlots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    maxPatientsPerDay: 8,
    currentBookings: {},
    symptoms: ["irregular periods", "pregnancy", "menstrual pain", "fertility issues", "menopause"]
  },
  {
    id: 8,
    name: "Dr. Ahmed Hassan",
    specialization: "General Medicine",
    qualifications: "MD",
    experience: "20 years",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    availableTimeSlots: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
    maxPatientsPerDay: 12,
    currentBookings: {},
    symptoms: ["fever", "cold", "flu", "general checkup", "diabetes", "thyroid", "high blood pressure"]
  }
];

// In-memory appointments storage
let appointments = [];

const getAllDoctors = () => doctors;

const getDoctorById = (id) => doctors.find(d => d.id === id);

const getDoctorsBySpecialization = (specialization) => {
  return doctors.filter(d => 
    d.specialization.toLowerCase() === specialization.toLowerCase()
  );
};

const findDoctorsBySymptom = (symptom) => {
  const lowerSymptom = symptom.toLowerCase();
  return doctors.filter(d => 
    d.symptoms.some(s => lowerSymptom.includes(s.toLowerCase()))
  );
};

const getDoctorAvailability = (doctorId, date) => {
  const doctor = getDoctorById(doctorId);
  if (!doctor) return null;

  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  
  if (!doctor.availableDays.includes(dayName)) {
    return {
      doctor: doctor.name,
      specialization: doctor.specialization,
      date: date,
      available: false,
      message: `Dr. ${doctor.name} is not available on ${dayName}s`
    };
  }

  const bookedSlots = doctor.currentBookings[date] || [];
  const availableSlots = doctor.availableTimeSlots.filter(slot => !bookedSlots.includes(slot));

  return {
    doctor: doctor.name,
    specialization: doctor.specialization,
    date: date,
    available: availableSlots.length > 0,
    availableSlots: availableSlots,
    message: availableSlots.length > 0 
      ? `Available slots: ${availableSlots.join(', ')}`
      : `Dr. ${doctor.name} is fully booked on ${date}`
  };
};

const bookAppointment = (patientInfo) => {
  const { doctorId, date, timeSlot, patientName, patientPhone, symptoms } = patientInfo;
  
  const doctor = getDoctorById(doctorId);
  if (!doctor) {
    return { success: false, message: "Doctor not found" };
  }

  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  if (!doctor.availableDays.includes(dayName)) {
    return { success: false, message: `Doctor not available on ${dayName}s` };
  }

  if (!doctor.availableTimeSlots.includes(timeSlot)) {
    return { success: false, message: "Invalid time slot" };
  }

  if (!doctor.currentBookings[date]) {
    doctor.currentBookings[date] = [];
  }

  if (doctor.currentBookings[date].includes(timeSlot)) {
    return { success: false, message: "Time slot already booked" };
  }

  if (doctor.currentBookings[date].length >= doctor.maxPatientsPerDay) {
    return { success: false, message: "Doctor is fully booked for this day" };
  }

  doctor.currentBookings[date].push(timeSlot);

  const appointment = {
    id: Date.now(),
    doctorId,
    doctorName: doctor.name,
    specialization: doctor.specialization,
    date,
    timeSlot,
    patientName,
    patientPhone,
    symptoms,
    status: "confirmed",
    bookedAt: new Date().toISOString()
  };

  appointments.push(appointment);

  return {
    success: true,
    message: `Appointment confirmed with ${doctor.name} (${doctor.specialization}) on ${date} at ${timeSlot}`,
    appointment: appointment
  };
};

const getPatientAppointments = (patientPhone) => {
  return appointments.filter(a => a.patientPhone === patientPhone);
};

const cancelAppointment = (appointmentId) => {
  const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
  if (appointmentIndex === -1) {
    return { success: false, message: "Appointment not found" };
  }

  const appointment = appointments[appointmentIndex];
  const doctor = getDoctorById(appointment.doctorId);
  
  if (doctor && doctor.currentBookings[appointment.date]) {
    doctor.currentBookings[appointment.date] = doctor.currentBookings[appointment.date]
      .filter(slot => slot !== appointment.timeSlot);
  }

  appointments[appointmentIndex].status = "cancelled";
  
  return { success: true, message: "Appointment cancelled successfully" };
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorsBySpecialization,
  findDoctorsBySymptom,
  getDoctorAvailability,
  bookAppointment,
  getPatientAppointments,
  cancelAppointment,
  doctors,
  appointments
};
