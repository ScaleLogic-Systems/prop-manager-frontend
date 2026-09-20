// app/super-admin/tabs/AddPropertyTab.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Sparkles,
  Building,
  RefreshCw,
  Plus,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';

interface Unit {
  id: string;
  unit_number: string;
  rent_amount: number | null;
  garbage_fee: number | null;
  parking_fee: number | null;
  water_fee: number | null;
  is_occupied: boolean;
}

interface Property {
  id: string;
  name: string;
  location: string | null;
  user_id: string;
  units?: Unit[];
}

interface ClientOption {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export const AddPropertyTab: React.FC = () => {
  // Client selector
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientsLoading, setClientsLoading] = useState(true);

  // Form state
  const [propertyName, setPropertyName] = useState('');
  const [location, setLocation] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [rentAmount, setRentAmount] = useState<number | ''>('');

  // Fees state
  const [garbageFee, setGarbageFee] = useState<number | ''>(0);
  const [isGarbageNA, setIsGarbageNA] = useState(false);
  const [parkingFee, setParkingFee] = useState<number | ''>(0);
  const [isParkingNA, setIsParkingNA] = useState(false);
  const [waterFee, setWaterFee] = useState<number | ''>(0);
  const [isWaterNA, setIsWaterNA] = useState(false);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Properties list
  const [properties, setProperties] = useState<Property[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Edit modal
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editUnitNumber, setEditUnitNumber] = useState('');
  const [editRentAmount, setEditRentAmount] = useState<number | ''>('');
  const [editGarbageFee, setEditGarbageFee] = useState<number | ''>(0);
  const [isEditGarbageNA, setIsEditGarbageNA] = useState(false);
  const [editParkingFee, setEditParkingFee] = useState<number | ''>(0);
  const [isEditParkingNA, setIsEditParkingNA] = useState(false);
  const [editWaterFee, setEditWaterFee] = useState<number | ''>(0);
  const [isEditWaterNA, setIsEditWaterNA] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Fetch clients (property managers & owners) ──────────────────────────────
  useEffect(() => {
    let ignore = false;
    async function fetchClients() {
      setClientsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('role', ['property_manager', 'property_owner', 'owner'])
          .order('full_name');
        if (error) throw error;
        if (!ignore) setClients((data as ClientOption[]) || []);
      } catch (err: unknown) {
        console.error('Error fetching clients:', err);
      } finally {
        if (!ignore) setClientsLoading(false);
      }
    }
    fetchClients();
    return () => { ignore = true; };
  }, []);

  // ── Fetch properties whenever selected client changes ───────────────────────
  const fetchProperties = async (clientId: string) => {
    if (!clientId) {
      setProperties([]);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const { data: props, error: propsError } = await supabase
        .from('properties')
        .select('id, name, location, user_id')
        .eq('user_id', clientId)
        .order('name');
      if (propsError) throw propsError;

      const propIds = (props || []).map((p) => p.id);
      let units: Unit[] = [];
      if (propIds.length > 0) {
        const { data: unitsData } = await supabase
          .from('units')
          .select('id, unit_number, rent_amount, garbage_fee, parking_fee, water_fee, status, property_id')
          .in('property_id', propIds);
        units = (unitsData || []).map((u) => ({
          id: u.id,
          unit_number: u.unit_number,
          rent_amount: u.rent_amount,
          garbage_fee: u.garbage_fee,
          parking_fee: u.parking_fee,
          water_fee: u.water_fee,
          is_occupied: u.status === 'OCCUPIED',
        }));
      }

      const enriched: Property[] = (props || []).map((p) => ({
        ...p,
        units: units.filter((u) => (u as unknown as { property_id: string }).property_id === p.id),
      }));
      setProperties(enriched);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load properties.';
      setListError(msg);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(selectedClientId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  // ── Add property form ───────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setFormError('Please select a client first.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      // 1. Upsert property
      const { data: prop, error: propError } = await supabase
        .from('properties')
        .upsert({ name: propertyName.trim(), location: location.trim() || null, user_id: selectedClientId }, { onConflict: 'name,user_id' })
        .select('id')
        .single();
      if (propError) throw propError;

      // 2. Insert unit
      const { error: unitError } = await supabase.from('units').insert({
        property_id: prop.id,
        unit_number: unitNumber.trim(),
        rent_amount: Number(rentAmount) || 0,
        garbage_fee: isGarbageNA ? null : Number(garbageFee) || 0,
        parking_fee: isParkingNA ? null : Number(parkingFee) || 0,
        water_fee: isWaterNA ? null : Number(waterFee) || 0,
        status: 'VACANT',
      });
      if (unitError) throw unitError;

      setFormSuccess(`Saved ${propertyName.trim()} – Unit ${unitNumber.trim()} for selected client.`);
      setUnitNumber('');
      setRentAmount('');
      setGarbageFee(0);
      setIsGarbageNA(false);
      setParkingFee(0);
      setIsParkingNA(false);
      setWaterFee(0);
      setIsWaterNA(false);
      fetchProperties(selectedClientId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save record.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit unit modal ─────────────────────────────────────────────────────────
  const handleOpenEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setEditUnitNumber(unit.unit_number);
    setEditRentAmount(unit.rent_amount ?? '');
    setIsEditGarbageNA(unit.garbage_fee === null);
    setEditGarbageFee(unit.garbage_fee === null ? '' : unit.garbage_fee);
    setIsEditParkingNA(unit.parking_fee === null);
    setEditParkingFee(unit.parking_fee === null ? '' : unit.parking_fee);
    setIsEditWaterNA(unit.water_fee === null);
    setEditWaterFee(unit.water_fee === null ? '' : unit.water_fee);
    setEditError(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const { error } = await supabase
        .from('units')
        .update({
          unit_number: editUnitNumber.trim(),
          rent_amount: Number(editRentAmount) || 0,
          garbage_fee: isEditGarbageNA ? null : Number(editGarbageFee) || 0,
          parking_fee: isEditParkingNA ? null : Number(editParkingFee) || 0,
          water_fee: isEditWaterNA ? null : Number(editWaterFee) || 0,
        })
        .eq('id', editingUnit.id);
      if (error) throw error;
      setEditingUnit(null);
      fetchProperties(selectedClientId);
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
            <Sparkles size={14} className="text-amber-300" /> Platform Property Setup
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Add Property &amp; Units
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Create properties and units on behalf of any client. Select a subscriber below to attach the property to their account.
          </p>
        </div>
      </div>

      {/* CLIENT SELECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <User size={14} /> Select Client (Subscriber)
        </label>
        {clientsLoading ? (
          <p className="text-slate-400 text-xs">Loading clients…</p>
        ) : (
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition appearance-none cursor-pointer"
          >
            <option value="">— Choose a client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900">
                {c.full_name || c.email} ({c.role})
              </option>
            ))}
          </select>
        )}
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
            2. Unit Details &amp; Fees
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

            {/* Garbage Fee */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Garbage Fee
                </label>
                <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={isGarbageNA}
                    onChange={(e) => {
                      setIsGarbageNA(e.target.checked);
                      if (e.target.checked) setGarbageFee('');
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  N/A
                </label>
              </div>
              <input
                type="number"
                disabled={isGarbageNA}
                placeholder={isGarbageNA ? 'N/A' : '0'}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
                value={isGarbageNA ? '' : garbageFee}
                onChange={(e) => setGarbageFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>

            {/* Parking Fee */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Parking Fee
                </label>
                <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={isParkingNA}
                    onChange={(e) => {
                      setIsParkingNA(e.target.checked);
                      if (e.target.checked) setParkingFee('');
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  N/A
                </label>
              </div>
              <input
                type="number"
                disabled={isParkingNA}
                placeholder={isParkingNA ? 'N/A' : '0'}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
                value={isParkingNA ? '' : parkingFee}
                onChange={(e) => setParkingFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>

            {/* Water Fee */}
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
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedClientId}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          {submitting ? 'Saving…' : 'Save Property & Unit'}
        </button>
      </form>

      {/* REGISTERED PROPERTIES TABLE */}
      {selectedClientId && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Client&apos;s Properties &amp; Units</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Properties attached to the selected subscriber account.
              </p>
            </div>
            <button
              onClick={() => fetchProperties(selectedClientId)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition"
            >
              <RefreshCw size={14} className={listLoading ? 'animate-spin' : ''} />
              Refresh List
            </button>
          </div>

          {listLoading ? (
            <p className="text-gray-500 text-sm py-4">Loading property records…</p>
          ) : listError ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
              {listError}
            </div>
          ) : properties.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">
              No properties found for this client. Add one using the form above.
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
                          Total: {totalUnits}
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
                            <th className="p-3.5">Garbage</th>
                            <th className="p-3.5">Parking</th>
                            <th className="p-3.5">Water Fee / Meter</th>
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
                                {unit.garbage_fee === null ? 'N/A' : `KES ${unit.garbage_fee?.toLocaleString()}`}
                              </td>
                              <td className="p-3.5 text-gray-600">
                                {unit.parking_fee === null ? 'N/A' : `KES ${unit.parking_fee?.toLocaleString()}`}
                              </td>
                              <td className="p-3.5 text-gray-600">
                                {unit.water_fee === null ? 'N/A' : `KES ${unit.water_fee?.toLocaleString()}`}
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
      )}

      {/* EDIT UNIT MODAL */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
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

              {/* Garbage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Garbage Fee</label>
                  <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditGarbageNA}
                      onChange={(e) => { setIsEditGarbageNA(e.target.checked); if (e.target.checked) setEditGarbageFee(''); }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    N/A
                  </label>
                </div>
                <input
                  type="number"
                  disabled={isEditGarbageNA}
                  placeholder={isEditGarbageNA ? 'N/A' : '0'}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
                  value={isEditGarbageNA ? '' : editGarbageFee}
                  onChange={(e) => setEditGarbageFee(e.target.value ? Number(e.target.value) : 0)}
                />
              </div>

              {/* Parking */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Parking Fee</label>
                  <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditParkingNA}
                      onChange={(e) => { setIsEditParkingNA(e.target.checked); if (e.target.checked) setEditParkingFee(''); }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    N/A
                  </label>
                </div>
                <input
                  type="number"
                  disabled={isEditParkingNA}
                  placeholder={isEditParkingNA ? 'N/A' : '0'}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
                  value={isEditParkingNA ? '' : editParkingFee}
                  onChange={(e) => setEditParkingFee(e.target.value ? Number(e.target.value) : 0)}
                />
              </div>

              {/* Water */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Water Fee / Meter</label>
                  <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditWaterNA}
                      onChange={(e) => { setIsEditWaterNA(e.target.checked); if (e.target.checked) setEditWaterFee(''); }}
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
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

