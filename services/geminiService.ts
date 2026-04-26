import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { SymptomMapping, Doctor } from '../types';

export interface SuggestionResult {
  specialty: string;
  confidence: number;
  isEmergency: boolean;
}

const STATIC_MAPPINGS: SymptomMapping[] = [
  { id: '1', symptom: 'chest pain', isEmergency: true, specialties: [{ type: 'Cardiology', weight: 10 }, { type: 'General Medicine', weight: 5 }] },
  { id: '2', symptom: 'shortness of breath', isEmergency: true, specialties: [{ type: 'Cardiology', weight: 8 }, { type: 'Pulmonology', weight: 10 }] },
  { id: '3', symptom: 'fever', isEmergency: false, specialties: [{ type: 'General Medicine', weight: 10 }] },
  { id: '4', symptom: 'cough', isEmergency: false, specialties: [{ type: 'General Medicine', weight: 10 }, { type: 'Pulmonology', weight: 6 }] },
  { id: '5', symptom: 'skin rash', isEmergency: false, specialties: [{ type: 'Dermatology', weight: 10 }] },
  { id: '6', symptom: 'headache', isEmergency: false, specialties: [{ type: 'Neurology', weight: 10 }] },
  { id: '7', symptom: 'blurred vision', isEmergency: false, specialties: [{ type: 'Ophthalmology', weight: 10 }] },
  { id: '8', symptom: 'stomach pain', isEmergency: false, specialties: [{ type: 'Gastroenterology', weight: 10 }] },
];

export const getDepartmentSuggestion = async (symptoms: string[], severity: string = 'mild', duration: string = '1 day'): Promise<SuggestionResult> => {
  console.log(`Getting suggestion for symptoms: ${symptoms.join(', ')}`);
  
  try {
    const mappingsRef = collection(db, 'symptomMappings');
    let mappings: SymptomMapping[] = [];
    
    try {
      const snap = await getDocs(mappingsRef);
      mappings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SymptomMapping);
    } catch (dbErr) {
      console.warn("Firestore fetch failed, using static fallback:", dbErr);
      mappings = STATIC_MAPPINGS;
    }

    if (mappings.length === 0) {
      console.log("No mappings found in DB, using static fallback.");
      mappings = STATIC_MAPPINGS;
    }

    const scores: Record<string, number> = {};
    let isEmergency = false;

    symptoms.forEach(s => {
      const sLower = s.toLowerCase().trim();

      // Custom rule for skin allergy
      if (sLower === 'skin allergy' || sLower.includes('skin allergy')) {
        const isSevereOrModerate = severity === 'severe' || severity === 'moderate';
        const isLongDuration = duration !== '1 day';
        if (isSevereOrModerate && isLongDuration) {
          scores['Dermatology'] = (scores['Dermatology'] || 0) + 15;
        } else {
          scores['General Physician'] = (scores['General Physician'] || 0) + 10;
        }
        return;
      }

      const mapping = mappings.find(m => m.symptom.toLowerCase() === sLower || sLower.includes(m.symptom.toLowerCase()));
      if (mapping) {
        if (mapping.isEmergency) isEmergency = true;
        mapping.specialties.forEach(spec => {
          scores[spec.type] = (scores[spec.type] || 0) + spec.weight;
        });
      }
    });

    // Default if no mapping found
    if (Object.keys(scores).length === 0) {
      return { specialty: 'General Physician', confidence: 0.5, isEmergency };
    }

    // Sort by score
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const bestMatch = sortedScores[0];
    const confidence = bestMatch[1] / (totalScore || 1);

    return {
      specialty: bestMatch[0],
      confidence: parseFloat(confidence.toFixed(2)),
      isEmergency
    };
  } catch (err) {
    console.error("Critical error in getDepartmentSuggestion:", err);
    return { specialty: 'General Physician', confidence: 0.5, isEmergency: false };
  }
};

export const getDoctorsBySpecialty = async (specialty: string): Promise<Doctor[]> => {
  try {
    const doctorsRef = collection(db, 'doctors');
    const q = query(doctorsRef, where('specialty', '==', specialty));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Doctor);
  } catch (err) {
    console.error("Error fetching doctors by specialty:", err);
    return [];
  }
};
