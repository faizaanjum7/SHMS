import React from 'react';
import { Link } from 'react-router-dom';
import type { Hospital } from '../types';

interface HospitalCardProps {
  hospital: Hospital;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ hospital }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border dark:border-gray-700">
      <img
        className="w-full h-56 object-cover object-center"
        src={hospital.imageUrl}
        alt={hospital.name}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (img.src.endsWith('/images/hospitals/default.svg')) return;
          img.src = '/images/hospitals/default.svg';
        }}
      />
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{hospital.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">{hospital.location}</p>
        <p className="text-gray-500 dark:text-gray-400 mt-4 h-24 overflow-hidden">{hospital.description}</p>
        <div className="mt-4">
          <Link to={`/hospitals/${hospital.id}`} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold">
            View Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;
