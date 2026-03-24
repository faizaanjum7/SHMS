import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Review } from '../types';

interface ReviewSectionProps {
  doctorName?: string;
  hospitalName?: string;
  type: 'doctor' | 'hospital';
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ doctorName, hospitalName, type }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reviewsCol = collection(db, 'reviews');
    let q;
    
    if (type === 'doctor' && doctorName) {
      q = query(reviewsCol, where('doctorName', '==', doctorName));
    } else if (type === 'hospital' && hospitalName) {
      q = query(reviewsCol, where('hospital', '==', hospitalName));
    } else {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      // Sort in memory to avoid index requirements
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setReviews(data);
      setLoading(false);
    }, (error) => {
      console.error("Reviews listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [doctorName, hospitalName, type]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + (type === 'doctor' ? r.doctorRating : r.hospitalRating), 0);
    return {
      avg: (sum / reviews.length).toFixed(1),
      count: reviews.length
    };
  }, [reviews, type]);

  if (loading) return (
    <div className="flex justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Patient Reviews</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Verified feedback from visited patients.</p>
        </div>
        {stats.count > 0 && (
          <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
            <div className="text-center">
              <p className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-widest">Average Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-emerald-800 dark:text-emerald-200">{stats.avg}</span>
                <span className="text-xl text-amber-400">★</span>
              </div>
            </div>
            <div className="w-px h-10 bg-emerald-200 dark:bg-emerald-800/50"></div>
            <div className="text-center">
              <p className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-widest">Total Reviews</p>
              <p className="text-3xl font-black text-emerald-800 dark:text-emerald-200">{stats.count}</p>
            </div>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <span className="text-4xl mb-4 block">⭐</span>
          <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm">No reviews yet for this {type}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-black text-lg">
                    {review.patientName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white leading-tight">{review.patientName}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`text-lg ${star <= (type === 'doctor' ? review.doctorRating : review.hospitalRating) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm italic">
                "{review.comment || 'No written feedback provided.'}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
