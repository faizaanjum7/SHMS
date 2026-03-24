import React, { useState, useMemo } from 'react';
import { DOCTORS } from '../constants';
import DoctorCard from '../components/DoctorCard';
import type { Doctor } from '../types';

const DoctorsPage: React.FC = () => {
  const [hospitalFilter, setHospitalFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  const hospitals = useMemo(() => ['All', ...Array.from(new Set(DOCTORS.map(d => d.hospital)))], []);
  const specialties = useMemo(() => ['All', ...Array.from(new Set(DOCTORS.map(d => d.specialty)))], []);

  const filteredDoctors = useMemo(() => {
    return DOCTORS.filter(doctor => {
      const hospitalMatch = hospitalFilter === 'All' || doctor.hospital === hospitalFilter;
      const specialtyMatch = specialtyFilter === 'All' || doctor.specialty === specialtyFilter;
      return hospitalMatch && specialtyMatch;
    });
  }, [hospitalFilter, specialtyFilter]);

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">Our Medical Experts</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">Find the right specialist for your needs from our list of dedicated and experienced professionals.</p>
      </div>

      {/* Filters */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center border dark:border-gray-700">
        <div className="flex-1 w-full">
          <label htmlFor="hospital-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Hospital</label>
          <select
            id="hospital-filter"
            value={hospitalFilter}
            onChange={(e) => setHospitalFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            {hospitals.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label htmlFor="specialty-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Specialty</label>
          <select
            id="specialty-filter"
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} />)
        ) : (
          <p className="text-center col-span-full text-gray-500 dark:text-gray-400">No doctors found matching your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;
