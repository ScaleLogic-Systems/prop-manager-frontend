// app/marketer/tabs/AddPropertyTab.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Sparkles, Building, RefreshCw, Plus, Edit2, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface UtilityItem {
  name: string;
  amount: number;
}

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  rent_amount: number;
  deposit_fee: number | null;
  use_type: 'residential' | 'commercial';
  vat_treatment: 'A_EXEMPT' | 'B_STANDARD_16';
  vat_rate: number;
  water_fee: number | null;
  utilities: UtilityItem[];
  is_occupied: boolean;
}

interface Property {
  id: string;
  name: string;
  location: string;
  units: Unit[];
}

interface AddPropertyTabProps {
  currentUserId?: string;
  fullName: string;
}

export const AddPropertyTab: React.FC<AddPropertyTabProps> = ({ currentUserId, fullName }) => {
  // Form state
  const [propertyName, setPropertyName] = useState('');
  const [location, setLocation] = useState('');

  const [unitNumber, setUnitNumber] = useState('');
  const [rentAmount, setRentAmount] = useState<number | ''>('');
  const [depositFee, setDepositFee] = useState<number | ''>('');
  const [useType, setUseType] = useState<'residential' | 'commercial'>('residential');

  // Water Meter state
  const [waterFee, setWaterFee] = useState<number | ''>(0);
  const [isWaterNA, setIsWaterNA] = useState(false);

  // Dynamic Utilities State
  const [utilities, setUtilities] = useState<UtilityItem[]>([]);
  const [tempUtilityName, setTempUtilityName] = useState('');
  const [tempUtilityFee, setTempUtilityFee] = useState<number | ''>('');

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Edit Modal State
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editUnitNumber, setEditUnitNumber] = useState('');
  const [editRentAmount, setEditRentAmount] = useState<number | ''>('');
  const [editDepositFee, setEditDepositFee] = useState<number | ''>('');
  const [editUseType, setEditUseType] = useState<'residential' | 'commercial'>('residential');

  const [editWaterFee, setEditWaterFee] = useState<number | ''>(0);
  const [isEditWaterNA, setIsEditWaterNA] = useState(false);
  const [editUtilities, setEditUtilities] = useState<UtilityItem[]>([]);
  const [editTempName, setEditTempName] = useState('');
  const [editTempFee, setEditTempFee] = useState<number | ''>('');

  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setListLoading(true);
      setListError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/marketer/api/properties-overview', {
        cache: 'no-store',
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch (Status ${res.status})`);
      }

      const data = await res.json();
      setProperties(data.properties || []);
    } catch (err: unknown) {
      console.error('Error fetching properties:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load properties.';
      setListError(msg);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [currentUserId]);

  const handleAddUtility = () => {
    if (!tempUtilityName.trim() || tempUtilityFee === '') return;
    setUtilities([...utilities, { name: tempUtilityName.trim(), amount: Number(tempUtilityFee) }]);
    setTempUtilityName('');
    setTempUtilityFee('');
  };

  const handleRemoveUtility = (index: number) => {
    setUtilities(utilities.filter((_, i) => i !== index));
  };

  const handleAddEditUtility = () => {
    if (!editTempName.trim() || editTempFee === '') return;
    setEditUtilities([...editUtilities, { name: editTempName.trim(), amount: Number(editTempFee) }]);
    setEditTempName('');
    setEditTempFee('');
  };

  const handleRemoveEditUtility = (index: number) => {
    setEditUtilities(editUtilities.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const vatTreatment = useType === 'residential' ? 'A_EXEMPT' : 'B_STANDARD_16';
    const vatRate = useType === 'residential' ? 0 : 0.16;

    try {
      const payload = {
        propertyName: propertyName.trim(),
        location: location.trim(),
        unitNumber: unitNumber.trim(),
        rentAmount: Number(rentAmount) || 0,
        depositFee: depositFee !== '' ? Number(depositFee) : null,
        useType,
        vatTreatment,
        vatRate,
        waterFee: isWaterNA ? null : Number(waterFee) || 0,
        utilities,
      };

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/marketer/api/properties-overview', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save property record.');
      }

      setFormSuccess(`Successfully saved ${payload.propertyName} - Unit ${payload.unitNumber}`);
      setUnitNumber('');
      setRentAmount('');
      setDepositFee('');
      setUseType('residential');
      setWaterFee(0);
      setIsWaterNA(false);
      setUtilities([]);

      fetchProperties();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save record.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setEditUnitNumber(unit.unit_number);
    setEditRentAmount(unit.rent_amount ?? '');
    setEditDepositFee(unit.deposit_fee ?? '');
    setEditUseType(unit.use_type);

    setIsEditWaterNA(unit.water_fee === null);
    setEditWaterFee(unit.water_fee === null ? '' : unit.water_fee);
    setEditUtilities(unit.utilities || []);

    setEditError(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    setEditSubmitting(true);
    setEditError(null);

    const vatTreatment = editUseType === 'residential' ? 'A_EXEMPT' : 'B_STANDARD_16';
    const vatRate = editUseType === 'residential' ? 0 : 0.16;

    try {
      const payload = {
        unitId: editingUnit.id,
        unitNumber: editUnitNumber.trim(),
        rentAmount: Number(editRentAmount) || 0,
        depositFee: editDepositFee !== '' ? Number(editDepositFee) : null,
        useType: editUseType,
        vatTreatment,
        vatRate,
        waterFee: isEditWaterNA ? null : Number(editWaterFee) || 0,
        utilities: editUtilities,
      };

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/marketer/api/properties-overview', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update unit record.');
      }

      setEditingUnit(null);
      fetchProperties();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save unit updates.';
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-blue-100 text-xs px-3 py-1 rounded-full font-medium mb-3 border border-white/10">
            <Sparkles size={14} className="text-amber-300" /> Property Management Setup
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Add New Property & Units
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Configure property names, locations, unit numbers, water meters, and dynamic utility fees for onboarding clients.
          </p>
        </div>
      </div>

      {/* FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {formError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle size={18} className="text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {formSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* SECTION 1: PROPERTY INFORMATION */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Building size={18} className="text-blue-600" />
            1. Property Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Property Name *
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="e.g. Sunrise Heights"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="e.g. Kilimani, Nairobi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: UNIT DETAILS & FEES */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            2. Unit Details & Fees
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Unit Name / Number *
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="e.g. A-101"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Rent Per Unit (KES) *
              </label>
              <input
                type="number"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value ? Number(e.target.value) : '')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Security Deposit (KES) *
              </label>
              <input
                type="number"
                min="0"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={depositFee}
                onChange={(e) => setDepositFee(e.target.value ? Number(e.target.value) : '')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Unit Use *
              </label>
              <select
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition"
                value={useType}
                onChange={(e) => setUseType(e.target.value as 'residential' | 'commercial')}
              >
                <option value="residential">Residential (VAT-Exempt)</option>
                <option value="commercial">Commercial (eTIMS Standard VAT)</option>
              </select>
            </div>

            {/* Water Fee / Meter */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Water Fee / Meter
                </label>
                <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={isWaterNA}
                    onChange={(e) => {
                      setIsWaterNA(e.target.checked);
                      if (e.target.checked) setWaterFee('');
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  N/A
                </label>
              </div>
              <input
                type="number"
                disabled={isWaterNA}
                placeholder={isWaterNA ? 'N/A' : '0'}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
                value={isWaterNA ? '' : waterFee}
                onChange={(e) => setWaterFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
          </div>

          {/* Dynamic Utilities Section */}
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Additional Utilities (Garbage, Security, Internet, etc.)
            </label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Utility Name (e.g. Garbage Fee)"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={tempUtilityName}
                  onChange={(e) => setTempUtilityName(e.target.value)}
                />
              </div>
              <div className="w-36">
                <input
                  type="number"
                  placeholder="Fee (KES)"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={tempUtilityFee}
                  onChange={(e) => setTempUtilityFee(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <button
                type="button"
                onClick={handleAddUtility}
                className="bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-900 transition"
              >
                Add Utility
              </button>
            </div>

            {utilities.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {utilities.map((u, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium text-gray-800">
                    {u.name}: KES {u.amount.toLocaleString()}
                    <button
                      type="button"
                      onClick={() => handleRemoveUtility(idx)}
                      className="text-red-500 hover:text-red-700 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          {submitting ? 'Saving...' : 'Save Property'}
        </button>
      </form>

      {/* REGISTERED PROPERTIES OVERVIEW TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Registered Properties & Units</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete inventory of registered properties and managed units.
            </p>
          </div>
          <button
            onClick={fetchProperties}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition"
          >
            <RefreshCw size={14} className={listLoading ? 'animate-spin' : ''} />
            Refresh List
          </button>
        </div>

        {listLoading ? (
          <p className="text-gray-500 text-sm py-4">Loading property records...</p>
        ) : listError ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
            {listError}
          </div>
        ) : properties.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">
            No properties found. Add one using the form above.
          </p>
        ) : (
          <div className="space-y-6">
            {properties.map((prop) => {
              const totalUnits = prop.units?.length || 0;
              const occupiedCount = prop.units?.filter((u) => u.is_occupied).length || 0;
              const vacantCount = totalUnits - occupiedCount;

              return (
                <div key={prop.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{prop.name}</h3>
                      <p className="text-xs text-gray-500">{prop.location || 'No location set'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                        Total Units: {totalUnits}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-semibold border border-green-100">
                        Occupied: {occupiedCount}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-100">
                        Vacant: {vacantCount}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <th className="p-3.5">Unit Number</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Rent (KES)</th>
                          <th className="p-3.5">Deposit</th>
                          <th className="p-3.5">Use</th>
                          <th className="p-3.5">Water Fee / Meter</th>
                          <th className="p-3.5">Other Utilities</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-xs">
                        {prop.units?.map((unit) => (
                          <tr key={unit.id} className="hover:bg-gray-50/50 transition">
                            <td className="p-3.5 font-bold text-gray-900">{unit.unit_number}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full font-semibold capitalize ${
                                  unit.is_occupied
                                    ? 'bg-red-50 text-red-700 border border-red-100'
                                    : 'bg-green-50 text-green-700 border border-green-100'
                                }`}
                              >
                                {unit.is_occupied ? 'Occupied' : 'Vacant'}
                              </span>
                            </td>
                            <td className="p-3.5 font-medium text-gray-900">
                              KES {unit.rent_amount?.toLocaleString()}
                            </td>
                            <td className="p-3.5 text-gray-600">
                              KES {unit.deposit_fee?.toLocaleString() || '0'}
                            </td>
                            <td className="p-3.5 capitalize text-gray-600">{unit.use_type}</td>
                            <td className="p-3.5 text-gray-600">
                              {unit.water_fee === null ? 'N/A' : `KES ${unit.water_fee?.toLocaleString()}`}
                            </td>
                            <td className="p-3.5 text-gray-600">
                              {unit.utilities && unit.utilities.length > 0 ? (
                                <div className="text-xs space-y-0.5">
                                  {unit.utilities.map((u, i) => (
                                    <div key={i}>{u.name}: KES {u.amount.toLocaleString()}</div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">None</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => handleOpenEditModal(unit)}
                                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 transition"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT UNIT MODAL */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Edit Unit {editingUnit.unit_number}
              </h3>
              <button
                onClick={() => setEditingUnit(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Unit Name / Number *
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={editUnitNumber}
                  onChange={(e) => setEditUnitNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Rent Per Unit (KES) *
                </label>
                <input
                  type="number"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={editRentAmount}
                  onChange={(e) => setEditRentAmount(e.target.value ? Number(e.target.value) : '')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Security Deposit (KES) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={editDepositFee}
                  onChange={(e) => setEditDepositFee(e.target.value ? Number(e.target.value) : '')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Unit Use *
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition"
                  value={editUseType}
                  onChange={(e) => setEditUseType(e.target.value as 'residential' | 'commercial')}
                >
                  <option value="residential">Residential (VAT-Exempt)</option>
                  <option value="commercial">Commercial (eTIMS Standard VAT)</option>
                </select>
              </div>

              {/* Water Fee Edit */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Water Fee / Meter
                  </label>
                  <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditWaterNA}
                      onChange={(e) => {
                        setIsEditWaterNA(e.target.checked);
                        if (e.target.checked) setEditWaterFee('');
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    N/A
                  </label>
                </div>
                <input
                  type="number"
                  disabled={isEditWaterNA}
                  placeholder={isEditWaterNA ? 'N/A' : '0'}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
                  value={isEditWaterNA ? '' : editWaterFee}
                  onChange={(e) => setEditWaterFee(e.target.value ? Number(e.target.value) : 0)}
                />
              </div>

              {/* Edit Utilities Section */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Additional Utilities
                </label>
                <div className="flex gap-2 items-end">
                  <input
                    type="text"
                    placeholder="Utility Name"
                    className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none"
                    value={editTempName}
                    onChange={(e) => setEditTempName(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Fee (KES)"
                    className="w-28 border border-gray-300 rounded-lg p-2.5 text-sm outline-none"
                    value={editTempFee}
                    onChange={(e) => setEditTempFee(e.target.value ? Number(e.target.value) : '')}
                  />
                  <button
                    type="button"
                    onClick={handleAddEditUtility}
                    className="bg-gray-800 text-white px-3.5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-900 transition"
                  >
                    Add
                  </button>
                </div>

                {editUtilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {editUtilities.map((u, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-xs font-medium">
                        {u.name}: KES {u.amount.toLocaleString()}
                        <button
                          type="button"
                          onClick={() => handleRemoveEditUtility(idx)}
                          className="text-red-500 font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};