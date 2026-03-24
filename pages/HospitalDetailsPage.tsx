import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HOSPITALS, DOCTORS } from '../constants';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { UserRole, Review } from '../types';
import ReviewSection from '../components/ReviewSection';
import { useAuth } from '../contexts/AuthContext';

const HospitalDetailsPage: React.FC = () => {
  const { id } = useParams();
  const hospitalId = Number(id);
  const hospital = HOSPITALS.find(h => h.id === hospitalId);
  const { userProfile } = useAuth();

  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState<string | null>(null);
  const [numReviews, setNumReviews] = useState(0);

  const isMedicalAdminForThisHospital = 
    userProfile?.role === UserRole.MEDICAL_ADMIN && 
    userProfile?.hospital === hospital?.name;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', UserRole.DOCTOR));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setAllDoctors(docs);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();

    // Fetch Reviews for Rating Summary
    const reviewsQ = query(collection(db, 'reviews'), where('hospital', '==', hospital?.name));
    const unsubscribe = onSnapshot(reviewsQ, (snap) => {
      if (!snap.empty) {
        const ratings = snap.docs.map(d => (d.data() as Review).hospitalRating);
        const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
        setAvgRating(avg);
        setNumReviews(ratings.length);
      }
    });

    return () => unsubscribe();
  }, [hospital?.name]);

  const normalizeDoctorName = (name: string) => name.replace(/^\s*dr\.?\s*/i, '').replace(/\s+/g, ' ').trim();
  const displayDoctorName = (name: string) => `Dr. ${normalizeDoctorName(name)}`;

  const fallbackDoctors = useMemo(() => DOCTORS.map(d => ({
    uid: String(d.id), // Use real ID for linking
    fullName: displayDoctorName(d.name),
    hospital: d.hospital,
    specialty: d.specialty,
    imageUrl: d.imageUrl,
    _normalizedName: normalizeDoctorName(d.name),
    _source: 'const' as const,
  })), []);

  const combinedDoctors = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of allDoctors) {
      const normalized = normalizeDoctorName(String(d.fullName || ''));
      const key = `${normalized}|${d.hospital}|${d.specialty}`;
      if (!map.has(key)) {
        map.set(key, { ...d, fullName: displayDoctorName(String(d.fullName || '')) });
      }
    }
    for (const d of fallbackDoctors) {
      const key = `${d._normalizedName}|${d.hospital}|${d.specialty}`;
      if (!map.has(key)) map.set(key, d);
    }
    return Array.from(map.values());
  }, [allDoctors, fallbackDoctors]);

  if (!hospital) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Hospital not found</h1>
        <Link className="text-emerald-600 mt-4 inline-block" to="/hospitals">Back to Hospitals</Link>
      </div>
    );
  }

  const doctorsForHospital = combinedDoctors.filter(d => d.hospital === hospital.name);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden">
        <div className="relative h-64 md:h-96">
          <img 
            src={hospital.imageUrl} 
            alt={hospital.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src.endsWith('/images/hospitals/default.svg')) return;
              img.src = '/images/hospitals/default.svg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-8 text-white">
              <h1 className="text-4xl md:text-5xl font-extrabold">{hospital.name}</h1>
              <p className="text-emerald-400 font-medium text-lg mt-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {hospital.location}
              </p>
              {avgRating && (
                <div className="mt-4 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 w-fit">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-black text-white">{avgRating}</span>
                    <span className="text-amber-400 text-xl">★</span>
                  </div>
                  <div className="w-px h-6 bg-white/20"></div>
                  <span className="text-sm font-bold opacity-90">{numReviews} Patient Reviews</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">About the Hospital</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              {hospital.description}
            </p>
            {hospital.otherInfo && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold mb-1 uppercase text-xs tracking-wider">Additional Information</p>
                <p>{hospital.otherInfo}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border dark:border-gray-700">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                    <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Available Beds</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{hospital.bedsAvailable || 'N/A'}</p>
                  </div>
               </div>
            </div>

            {isMedicalAdminForThisHospital && (
              <div className="p-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200 dark:shadow-none">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[14px] text-center space-y-4">
                  <p className="font-bold text-gray-800 dark:text-gray-100">Medical Administration</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage hospital-wide inventory and drug stocks.</p>
                  <Link 
                    to="/admin-inventory" 
                    className="block w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Manage Inventory
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-4">Our Medical Doctors</h2>
        {loading && doctorsForHospital.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 px-4">Loading doctors...</p>
        ) : doctorsForHospital.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 px-4">No doctors listed for this hospital yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {doctorsForHospital.map(d => {
              const doctorId = d.uid.startsWith('const-') ? d.uid.split('-')[1] : d.uid;
              const firstName = normalizeDoctorName(String(d.fullName || '')).split(' ')[0].toLowerCase();
              const computedSrc = d.imageUrl || `/images/doctors/${firstName}.jpg`;
              return (
              <Link to={`/doctors/${doctorId}`} key={d.uid} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300 border dark:border-gray-700 flex flex-col h-full">
                <img
                  src={computedSrc}
                  alt={d.fullName}
                  className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src.endsWith('/images/doctors/default.svg')) return;
                    img.src = '/images/doctors/default.svg';
                  }}
                />
                <div className="p-6 flex-grow flex flex-col">
                  <div className="font-bold text-xl text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">{d.fullName}</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-medium">{d.specialty}</div>
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm font-semibold text-emerald-600">
                    <span>View Profile</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center pt-8">
        <Link className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-all" to="/hospitals">
          Explore Other Hospitals
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
        <ReviewSection hospitalName={hospital.name} type="hospital" />
      </div>
    </div>
  );
};

export default HospitalDetailsPage;
