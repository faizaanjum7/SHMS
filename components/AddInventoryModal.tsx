import React, { useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { INVENTORY_CATEGORIES } from '../constants';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: string;
  onAdded: () => void;
}

const AddInventoryModal: React.FC<AddInventoryModalProps> = ({ isOpen, onClose, hospital, onAdded }) => {
  const [category, setCategory] = useState<typeof INVENTORY_CATEGORIES[number]>('Medicines');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState('');
  const [dateBrought, setDateBrought] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCategory('Medicines');
    setName('');
    setDescription('');
    setCompany('');
    setDateBrought('');
    setExpiryDate('');
    setQuantity(1);
    setError('');
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) {
      setError('Select hospital first.');
      return;
    }
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'inventoryItems'), {
        hospital,
        category,
        name: name.trim(),
        description: description.trim() || null,
        company: company.trim() || null,
        dateBroughtISO: dateBrought || null,
        expiryDateISO: expiryDate || null,
        quantity: Number(quantity) || 0,
        createdAt: serverTimestamp(),
      });
      onAdded();
      onClose();
    } catch (e) {
      console.error('Failed to add inventory item', e);
      setError('Failed to add item.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const label = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
  const input = 'mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-emerald-500 focus:border-emerald-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Add Inventory Item</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={label}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className={input}>
              {INVENTORY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="e.g., Paracetamol 650mg" />
          </div>
          <div>
            <label className={label}>Usage / Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={input} rows={3} placeholder="Short description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Company</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className={input} placeholder="Manufacturer / Supplier" />
            </div>
            <div>
              <label className={label}>Quantity</label>
              <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Date Brought</label>
              <input type="date" value={dateBrought} onChange={(e) => setDateBrought(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Expiry Date</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={input} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-md disabled:bg-emerald-300">{loading ? 'Saving...' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventoryModal;
