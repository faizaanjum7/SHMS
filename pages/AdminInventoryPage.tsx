import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where, Query, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, InventoryItem, UserRole } from '../types';
import AddInventoryModal from '../components/AddInventoryModal';
import { DEFAULT_INVENTORY_BY_HOSPITAL, DEFAULT_INVENTORY_GENERIC, INVENTORY_CATEGORIES } from '../constants';

const AdminInventoryPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [didAutoSeed, setDidAutoSeed] = useState(false);
  const [alertMessages, setAlertMessages] = useState<string[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [hasShownForSnapshot, setHasShownForSnapshot] = useState(false);
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
      const col = collection(db, 'appointments');
      // Show admitted with inventory (pending approval). You can widen if needed.
      let q: Query = query(
        col,
        where('hospital', '==', hospital),
        where('admitted', '==', true),
        orderBy('appointmentTime')
      );
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => {
          const data: any = d.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          return {
            id: d.id,
            ...data,
            createdAt,
          } as Appointment;
        });
        setItems(list);
      }, (err: any) => {
        console.error('Admin inventory listener error:', err);
        setError('Failed to load inventory approvals.');
      });
      // Inventory subscription
      // Keep query simple (no orderBy) to avoid composite index requirement initially
      const invQ = query(
        collection(db, 'inventoryItems'),
        where('hospital', '==', hospital)
      );
      const unsubInv = onSnapshot(invQ, (snap) => {
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
        setHasShownForSnapshot(false);
      }, (err) => {
        console.error('Inventory subscription error:', err);
        setLoading(false);
      });
      return () => { unsub(); unsubInv(); };
    } catch (e) {
      console.error('Unexpected error setting up admin inventory listener', e);
      setLoading(false);
    }
  }, [isMedicalAdmin, hospital]);

  useEffect(() => {
    if (!isMedicalAdmin || !hospital) return;
    if (inventoryItems.length === 0) return;
    if (hasShownForSnapshot) return;

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const msgs: string[] = [];

    for (const it of inventoryItems) {
      const qty = Number(it.quantity ?? 0);
      if (qty <= 0) {
        msgs.push(`${it.name} is out of stock`);
      } else if (qty <= LOW_STOCK_THRESHOLD) {
        msgs.push(`${it.name} low stock: ${qty} left`);
      }
      if (it.expiryDateISO) {
        const exp = new Date(it.expiryDateISO);
        if (!isNaN(exp.getTime()) && exp >= now && exp <= in7Days) {
          msgs.push(`${it.name} expires on ${exp.toISOString().slice(0, 10)}`);
        }
      }
    }

    if (msgs.length > 0) {
      setAlertMessages(msgs);
      setShowAlertModal(true);
      setHasShownForSnapshot(true);
    }
  }, [inventoryItems, isMedicalAdmin, hospital, hasShownForSnapshot]);

  // Auto-seed once if empty for known hospitals or generic fallback
  useEffect(() => {
    if (!isMedicalAdmin || !hospital) return;
    if (didAutoSeed) return;
    if (inventoryItems.length > 0) return;
    const defaults = DEFAULT_INVENTORY_BY_HOSPITAL[hospital];
    const toSeed = (defaults && defaults.length > 0) ? defaults : DEFAULT_INVENTORY_GENERIC;
    const run = async () => {
      try {
        for (const item of toSeed) {
          await addDoc(collection(db, 'inventoryItems'), {
            hospital,
            category: item.category,
            name: item.name,
            description: item.description || null,
            company: item.company || null,
            dateBroughtISO: null,
            expiryDateISO: item.expiryDateISO || null,
            quantity: item.quantity,
            createdAt: new Date().toISOString(),
          });
        }
        setDidAutoSeed(true);
      } catch (e) {
        // ignore auto-seed error
      }
    };
    run();
  }, [isMedicalAdmin, hospital, inventoryItems.length, didAutoSeed]);

  const pending = useMemo(
    () => items.filter(i => i.admitted && !i.adminApproved && Array.isArray(i.requiredInventory) && i.requiredInventory.length > 0),
    [items]
  );
  const approved = useMemo(() => items.filter(i => i.admitted && i.adminApproved && i.inventoryProvided), [items]);

  type InvRow = { name: string; totalQty: number; patients: number };
  const inventoryTotals: InvRow[] = useMemo(() => {
    const map = new Map<string, { totalQty: number; patients: number }>();
    for (const appt of approved) {
      if (!appt.requiredInventory) continue;
      for (const inv of appt.requiredInventory) {
        if (!inv.name) continue;
        const curr = map.get(inv.name) || { totalQty: 0, patients: 0 };
        curr.totalQty += Number(inv.qty || 0);
        curr.patients += 1;
        map.set(inv.name, curr);
      }
    }
    return Array.from(map.entries()).map(([name, v]) => ({ name, totalQty: v.totalQty, patients: v.patients }));
  }, [approved]);

  const handleApprove = async (appt: Appointment) => {
    if (!isMedicalAdmin || !currentUser) return;
    try {
      // Prevent double approval from re-deducting
      if (appt.adminApproved || appt.inventoryProvided) {
        alert('This admission is already approved and inventory marked as provided.');
        return;
      }
      const nowISO = new Date().toISOString();
      const ref = doc(db, 'appointments', appt.id);
      await updateDoc(ref, {
        adminApproved: true,
        approvedByUid: currentUser.uid,
        approvedAtISO: nowISO,
        inventoryProvided: true,
        providedAtISO: nowISO,
      });

      // Deduct inventory quantities for this hospital based on approved items
      if (Array.isArray(appt.requiredInventory) && appt.requiredInventory.length > 0) {
        for (const inv of appt.requiredInventory) {
          const name = String(inv.name || '').trim();
          let remaining = Math.max(0, Number(inv.qty) || 0);
          if (!name || remaining <= 0) continue;
          const invQ = query(
            collection(db, 'inventoryItems'),
            where('hospital', '==', hospital),
            where('name', '==', name)
          );
          const snap = await getDocs(invQ);
          // Sort by earliest expiry first if available, so we consume older stock
          const docs = snap.docs.sort((a, b) => {
            const ea = a.data().expiryDateISO || '';
            const eb = b.data().expiryDateISO || '';
            return String(ea).localeCompare(String(eb));
          });
          for (const d of docs) {
            if (remaining <= 0) break;
            const data: any = d.data();
            const currentQty = Math.max(0, Number(data.quantity) || 0);
            if (currentQty <= 0) continue;
            const deduct = Math.min(currentQty, remaining);
            const newQty = currentQty - deduct;
            await updateDoc(d.ref, { quantity: newQty });
            remaining -= deduct;
          }
          // If remaining > 0 here, it indicates insufficient stock; we ignore extra to avoid over-deduct.
        }
      }
    } catch (e) {
      console.error('Failed to approve admission/inventory:', e);
      alert('Failed to approve. Please try again.');
    }
  };

  const handleSeedDefaults = async () => {
    if (!hospital) return;
    const defaults = DEFAULT_INVENTORY_BY_HOSPITAL[hospital] || DEFAULT_INVENTORY_GENERIC;
    try {
      // Build existing names set to avoid duplicates by name within the hospital
      const existingSnap = await getDocs(query(collection(db, 'inventoryItems'), where('hospital', '==', hospital)));
      const existingNames = new Set(existingSnap.docs.map(d => String(d.data().name || '')));
      for (const item of defaults) {
        if (existingNames.has(item.name)) continue; // skip duplicates
        await addDoc(collection(db, 'inventoryItems'), {
          hospital,
          category: item.category,
          name: item.name,
          description: item.description || null,
          company: item.company || null,
          dateBroughtISO: null,
          expiryDateISO: item.expiryDateISO || null,
          quantity: item.quantity,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Failed seeding defaults', e);
      alert('Failed to seed defaults.');
    }
  };

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
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold">Admissions & Inventory Approvals</h1>
        <p className="text-sm text-gray-500">Hospital: {hospital}</p>
      </div>

      {error && <p className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">{error}</p>}

      {/* Pending Approvals */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Pending Approvals</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Doctor</th>
                  <th className="px-6 py-3">Admission Note</th>
                  <th className="px-6 py-3">Inventory</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr><td className="px-6 py-4" colSpan={5}>No pending admissions/inventory to approve.</td></tr>
                ) : pending.map(appt => (
                  <tr key={appt.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{appt.patientName}</div>
                      <div className="text-xs text-gray-500">{appt.date} • {appt.appointmentTime}</div>
                    </td>
                    <td className="px-6 py-4">{appt.doctorName}</td>
                    <td className="px-6 py-4 max-w-sm whitespace-pre-wrap">{appt.admissionNotes || '-'}</td>
                    <td className="px-6 py-4">
                      {appt.requiredInventory && appt.requiredInventory.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {appt.requiredInventory.map((inv, i) => (
                            <li key={i}>{inv.name} — x{inv.qty}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">No inventory listed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleApprove(appt)}
                        className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700"
                      >
                        Approve & Mark Provided
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Inventory Tracker */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Hospital Inventory Tracker</h2>
        <p className="text-sm text-gray-500">Aggregated from approved & provided admissions</p>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Catalog reflects live items stored for {hospital}.</div>
          <div className="flex gap-2">
            {inventoryItems.length === 0 && (
              <button onClick={handleSeedDefaults} className="px-3 py-2 bg-blue-600 text-white rounded-md">Seed Defaults</button>
            )}
            <button onClick={() => setIsAddModalOpen(true)} className="px-3 py-2 bg-emerald-600 text-white rounded-md">Add Inventory</button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3">Inventory Item</th>
                <th className="px-6 py-3">Total Quantity</th>
                <th className="px-6 py-3">Patients</th>
              </tr>
            </thead>
            <tbody>
              {inventoryTotals.length === 0 ? (
                <tr><td className="px-6 py-4" colSpan={3}>No inventory provided yet.</td></tr>
              ) : inventoryTotals.map(row => (
                <tr key={row.name} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                  <td className="px-6 py-4">{row.name}</td>
                  <td className="px-6 py-4">{row.totalQty}</td>
                  <td className="px-6 py-4">{row.patients}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Full Catalog grouped by category */}
        <div className="space-y-6">
          {INVENTORY_CATEGORIES.map(cat => {
            const rowsRaw = inventoryItems.filter(i => i.category === cat);
            // Group by name+company within category for a cleaner, deduplicated view
            const grouped = new Map<string, { id: string; name: string; description?: string; company?: string; dateBroughtISO?: string; expiryDateISO?: string; quantity: number }>();
            for (const r of rowsRaw) {
              const key = `${r.name}|${r.company || ''}`;
              const curr = grouped.get(key);
              if (!curr) {
                grouped.set(key, {
                  id: r.id,
                  name: r.name,
                  description: r.description,
                  company: r.company,
                  dateBroughtISO: r.dateBroughtISO,
                  expiryDateISO: r.expiryDateISO,
                  quantity: Number(r.quantity || 0),
                });
              } else {
                curr.quantity += Number(r.quantity || 0);
              }
            }
            const rows = Array.from(grouped.values());
            return (
              <div key={cat} className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700">
                <div className="px-6 py-3 border-b dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{cat}</h3>
                  <span className="text-xs text-gray-500">{rows.length} unique items</span>
                </div>
                {rows.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-gray-500">No items in this category.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <tr>
                          <th className="px-6 py-2">Name</th>
                          <th className="px-6 py-2">Usage / Description</th>
                          <th className="px-6 py-2">Company</th>
                          <th className="px-6 py-2">Date Brought</th>
                          <th className="px-6 py-2">Expiry Date</th>
                          <th className="px-6 py-2">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(row => (
                          <tr key={`${row.name}|${row.company || ''}`} className="border-t dark:border-gray-700">
                            <td className="px-6 py-2">{row.name}</td>
                            <td className="px-6 py-2 max-w-xs whitespace-pre-wrap">{row.description || '-'}</td>
                            <td className="px-6 py-2">{row.company || '-'}</td>
                            <td className="px-6 py-2">{row.dateBroughtISO || '-'}</td>
                            <td className="px-6 py-2">{row.expiryDateISO || '-'}</td>
                            <td className="px-6 py-2">{row.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-full flex flex-col rounded-lg bg-white dark:bg-gray-800 shadow-xl border dark:border-gray-700">
            <div className="px-5 py-3 border-b dark:border-gray-700 flex items-center justify-between shrink-0">
              <h4 className="text-lg font-semibold">Inventory Alerts</h4>
              <button onClick={() => setShowAlertModal(false)} className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Close</button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto min-h-0">
              <p className="text-sm text-gray-600 dark:text-gray-300 shrink-0">The following items need attention:</p>
              <ul className="list-disc list-inside space-y-1">
                {alertMessages.map((m, i) => (
                  <li key={i} className="text-sm">{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <AddInventoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        hospital={hospital}
        onAdded={() => {}}
      />
    </div>
  );
};

export default AdminInventoryPage;
