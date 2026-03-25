const openaiService = require('./openaiService');
const appointmentService = require('./appointmentService');
const DiseasePredictionService = require('./diseasePredictionService');

// Initialize disease prediction service
const diseaseService = new DiseasePredictionService();

// Hospital-specific knowledge base
const hospitalKnowledge = {
  visitingHours: {
    general: "Our visiting hours are 9:00 AM to 8:00 PM daily. ICU visiting hours are restricted to 11:00 AM to 12:00 PM and 5:00 PM to 6:00 PM.",
    emergency: "Emergency services are available 24/7. No appointment needed."
  },
  departments: {
    general: "We have Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology, ENT, Gynecology, and General Medicine departments.",
    emergency: "Emergency department is always open for urgent medical needs."
  },
  appointments: {
    booking: "To book an appointment, tell me your symptoms and I'll help you find the right doctor. I can also check doctor availability for specific dates.",
    cancellation: "Please cancel at least 24 hours in advance to avoid cancellation fees.",
    preparation: "Please bring your ID, insurance card, and list of current medications to your appointment."
  },
  doctors: {
    availability: "I can help you find doctors by specialty or check specific doctor availability. Just tell me what symptoms you have or which doctor you'd like to see.",
    specializations: "Our doctors specialize in Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology, ENT, Gynecology, and General Medicine."
  },
  symptoms: {
    help: "Tell me your symptoms (e.g., 'I have chest pain', 'my child has fever', 'I have skin rash') and I'll recommend the right specialist for you."
  }
};

// Session-based memory store with conversation state
const sessionMemory = new Map();

// Conversation states
const CONVERSATION_STATE = {
  NORMAL: 'normal',
  COLLECTING_BOOKING_INFO: 'collecting_booking_info',
  COLLECTING_SYMPTOMS: 'collecting_symptoms',
  SELECTING_DOCTOR: 'selecting_doctor',
  SELECTING_DATE: 'selecting_date',
  SELECTING_TIME: 'selecting_time'
};

// Generate contextual response with appointment capabilities
const generateResponse = async (message) => {
  try {
    const sessionId = 'default';
    const sessionData = sessionMemory.get(sessionId) || { 
      history: [], 
      state: CONVERSATION_STATE.NORMAL,
      pendingBooking: {}
    };
    
    sessionData.history.push({ role: 'user', content: message });
    
    // Extract symptoms early for use in multiple logic paths
    const symptoms = extractSymptoms(message);
    
    // Detect user intent
    const intent = appointmentService.detectIntent(message);
    
    // Handle appointment booking flow
    if (intent.intent === 'BOOK_APPOINTMENT' || sessionData.state !== CONVERSATION_STATE.NORMAL) {
      const bookingResponse = handleAppointmentFlow(message, sessionData, intent);
      if (bookingResponse) {
        sessionData.history.push({ role: 'assistant', content: bookingResponse });
        sessionMemory.set(sessionId, { ...sessionData, history: sessionData.history.slice(-10) });
        return bookingResponse;
      }
    }
    
    // Handle symptom-based doctor recommendation or availability check
    if (intent.intent === 'FIND_DOCTOR' || intent.intent === 'CHECK_AVAILABILITY' || (symptoms.length > 0 && sessionData.state === CONVERSATION_STATE.NORMAL)) {
      const doctorResponse = await handleSymptomQuery(message, symptoms, sessionData.history);
      if (doctorResponse) {
        sessionData.history.push({ role: 'assistant', content: doctorResponse });
        sessionMemory.set(sessionId, { ...sessionData, history: sessionData.history.slice(-10) });
        return doctorResponse;
      }
    }
    
    // Check for simple keyword-based responses
    const keywordResponse = checkKeywordResponses(message.toLowerCase());
    if (keywordResponse) {
      sessionData.history.push({ role: 'assistant', content: keywordResponse });
      sessionMemory.set(sessionId, { ...sessionData, history: sessionData.history.slice(-10) });
      return keywordResponse;
    }
    
    // Use OpenAI for complex queries with enhanced context (if available)
    try {
      const aiResponse = await openaiService.generateChatResponse(message, sessionData.history);
      sessionData.history.push({ role: 'assistant', content: aiResponse });
      sessionMemory.set(sessionId, { ...sessionData, history: sessionData.history.slice(-10) });
      return aiResponse;
    } catch (aiError) {
      // OpenAI failed, use fallback response
      console.log('OpenAI failed:', aiError.message);
      let fallbackResponse = "I'm sorry, I'm having a bit of trouble connecting to my advanced brain. ";
      
      if (symptoms.length > 0) {
        fallbackResponse += `I noticed you mentioned **${symptoms.join(', ')}**. Based on this, I recommend scheduling a visit with a General Physician for a check-up. Would you like me to show you our available doctors?`;
      } else {
        fallbackResponse += "I can help you find the right doctor if you tell me what symptoms you're having (like chest pain, fever, or headache). How can I assist you today?";
      }
      
      sessionData.history.push({ role: 'assistant', content: fallbackResponse });
      sessionMemory.set(sessionId, { ...sessionData, history: sessionData.history.slice(-10) });
      return fallbackResponse;
    }
    
  } catch (error) {
    console.error('Chat service error:', error);
    return "I'm sorry, I'm having trouble right now. Please try again or contact our front desk at (555) 123-4567.";
  }
};

// Check for keyword-based responses for common queries
const checkKeywordResponses = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Visiting hours
  if (lowerMessage.includes('visiting') || lowerMessage.includes('hours') || lowerMessage.includes('visit')) {
    return hospitalKnowledge.visitingHours.general;
  }
  
  // Emergency
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
    return hospitalKnowledge.emergency;
  }
  
  // Appointments - redirect to booking flow
  if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
    return hospitalKnowledge.appointments.booking;
  }
  
  // Departments
  if (lowerMessage.includes('department') || lowerMessage.includes('services')) {
    return hospitalKnowledge.departments.general;
  }
  
  // Doctors with enhanced info - only if it's a generic query
  if ((lowerMessage.includes('doctor') || lowerMessage.includes('physician') || lowerMessage.includes('specialist')) && 
      !lowerMessage.includes('cardiol') && !lowerMessage.includes('neuro') && !lowerMessage.includes('ortho') && 
      !lowerMessage.includes('pedia') && !lowerMessage.includes('derma') && !lowerMessage.includes('ent') && 
      !lowerMessage.includes('gyne') && !lowerMessage.includes('medicine')) {
    return hospitalKnowledge.doctors.availability;
  }
  
  // Symptoms help
  if (lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('sick') || lowerMessage.includes('hurt')) {
    return hospitalKnowledge.symptoms.help;
  }
  
  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! Welcome to SHM Hospital. I can help you book appointments, find doctors by symptoms, check availability, and answer general questions. What would you like help with today?";
  }
  
  // Help
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return "I can help you with:\n• Finding the right doctor for your symptoms\n• Booking appointments\n• Checking doctor availability\n• Visiting hours and general information\n• Department and services info\n\nJust tell me what you need!";
  }
  
  return null;
};

// Handle symptom-based doctor queries or availability checks
const handleSymptomQuery = async (message, passedSymptoms = [], history = []) => {
  const lowerMsg = message.toLowerCase();
  const doctors = appointmentService.getAllDoctors();
  
  // 1. Check for doctor availability queries
  if (lowerMsg.includes('availab') || lowerMsg.includes('when is') || lowerMsg.includes('schedule')) {
    // Try to find a doctor name in the message
    let foundDoctor = doctors.find(d => 
      lowerMsg.includes(d.name.toLowerCase()) || 
      lowerMsg.includes(d.name.split(' ').slice(1).join(' ').toLowerCase())
    );
    
    // Context Resolution: If no doctor name found, look in history for pronouns
    if (!foundDoctor && (lowerMsg.includes('their') || lowerMsg.includes('them') || lowerMsg.includes('him') || lowerMsg.includes('her'))) {
      for (let i = history.length - 1; i >= 0; i--) {
        const lastMsg = history[i].content.toLowerCase();
        foundDoctor = doctors.find(d => 
          lastMsg.includes(d.name.toLowerCase()) || 
          lastMsg.includes(d.name.split(' ').slice(1).join(' ').toLowerCase())
        );
        if (foundDoctor) break;
      }
    }
    
    if (foundDoctor) {
      // Date extraction logic
      let selectedDate = new Date().toISOString().split('T')[0];
      const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
      const dayMatch = message.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
      
      if (dateMatch) {
        selectedDate = dateMatch[1];
      } else if (dayMatch) {
        const months = {
          january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
          july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
        };
        const day = dayMatch[1].padStart(2, '0');
        const month = months[dayMatch[2].toLowerCase()];
        const year = dayMatch[3];
        selectedDate = `${year}-${month}-${day}`;
      }
      
      const availabilityResult = appointmentService.checkDoctorAvailability(foundDoctor.name, selectedDate);
      if (availabilityResult.found) {
        return availabilityResult.availability.message;
      }
    }
  }
  
  // 2. Extract symptoms if not already passed
  const currentSymptoms = passedSymptoms.length > 0 ? passedSymptoms : extractSymptoms(message);
  
  // 3. Handle specialty recommendation if symptoms are found
  if (currentSymptoms.length > 0) {
    try {
      // Attempt ML prediction
      const prediction = await diseaseService.predictDisease(currentSymptoms);
      if (prediction && !prediction.error && prediction.primary_prediction !== 'Error') {
        const disease = prediction.primary_prediction;
        const confidence = prediction.confidence;
        const specialty = mapDiseaseToSpecialty(disease);
        
        const matchingDoctors = doctors.filter(d => d.specialization.toLowerCase() === specialty.toLowerCase());
        
        if (matchingDoctors.length > 0) {
          const doctorsList = matchingDoctors.map(d => 
            `• ${d.name} (${d.qualifications}, ${d.experience} experience) - Available: ${d.availableDays.join(', ')}`
          ).join('\n');
          return `Based on your symptoms (${currentSymptoms.join(', ')}), I predict you may have **${disease}** (${(confidence * 100).toFixed(1)}% confidence).\n\nI recommend seeing a **${specialty}** specialist.\n\nOur specialists:\n${doctorsList}\n\nWould you like me to check their availability?`;
        }
      }
      throw new Error('ML Prediction failed or no doctors found');
    } catch (error) {
      // Fallback to keyword matching
      const result = appointmentService.findDoctorsForSymptoms(currentSymptoms);
      if (result && result.found) {
        const doctorsList = result.doctors.map(d => 
          `• ${d.name} (${d.qualifications}, ${d.experience} experience) - Available: ${d.availableDays.join(', ')}`
        ).join('\n');
        return `Based on the symptoms you mentioned (**${currentSymptoms.join(', ')}**), I recommend a **${result.specialty}** specialist.\n\nAvailable doctors:\n${doctorsList}\n\nWould you like me to check availability or book an appointment?`;
      }
      return `I noticed you're experiencing: ${currentSymptoms.join(', ')}. Would you like me to help you find a general physician or search for a specific concern?`;
    }
  }

  // 4. Default if nothing matched
  const rawMatch = appointmentService.findDoctorsForSymptoms(message);
  if (rawMatch && rawMatch.found) {
    const doctorsList = rawMatch.doctors.map(d => `• ${d.name} (${d.specialization})`).join('\n');
    return `I can help you with that! Here are some specialists that might be relevant:\n${doctorsList}\n\nWould you like to book an appointment?`;
  }
  
  return null;
};

// Map predicted diseases to medical specialties
const mapDiseaseToSpecialty = (disease) => {
  const diseaseToSpecialtyMap = {
    'Fungal infection': 'Dermatology',
    'Allergy': 'Dermatology',
    'Drug Reaction': 'Dermatology',
    'Acne': 'Dermatology',
    'Psoriasis': 'Dermatology',
    'Impetigo': 'Dermatology',
    
    'Heart attack': 'Cardiology',
    'Hypertension': 'Cardiology',
    'Hypoglycemia': 'Cardiology',
    'Hyperthyroidism': 'Endocrinology',
    'Hypothyroidism': 'Endocrinology',
    
    'Migraine': 'Neurology',
    '(vertigo) Paroymsal Positional Vertigo': 'Neurology',
    'Cervical spondylosis': 'Neurology',
    'Paralysis (brain hemorrhage)': 'Neurology',
    
    'Common Cold': 'General Medicine',
    'Bronchial Asthma': 'General Medicine',
    'Pneumonia': 'General Medicine',
    'Tuberculosis': 'General Medicine',
    
    'Gastroenteritis': 'General Medicine',
    'GERD': 'General Medicine',
    'Peptic ulcer diseae': 'General Medicine',
    
    'Diabetes': 'Endocrinology',
    'Osteoarthristis': 'Orthopedics',
    'Arthritis': 'Orthopedics',
    
    'Chicken pox': 'General Medicine',
    'Dengue': 'General Medicine',
    'Typhoid': 'General Medicine',
    'Hepatitis A': 'General Medicine',
    'Hepatitis B': 'General Medicine',
    'Hepatitis C': 'General Medicine',
    'Hepatitis D': 'General Medicine',
    'Hepatitis E': 'General Medicine',
    'Jaundice': 'General Medicine',
    
    'AIDS': 'General Medicine',
    'Urinary tract infection': 'General Medicine',
    'Dimorphic hemorrhoids(piles)': 'General Medicine',
    'Alcoholic hepatitis': 'General Medicine',
    'Chronic cholestasis': 'General Medicine',
    
    'Varicose veins': 'Cardiology'
  };
  
  return diseaseToSpecialtyMap[disease] || 'General Medicine';
};

// Extract symptoms from user message
const extractSymptoms = (message) => {
  const lowerMsg = message.toLowerCase();
  const knownSymptoms = [
    'abdominal pain', 'abnormal menstruation', 'acidity', 'acute liver failure', 'altered sensorium', 'anxiety', 'back pain', 'belly pain', 'blackheads',
    'bladder discomfort', 'blister', 'blood in sputum', 'bloody stool', 'blurred and distorted vision', 'breathlessness', 'brittle nails', 'bruising', 'burning micturition',
    'chest pain', 'chills', 'cold hands and feet', 'coma', 'congestion', 'constipation', 'continuous feel of urine', 'continuous sneezing', 'cough', 'cramps',
    'dark urine', 'dehydration', 'depression', 'diarrhoea', 'dischromic patches', 'distention of abdomen', 'dizziness', 'drying and tingling lips', 'enlarged thyroid',
    'excessive hunger', 'extra marital contacts', 'family history', 'fast heart rate', 'fatigue', 'fluid overload', 'foul smell of urine', 'headache', 'high fever',
    'hip joint pain', 'history of alcohol consumption', 'increased appetite', 'indigestion', 'inflammatory nails', 'internal itching', 'irregular sugar level', 'irritability',
    'irritation in anus', 'joint pain', 'knee pain', 'lack of concentration', 'lethargy', 'loss of appetite', 'loss of balance', 'loss of smell', 'malaise', 'mild fever',
    'mood swings', 'movement stiffness', 'mucoid sputum', 'muscle pain', 'muscle wasting', 'muscle weakness', 'nausea', 'neck pain', 'nodal skin eruptions', 'obesity',
    'pain behind the eyes', 'pain during bowel movements', 'pain in anal region', 'painful walking', 'palpitations', 'passage of gases', 'patches in throat', 'phlegm',
    'polyuria', 'prominent veins on calf', 'puffy face and eyes', 'pus filled pimples', 'receiving blood transfusion', 'receiving unsterile injections', 'red sore around nose',
    'red spots over body', 'redness of eyes', 'restlessness', 'runny nose', 'rusty sputum', 'scurring', 'shivering', 'silver like dusting', 'sinus pressure', 'skin peeling',
    'skin rash', 'slurred speech', 'small dents in nails', 'spinning movements', 'spotting urination', 'stiff neck', 'stomach bleeding', 'stomach pain', 'sunken eyes',
    'sweating', 'swelled lymph nodes', 'swelling joints', 'swelling of stomach', 'swollen blood vessels', 'swollen extremeties', 'swollen legs', 'throat irritation',
    'toxic look', 'ulcers on tongue', 'unsteadiness', 'visual disturbances', 'vomiting', 'watering from eyes', 'weakness in limbs', 'weakness of one body side',
    'weight gain', 'weight loss', 'yellow crust ooze', 'yellow urine', 'yellowing of eyes', 'yellowish skin', 'itching'
  ];
  
  const foundSymptoms = [];
  knownSymptoms.forEach(symptom => {
    if (lowerMsg.includes(symptom)) {
      foundSymptoms.push(symptom);
    }
  });
  
  // Also check for common variations and synonyms
  const synonyms = {
    'fever': 'high fever',
    'temperature': 'high fever',
    'warm': 'high fever',
    'rash': 'skin rash',
    'itch': 'itching',
    'stomach': 'stomach pain',
    'tummy': 'stomach pain',
    'belly': 'belly pain',
    'head': 'headache',
    'throat': 'throat irritation',
    'cough': 'cough',
    'chest': 'chest pain',
    'heart': 'fast heart rate',
    'breath': 'shortness of breath',
    'bearth': 'shortness of breath',
    'breathing': 'shortness of breath',
    'dizzy': 'dizziness',
    'nausea': 'nausea',
    'vomit': 'vomiting',
    'back': 'back pain',
    'joint': 'joint pain'
  };

  Object.keys(synonyms).forEach(keyword => {
    if (lowerMsg.includes(keyword) && !foundSymptoms.includes(synonyms[keyword])) {
      foundSymptoms.push(synonyms[keyword]);
    }
  });
  
  return foundSymptoms;
};

// Handle appointment booking flow
const handleAppointmentFlow = (message, sessionData, intent) => {
  const lowerMsg = message.toLowerCase();
  
  if (intent.intent === 'BOOK_APPOINTMENT' && sessionData.state === CONVERSATION_STATE.NORMAL) {
    sessionData.state = CONVERSATION_STATE.COLLECTING_SYMPTOMS;
    return "I'd be happy to help you book an appointment! First, could you tell me what symptoms you're experiencing? This will help me find the right doctor for you.";
  }
  
  if (sessionData.state === CONVERSATION_STATE.COLLECTING_SYMPTOMS) {
    const result = appointmentService.findDoctorsForSymptoms(message);
    if (result && result.found) {
      sessionData.state = CONVERSATION_STATE.SELECTING_DOCTOR;
      sessionData.pendingBooking = { symptoms: message, specialty: result.specialty };
      const doctorsList = result.doctors.map((d, index) => 
        `${index + 1}. ${d.name} (${d.qualifications}) - Available: ${d.availableDays.join(', ')}`
      ).join('\n');
      return `For your symptoms, I recommend a ${result.specialty} specialist. Here are available doctors:\n\n${doctorsList}\n\nWhich doctor would you prefer? (Please reply with the number or doctor's name)`;
    } else {
      return "I want to make sure you see the right doctor. Could you describe your symptoms in more detail? For example: chest pain, headache, fever, skin rash, joint pain, etc.";
    }
  }
  
  if (sessionData.state === CONVERSATION_STATE.SELECTING_DOCTOR) {
    const doctors = appointmentService.getAllDoctors().filter(d => sessionData.pendingBooking.specialty === d.specialization);
    let selectedDoctor = null;
    const numMatch = message.match(/^(\d+)$/);
    if (numMatch) {
      const index = parseInt(numMatch[1]) - 1;
      if (index >= 0 && index < doctors.length) selectedDoctor = doctors[index];
    } else {
      selectedDoctor = doctors.find(d => message.toLowerCase().includes(d.name.toLowerCase()) || message.toLowerCase().includes(d.name.split(' ')[1].toLowerCase()));
    }
    if (selectedDoctor) {
      sessionData.pendingBooking.doctorId = selectedDoctor.id;
      sessionData.pendingBooking.doctorName = selectedDoctor.name;
      sessionData.state = CONVERSATION_STATE.SELECTING_DATE;
      return `Perfect! You've selected ${selectedDoctor.name}.\n\nWhat date would you like to book? Please provide the date in YYYY-MM-DD format (e.g., 2024-01-15).\n\nDr. ${selectedDoctor.name} is available on: ${selectedDoctor.availableDays.join(', ')}`;
    } else {
      return "I didn't catch which doctor you prefer. Could you please tell me the doctor's name or the number from the list?";
    }
  }
  
  if (sessionData.state === CONVERSATION_STATE.SELECTING_DATE) {
    const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const selectedDate = dateMatch[1];
      const availability = appointmentService.checkDoctorAvailability(sessionData.pendingBooking.doctorName, selectedDate);
      if (availability.found && availability.availability.available) {
        sessionData.pendingBooking.date = selectedDate;
        sessionData.state = CONVERSATION_STATE.SELECTING_TIME;
        const slots = availability.availability.availableSlots;
        const slotsList = slots.map((slot, index) => `${index + 1}. ${slot}`).join('\n');
        return `Great! Dr. ${sessionData.pendingBooking.doctorName} is available on ${selectedDate}.\n\nAvailable time slots:\n${slotsList}\n\nWhich time slot would you prefer? (Please reply with the number)`;
      } else {
        return availability.found ? `Dr. ${sessionData.pendingBooking.doctorName} is not available on ${selectedDate}. ${availability.availability.message}\n\nPlease choose another date.` : `I couldn't check availability. Please try another date.`;
      }
    } else {
      return "Please provide the date in YYYY-MM-DD format (e.g., 2024-01-15).";
    }
  }
  
  if (sessionData.state === CONVERSATION_STATE.SELECTING_TIME) {
    const numMatch = message.match(/^(\d+)$/);
    if (numMatch) {
      const availability = appointmentService.checkDoctorAvailability(sessionData.pendingBooking.doctorName, sessionData.pendingBooking.date);
      const slotIndex = parseInt(numMatch[1]) - 1;
      const availableSlots = availability.availability?.availableSlots || [];
      if (slotIndex >= 0 && slotIndex < availableSlots.length) {
        const selectedTime = availableSlots[slotIndex];
        sessionData.pendingBooking.timeSlot = selectedTime;
        sessionData.state = CONVERSATION_STATE.COLLECTING_BOOKING_INFO;
        return `Perfect! You've selected ${selectedTime}.\n\nTo complete your booking, I need a few details:\n\nWhat is your full name?`;
      } else {
        return "Please select a valid time slot number from the list.";
      }
    }
  }
  
  if (sessionData.state === CONVERSATION_STATE.COLLECTING_BOOKING_INFO && !sessionData.pendingBooking.patientName) {
    sessionData.pendingBooking.patientName = message;
    return "Thank you! What is your phone number?";
  }
  
  if (sessionData.state === CONVERSATION_STATE.COLLECTING_BOOKING_INFO && sessionData.pendingBooking.patientName && !sessionData.pendingBooking.patientPhone) {
    const phoneMatch = message.match(/[\d\s\-\+]{10,}/);
    if (phoneMatch) {
      sessionData.pendingBooking.patientPhone = phoneMatch[0].replace(/\s/g, '');
      const result = appointmentService.bookAppointment(sessionData.pendingBooking);
      sessionData.state = CONVERSATION_STATE.NORMAL;
      sessionData.pendingBooking = {};
      if (result.success) {
        return `✅ **${result.message}**\n\nYour appointment reference: **${result.appointment.id}**\n\nPlease arrive 15 minutes before your scheduled time. Bring your ID and insurance card.\n\nIs there anything else I can help you with?`;
      } else {
        return `I apologize, but I couldn't complete your booking: ${result.message}. Please try again or call us at (555) 123-4567.`;
      }
    } else {
      return "Please provide a valid phone number.";
    }
  }
  return null;
};

module.exports = {
  generateResponse
};
