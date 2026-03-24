import React, { useState, useEffect, useMemo } from 'react';
import { DOCTORS } from '../constants';
import DoctorCard from '../components/DoctorCard';
import { Doctor, UserRole } from '../types';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const DoctorsPage: React.FC = () => {
  const [hospitalFilter, setHospitalFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [dynamicDoctors, setDynamicDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to normalize lookups
  const normalizeDoctorName = (name: string) => name.replace(/^\s*dr\.?\s*/i, '').replace(/\s+/g, ' ').trim();
  const displayDoctorName = (name: string) => `Dr. ${normalizeDoctorName(name)}`;

  useEffect(() => {
    const fetchDynamicDoctors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', UserRole.DOCTOR));
        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.fullName || 'Doctor',
            specialty: data.specialty || 'General',
            hospital: data.hospital || 'SHMS',
            imageUrl: data.imageUrl || '/images/doctors/default.svg',
            contact: data.email || 'N/A',
            ...data
          } as Doctor;
        });
        setDynamicDoctors(docs);
      } catch (err) {
        console.error("Error fetching dynamic doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDynamicDoctors();
  }, []);

  const combinedDoctors = useMemo(() => {
    const constantDocs = DOCTORS.map(d => ({
      ...d,
      id: String(d.id), // Stringify for universal compatibility
      name: displayDoctorName(d.name)
    })) as Doctor[];

    // Simple deduplication by normalized name and hospital
    const map = new Map<string, Doctor>();
    [...dynamicDoctors, ...constantDocs].forEach(d => {
      const key = `${normalizeDoctorName(d.name).toLowerCase()}|${d.hospital.toLowerCase()}`;
      if (!map.has(key)) map.set(key, d);
    });
    
    return Array.from(map.values());
  }, [dynamicDoctors]);

  const hospitals = useMemo(() => ['All', ...Array.from(new Set(combinedDoctors.map(d => d.hospital)))], [combinedDoctors]);
  const specialties = useMemo(() => ['All', ...Array.from(new Set(combinedDoctors.map(d => d.specialty)))], [combinedDoctors]);

  const filteredDoctors = useMemo(() => {
    return combinedDoctors.filter(doctor => {
      const hospitalMatch = hospitalFilter === 'All' || doctor.hospital === hospitalFilter;
      const specialtyMatch = specialtyFilter === 'All' || doctor.specialty === specialtyFilter;
      return hospitalMatch && specialtyMatch;
    });
  }, [combinedDoctors, hospitalFilter, specialtyFilter]);

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
        {loading ? (
           <div className="col-span-full py-20 text-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mx-auto"></div>
             <p className="mt-4 text-gray-500 font-bold animate-pulse">Gathering Medical Team...</p>
           </div>
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} />)
        ) : (
          <p className="text-center col-span-full text-gray-500 dark:text-gray-400">No doctors found matching your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;
