import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDepartmentSuggestion, SuggestionResult } from '../services/geminiService';

const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [duration, setDuration] = useState('1 day');
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const commonSymptoms = ['Fever', 'Cough', 'Chest Pain', 'Headache', 'Rash', 'Shortness of Breath', 'Nausea', 'Fatigue'];

  const addSymptom = (s: string) => {
    if (s && !symptoms.includes(s)) {
      setSymptoms([...symptoms, s]);
      setCurrentSymptom('');
    }
  };

  const removeSymptom = (s: string) => {
    setSymptoms(symptoms.filter(sym => sym !== s));
  };

  const handleSuggestion = async () => {
    if (symptoms.length === 0 && !currentSymptom.trim()) {
      setError('Please add at least one symptom.');
      return;
    }
    
    const finalSymptoms = [...symptoms];
    if (currentSymptom.trim() && !finalSymptoms.includes(currentSymptom.trim())) {
      finalSymptoms.push(currentSymptom.trim());
    }

    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await getDepartmentSuggestion(finalSymptoms);
      setResult(res);
    } catch (err) {
      setError('Sorry, we could not get a suggestion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindDoctors = () => {
    if (result) {
      navigate('/doctors', { state: { suggestedSpecialty: result.specialty } });
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 dark:from-emerald-800 dark:to-cyan-800 p-8 md:p-12 rounded-2xl shadow-2xl text-white">
      <div className="flex items-center">
        <svg className="w-12 h-12 text-white/80 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
        <div>
            <h3 className="text-3xl font-bold">Intelligent Symptom Checker</h3>
            <p className="mt-1 text-white/90">Multi-symptom analysis with priority mapping.</p>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-white/80">Add Symptoms</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentSymptom}
              onChange={(e) => setCurrentSymptom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSymptom(currentSymptom)}
              placeholder="e.g., chest pain"
              className="flex-1 px-4 py-2 rounded-md bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button onClick={() => addSymptom(currentSymptom)} className="px-4 py-2 bg-white text-emerald-700 font-bold rounded-md hover:bg-emerald-50 transition-colors">Add</button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {symptoms.map(s => (
              <span key={s} className="px-3 py-1 bg-white/30 rounded-full text-sm flex items-center gap-2">
                {s}
                <button onClick={() => removeSymptom(s)} className="hover:text-red-300">×</button>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
             <span className="text-xs text-white/70 w-full">Quick Add:</span>
             {commonSymptoms.filter(s => !symptoms.includes(s)).slice(0, 5).map(s => (
               <button key={s} onClick={() => addSymptom(s)} className="text-xs px-2 py-1 border border-white/20 rounded-md hover:bg-white/10">{s}</button>
             ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Severity</label>
              <select 
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-4 py-2 rounded-md bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="mild" className="text-gray-900">Mild</option>
                <option value="moderate" className="text-gray-900">Moderate</option>
                <option value="severe" className="text-gray-900">Severe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Duration</label>
              <select 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="1 day" className="text-gray-900">1 day</option>
                <option value="2-3 days" className="text-gray-900">2-3 days</option>
                <option value="1 week" className="text-gray-900">1 week</option>
                <option value="2+ weeks" className="text-gray-900">2+ weeks</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSuggestion}
            disabled={isLoading}
            className="w-full mt-6 px-6 py-3 bg-white text-emerald-700 font-bold rounded-md shadow-lg hover:shadow-xl disabled:bg-opacity-50 transition-all transform hover:-translate-y-1"
          >
            {isLoading ? 'Analyzing Symptoms...' : 'Analyze Symptoms'}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-red-200 text-sm font-semibold bg-red-900/20 p-2 rounded">{error}</p>}
      
      {result && (
        <div className="mt-8 p-6 bg-white/10 rounded-xl border border-white/20 animate-fade-in">
          {result.isEmergency && (
            <div className="mb-4 p-4 bg-red-600/40 border border-red-400 rounded-lg flex items-center gap-3 animate-pulse">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-bold text-white">EMERGENCY DETECTED</p>
                <p className="text-sm text-red-100">This may be an emergency. Please seek immediate medical attention.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-white/70 text-sm uppercase tracking-wider font-bold">Suggested Specialty</p>
              <h4 className="text-3xl font-bold">{result.specialty}</h4>
              <p className="text-white/80 mt-1">Confidence Score: {(result.confidence * 100).toFixed(0)}%</p>
            </div>
            <button 
              onClick={handleFindDoctors}
              className="px-8 py-3 bg-emerald-100 text-emerald-800 font-bold rounded-full hover:bg-white transition-all shadow-md"
            >
              Find Doctors
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
