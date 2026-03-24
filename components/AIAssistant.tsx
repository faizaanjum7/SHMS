import React, { useState } from 'react';
import { getDepartmentSuggestion } from '../services/geminiService';

const AIAssistant: React.FC = () => {
  const [symptom, setSymptom] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuggestion = async () => {
    if (!symptom.trim()) {
      setError('Please enter a symptom.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuggestion('');
    try {
      const result = await getDepartmentSuggestion(symptom);
      setSuggestion(result);
    } catch (err)
      {
      setError('Sorry, we could not get a suggestion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 dark:from-emerald-800 dark:to-cyan-800 p-8 md:p-12 rounded-2xl shadow-2xl text-white">
      <div className="flex items-center">
        <svg className="w-12 h-12 text-white/80 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
        <div>
            <h3 className="text-3xl font-bold">AI Symptom Checker</h3>
            <p className="mt-1 text-white/90">Not sure which department to book? Describe your symptom below.</p>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          placeholder="e.g., 'persistent skin rash' or 'chest pain'"
          className="w-full px-4 py-3 rounded-md border border-transparent bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:outline-none transition"
          disabled={isLoading}
        />
        <button
          onClick={handleSuggestion}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 bg-white text-emerald-700 font-bold rounded-md hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {isLoading ? 'Thinking...' : 'Get Suggestion'}
        </button>
      </div>
      {error && <p className="mt-3 text-red-200 text-sm font-semibold">{error}</p>}
      {suggestion && (
        <div className="mt-4 p-4 bg-white/20 rounded-lg">
          <p className="font-bold text-white">Suggested Department:</p>
          <p className="text-white/90">{suggestion}</p>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
