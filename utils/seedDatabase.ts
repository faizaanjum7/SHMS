import { db } from '../services/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

export const seedSymptomMappings = async () => {
  const mappings = [
    {
      symptom: "chest pain",
      specialties: [
        { type: "Cardiology", weight: 10 },
        { type: "General Medicine", weight: 5 }
      ],
      isEmergency: true
    },
    {
      symptom: "shortness of breath",
      specialties: [
        { type: "Cardiologist", weight: 8 },
        { type: "Pulmonologist", weight: 10 }
      ],
      isEmergency: true
    },
    {
      symptom: "fever",
      specialties: [
        { type: "General Physician", weight: 10 },
        { type: "Pediatrician", weight: 5 }
      ],
      isEmergency: false
    },
    {
      symptom: "cough",
      specialties: [
        { type: "General Physician", weight: 10 },
        { type: "Pulmonologist", weight: 7 }
      ],
      isEmergency: false
    },
    {
      symptom: "skin rash",
      specialties: [
        { type: "Dermatologist", weight: 10 }
      ],
      isEmergency: false
    },
    {
      symptom: "headache",
      specialties: [
        { type: "Neurologist", weight: 10 },
        { type: "General Physician", weight: 5 }
      ],
      isEmergency: false
    }
  ];

  for (const m of mappings) {
    await addDoc(collection(db, 'symptomMappings'), m);
  }
  console.log("Symptom mappings seeded!");
};

export const seedDoctors = async () => {
  const doctors = [
    {
      name: "Dr. Evelyn Reed",
      specialty: "Cardiology",
      hospital: "King George Hospital Visakhapatnam",
      experience: 15,
      rating: 4.9,
      availableSlots: [
        { date: new Date(Date.now() + 86400000), time: "09:00 AM", isBooked: false },
        { date: new Date(Date.now() + 86400000), time: "10:00 AM", isBooked: false }
      ]
    },
    {
      name: "Dr. Sofia Rossi",
      specialty: "Dermatologist",
      hospital: "Government General Hospital Vijayawada",
      experience: 8,
      rating: 4.7,
      availableSlots: [
        { date: new Date(Date.now() + 86400000), time: "11:00 AM", isBooked: false }
      ]
    }
  ];

  for (const d of doctors) {
    await addDoc(collection(db, 'doctors'), d);
  }
  console.log("Doctors seeded!");
};
