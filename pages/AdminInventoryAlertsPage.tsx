import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where, Query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { InventoryItem, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const AdminInventoryAlertsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const LOW_STOCK_THRESHOLD = 5;

  const isMedicalAdmin = userProfile?.role === UserRole.MEDICAL_ADMIN;
  const hospital = userProfile?.hospital || '';

  useEffect(() => {
    if (!isMedicalAdmin || !hospital) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const invQ: Query = query(
        collection(db, 'inventoryItems'),
        where('hospital', '==', hospital)
      );
      const unsub = onSnapshot(invQ, (snap) => {
        const list: InventoryItem[] = snap.docs.map(d => {
          const data: any = d.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          return {
            id: d.id,
            hospital: data.hospital,
            category: data.category,
            name: data.name,
            description: data.description || undefined,
            company: data.company || undefined,
            dateBroughtISO: data.dateBroughtISO || undefined,
            expiryDateISO: data.expiryDateISO || undefined,
            quantity: Number(data.quantity) || 0,
            createdAt,
          } as InventoryItem;
        });
        setInventoryItems(list);
        setLoading(false);
      }, (err) => {
        setError('Failed to load inventory alerts.');
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      setLoading(false);
    }
  }, [isMedicalAdmin, hospital]);

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const lowStock = useMemo(() => inventoryItems.filter(i => Number(i.quantity ?? 0) > 0 && Number(i.quantity ?? 0) <= LOW_STOCK_THRESHOLD), [inventoryItems]);
  const outOfStock = useMemo(() => inventoryItems.filter(i => Number(i.quantity ?? 0) <= 0), [inventoryItems]);
  const expiringSoon = useMemo(() => inventoryItems.filter(i => i.expiryDateISO && (() => { const d = new Date(i.expiryDateISO as string); return !isNaN(d.getTime()) && d >= now && d <= in7Days; })()), [inventoryItems]);

  if (!isMedicalAdmin) {
    return (
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2">This page is only for Medical Admins.</p>
      </div>
    );
  }

  if (!hospital) {
    return <div className="text-center">Please select your hospital to proceed.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold">Inventory Alerts</h1>
        <p className="text-sm text-gray-500">Hospital: {hospital}</p>
      </div>

      {error && <p className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">{error}</p>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700">
            <div className="px-6 py-3 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Out of Stock</h2>
              <span className="text-xs text-gray-500">{outOfStock.length}</span>
            </div>
            <div className="max-h-[400px] overflow-auto">
              {outOfStock.length === 0 ? (
                <div className="px-6 py-4 text-sm text-gray-500">None</div>
              ) : (
                <ul className="divide-y dark:divide-gray-700">
                  {outOfStock.map(it => (
                    <li key={it.id} className="px-6 py-3 text-sm">
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-gray-500">Category: {it.category}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700">
            <div className="px-6 py-3 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Low Stock (≤ {LOW_STOCK_THRESHOLD})</h2>
              <span className="text-xs text-gray-500">{lowStock.length}</span>
            </div>
            <div className="max-h-[400px] overflow-auto">
              {lowStock.length === 0 ? (
                <div className="px-6 py-4 text-sm text-gray-500">None</div>
              ) : (
                <ul className="divide-y dark:divide-gray-700">
                  {lowStock.map(it => (
                    <li key={it.id} className="px-6 py-3 text-sm">
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-gray-500">Qty: {it.quantity} • Category: {it.category}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700">
            <div className="px-6 py-3 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Expiring in 7 Days</h2>
              <span className="text-xs text-gray-500">{expiringSoon.length}</span>
            </div>
            <div className="max-h-[400px] overflow-auto">
              {expiringSoon.length === 0 ? (
                <div className="px-6 py-4 text-sm text-gray-500">None</div>
              ) : (
                <ul className="divide-y dark:divide-gray-700">
                  {expiringSoon.map(it => (
                    <li key={it.id} className="px-6 py-3 text-sm">
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-gray-500">Expiry: {new Date(it.expiryDateISO as string).toISOString().slice(0,10)} • Category: {it.category}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryAlertsPage;
