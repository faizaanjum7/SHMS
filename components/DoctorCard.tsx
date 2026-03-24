import React from 'react';
import { Link } from 'react-router-dom';
import type { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  return (
    <Link to={`/doctors/${doctor.id}`} className="group block h-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform group-hover:-translate-y-1 transition-transform duration-300 border dark:border-gray-700 h-full flex flex-col">
        <img
          className="w-full h-56 object-cover object-center"
          src={doctor.imageUrl}
          alt={doctor.name}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src.endsWith('/images/doctors/default.svg')) return;
            img.src = '/images/doctors/default.svg';
          }}
        />
        <div className="p-6 flex-grow flex flex-col">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{doctor.name}</h3>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">{doctor.specialty}</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{doctor.hospital}</p>
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-emerald-600 group-hover:text-emerald-800 dark:text-emerald-400 dark:group-hover:text-emerald-300 font-semibold">View Profile &rarr;</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DoctorCard;
