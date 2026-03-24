import React from 'react';
import { HOSPITALS } from '../constants';
import HospitalCard from '../components/HospitalCard';

const HospitalsPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 text-center">Our Affiliated Hospitals</h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mt-2">World-class facilities dedicated to your health.</p>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {HOSPITALS.map(hospital => (
          <HospitalCard key={hospital.id} hospital={hospital} />
        ))}
      </div>
    </div>
  );
};

export default HospitalsPage;
