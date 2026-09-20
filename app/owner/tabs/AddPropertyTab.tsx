"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabaseClient";

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  rent_amount: number;
  deposit_fee: number | null;
  use_type: 'residential' | 'commercial' | 'mixed' | 'other';
  vat_treatment: 'A_EXEMPT' | 'B_STANDARD_16' | 'C_ZERO_RATED' | 'E_NON_VAT';
  vat_rate: number;
  garbage_fee: number | null;
  parking_fee: number | null;
  water_fee: number | null;
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
}

export default function AddPropertyTab({ currentUserId }: AddPropertyTabProps) {
  // Form state
  const [propertyName, setPropertyName] = useState("");
  const [location, setLocation] = useState("");

  const [unitNumber, setUnitNumber] = useState("");
  const [rentAmount, setRentAmount] = useState<number | "">("");
  const [depositFee, setDepositFee] = useState<number | "">("");
  const [useType, setUseType] = useState<Unit['use_type']>('residential');
  const [vatTreatment, setVatTreatment] = useState<Unit['vat_treatment']>('A_EXEMPT');
  const [vatRate, setVatRate] = useState<number | "">(0);

  // Fees state
  const [garbageFee, setGarbageFee] = useState<number | "">(0);
  const [isGarbageNA, setIsGarbageNA] = useState(false);

  const [parkingFee, setParkingFee] = useState<number | "">(0);
  const [isParkingNA, setIsParkingNA] = useState(false);

  const [waterFee, setWaterFee] = useState<number | "">(0);
  const [isWaterNA, setIsWaterNA] = useState(false);
  const [utilityName, setUtilityName] = useState('');
  const [utilityFee, setUtilityFee] = useState<number | "">('');

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Edit Modal State
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editUnitNumber, setEditUnitNumber] = useState("");
  const [editRentAmount, setEditRentAmount] = useState<number | "">("");
  const [editDepositFee, setEditDepositFee] = useState<number | "">("");
  const [editUseType, setEditUseType] = useState<Unit['use_type']>('residential');
  const [editVatTreatment, setEditVatTreatment] = useState<Unit['vat_treatment']>('A_EXEMPT');
  const [editVatRate, setEditVatRate] = useState<number | "">(0);

  const [editGarbageFee, setEditGarbageFee] = useState<number | "">(0);
  const [isEditGarbageNA, setIsEditGarbageNA] = useState(false);

  const [editParkingFee, setEditParkingFee] = useState<number | "">(0);
  const [isEditParkingNA, setIsEditParkingNA] = useState(false);

  const [editWaterFee, setEditWaterFee] = useState<number | "">(0);
  const [isEditWaterNA, setIsEditWaterNA] = useState(false);

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
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/owner/api/properties-overview", {
        cache: "no-store",
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch (Status ${res.status})`);
      }

      const data = await res.json();
      setProperties(data.properties || []);
    } catch (err: any) {
      console.error("Error fetching properties:", err);
      setListError(err.message || "Failed to load properties.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [currentUserId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload = {
        propertyName: propertyName.trim(),
        location: location.trim(),
        unitNumber: unitNumber.trim(),
        rentAmount: Number(rentAmount) || 0,
        depositFee: Number(depositFee) || 0,
        useType,
        vatTreatment,
        vatRate: Number(vatRate) || 0,
        garbageFee: isGarbageNA ? null : Number(garbageFee) || 0,
        parkingFee: isParkingNA ? null : Number(parkingFee) || 0,
        waterFee: isWaterNA ? null : Number(waterFee) || 0,
        utilityName: utilityName.trim(),
        utilityFee: Number(utilityFee) || 0,
      };

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/owner/api/properties-overview", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save property record.");
      }

      setFormSuccess(`Successfully saved ${payload.propertyName} - Unit ${payload.unitNumber}`);
      setUnitNumber("");
      setRentAmount("");
      setDepositFee("");
      setUseType('residential');
      setVatTreatment('A_EXEMPT');
      setVatRate(0);

      // Reset fees
      setGarbageFee(0);
      setIsGarbageNA(false);
      setParkingFee(0);
      setIsParkingNA(false);
      setWaterFee(0);
      setIsWaterNA(false);
      setUtilityName('');
      setUtilityFee('');

      fetchProperties();
    } catch (err: any) {
      setFormError(err.message || "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setEditUnitNumber(unit.unit_number);
    setEditRentAmount(unit.rent_amount ?? "");
    setEditDepositFee(unit.deposit_fee ?? "");
    setEditUseType(unit.use_type);
    setEditVatTreatment(unit.vat_treatment);
    setEditVatRate(unit.vat_rate ?? 0);

    setIsEditGarbageNA(unit.garbage_fee === null);
    setEditGarbageFee(unit.garbage_fee === null ? "" : unit.garbage_fee);

    setIsEditParkingNA(unit.parking_fee === null);
    setEditParkingFee(unit.parking_fee === null ? "" : unit.parking_fee);

    setIsEditWaterNA(unit.water_fee === null);
    setEditWaterFee(unit.water_fee === null ? "" : unit.water_fee);

    setEditError(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      const payload = {
        unitId: editingUnit.id,
        unitNumber: editUnitNumber.trim(),
        rentAmount: Number(editRentAmount) || 0,
        depositFee: Number(editDepositFee) || 0,
        useType: editUseType,
        vatTreatment: editVatTreatment,
        vatRate: Number(editVatRate) || 0,
        garbageFee: isEditGarbageNA ? null : Number(editGarbageFee) || 0,
        parkingFee: isEditParkingNA ? null : Number(editParkingFee) || 0,
        waterFee: isEditWaterNA ? null : Number(editWaterFee) || 0,
      };

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/owner/api/properties-overview", {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update unit record.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('property_change_audit_logs').insert({
          unit_id: editingUnit.id,
          property_id: editingUnit.property_id,
          actor_profile_id: user.id,
          actor_name_snapshot: user.user_metadata?.full_name || user.email || user.id,
          action: 'updated',
          changed_fields: payload,
        });
      }

      setEditingUnit(null);
      fetchProperties();
    } catch (err: any) {
      setEditError(err.message || "Failed to save unit updates.");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Property & Units</h1>
        <p className="text-gray-600">
          Configure property names, locations, unit numbers, and fee structures.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="border p-6 rounded-lg bg-white shadow-sm space-y-6">
        {formError && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{formError}</div>}
        {formSuccess && <div className="p-3 bg-green-100 text-green-700 rounded text-sm">{formSuccess}</div>}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">1. Property Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Property Name *</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. Sunrise Heights"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. Kilimani, Nairobi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">2. Unit Details & Fees</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Name / Number *</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. A-101"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rent Per Unit (KES) *</label>
              <input
                type="number"
                required
                className="w-full border rounded p-2 mt-1"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value ? Number(e.target.value) : "")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Security Deposit (KES) *</label>
              <input
                type="number"
                min="0"
                required
                className="w-full border rounded p-2 mt-1"
                value={depositFee}
                onChange={(e) => setDepositFee(e.target.value ? Number(e.target.value) : "")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Use *</label>
              <select
                required
                className="w-full border rounded p-2 mt-1 bg-white"
                value={useType}
                onChange={(e) => setUseType(e.target.value as Unit['use_type'])}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed">Mixed</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">VAT Treatment *</label>
              <select
                required
                className="w-full border rounded p-2 mt-1 bg-white"
                value={vatTreatment}
                onChange={(e) => setVatTreatment(e.target.value as Unit['vat_treatment'])}
              >
                <option value="A_EXEMPT">Exempt</option>
                <option value="B_STANDARD_16">Standard 16%</option>
                <option value="C_ZERO_RATED">Zero-rated</option>
                <option value="E_NON_VAT">Non-VAT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">VAT Rate (decimal)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                className="w-full border rounded p-2 mt-1"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>

            {/* Garbage Fee */}
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Garbage Fee</label>
                <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGarbageNA}
                    onChange={(e) => {
                      setIsGarbageNA(e.target.checked);
                      if (e.target.checked) setGarbageFee("");
                    }}
                  />
                  N/A
                </label>
              </div>
              <input
                type="number"
                disabled={isGarbageNA}
                placeholder={isGarbageNA ? "N/A" : "0"}
                className="w-full border rounded p-2 mt-1 disabled:bg-gray-100 disabled:text-gray-400"
                value={isGarbageNA ? "" : garbageFee}
                onChange={(e) => setGarbageFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Custom Utility Name</label>
              <input type="text" className="w-full border rounded p-2 mt-1" placeholder="e.g. Security" value={utilityName} onChange={(e) => setUtilityName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Custom Utility Fee (KES)</label>
              <input type="number" min="0" className="w-full border rounded p-2 mt-1" placeholder="0" value={utilityFee} onChange={(e) => setUtilityFee(e.target.value ? Number(e.target.value) : '')} />
            </div>

            {/* Parking Fee */}
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Parking Fee</label>
                <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isParkingNA}
                    onChange={(e) => {
                      setIsParkingNA(e.target.checked);
                      if (e.target.checked) setParkingFee("");
                    }}
                  />
                  N/A
                </label>
              </div>
              <input
                type="number"
                disabled={isParkingNA}
                placeholder={isParkingNA ? "N/A" : "0"}
                className="w-full border rounded p-2 mt-1 disabled:bg-gray-100 disabled:text-gray-400"
                value={isParkingNA ? "" : parkingFee}
                onChange={(e) => setParkingFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>

            {/* Water Fee / Meter */}
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Water Fee / Meter</label>
                <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWaterNA}
                    onChange={(e) => {
                      setIsWaterNA(e.target.checked);
                      if (e.target.checked) setWaterFee("");
                    }}
                  />
                  N/A
                </label>
              </div>
              <input
                type="number"
                disabled={isWaterNA}
                placeholder={isWaterNA ? "N/A" : "0"}
                className="w-full border rounded p-2 mt-1 disabled:bg-gray-100 disabled:text-gray-400"
                value={isWaterNA ? "" : waterFee}
                onChange={(e) => setWaterFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {submitting ? "Saving..." : "Save Property"}
        </button>
      </form>

      <div className="border rounded-lg bg-white shadow-sm space-y-4 p-6">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registered Properties & Units</h2>
            <p className="text-sm text-gray-500">
              Complete inventory of your registered properties and units.
            </p>
          </div>
          <button
            onClick={fetchProperties}
            className="border px-4 py-2 rounded text-sm hover:bg-gray-50"
          >
            Refresh List
          </button>
        </div>

        {listLoading ? (
          <p className="text-gray-500">Loading records...</p>
        ) : listError ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
            {listError}
          </div>
        ) : properties.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No properties found. Add one using the form above.</p>
        ) : (
          <div className="space-y-6">
            {properties.map((prop) => {
              const totalUnits = prop.units?.length || 0;
              const occupiedCount = prop.units?.filter((u) => u.is_occupied).length || 0;
              const vacantCount = totalUnits - occupiedCount;

              return (
                <div key={prop.id} className="border rounded-lg overflow-hidden bg-white">
                  <div className="bg-gray-50 px-4 py-3 border-b flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{prop.name}</h3>
                      <p className="text-xs text-gray-500">{prop.location || "No location set"}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                        Total Units: {totalUnits}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                        Occupied: {occupiedCount}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                        Vacant: {vacantCount}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b text-gray-700">
                          <th className="p-3">Unit Number</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Rent (KES)</th>
                          <th className="p-3">Deposit</th>
                          <th className="p-3">Use</th>
                          <th className="p-3">Garbage</th>
                          <th className="p-3">Parking</th>
                          <th className="p-3">Water Fee / Meter</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prop.units?.map((unit) => (
                          <tr key={unit.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{unit.unit_number}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  unit.is_occupied
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {unit.is_occupied ? "Occupied" : "Vacant"}
                              </span>
                            </td>
                            <td className="p-3">KES {unit.rent_amount?.toLocaleString()}</td>
                            <td className="p-3">KES {unit.deposit_fee?.toLocaleString() || "0"}</td>
                            <td className="p-3 capitalize">{unit.use_type}</td>
                            <td className="p-3">
                              {unit.garbage_fee === null ? "N/A" : `KES ${unit.garbage_fee?.toLocaleString()}`}
                            </td>
                            <td className="p-3">
                              {unit.parking_fee === null ? "N/A" : `KES ${unit.parking_fee?.toLocaleString()}`}
                            </td>
                            <td className="p-3">
                              {unit.water_fee === null ? "N/A" : `KES ${unit.water_fee?.toLocaleString()}`}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleOpenEditModal(unit)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-3 py-1.5 rounded border transition"
                              >
                                Edit
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Edit Unit {editingUnit.unit_number}
              </h3>
              <button
                onClick={() => setEditingUnit(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Name / Number *</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2 mt-1"
                  value={editUnitNumber}
                  onChange={(e) => setEditUnitNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rent Per Unit (KES) *</label>
                <input
                  type="number"
                  required
                  className="w-full border rounded p-2 mt-1"
                  value={editRentAmount}
                  onChange={(e) => setEditRentAmount(e.target.value ? Number(e.target.value) : "")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Security Deposit (KES) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full border rounded p-2 mt-1"
                  value={editDepositFee}
                  onChange={(e) => setEditDepositFee(e.target.value ? Number(e.target.value) : "")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Use *</label>
                <select
                  required
                  className="w-full border rounded p-2 mt-1 bg-white"
                  value={editUseType}
                  onChange={(e) => setEditUseType(e.target.value as Unit['use_type'])}
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="mixed">Mixed</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">VAT Treatment *</label>
                <select
                  required
                  className="w-full border rounded p-2 mt-1 bg-white"
                  value={editVatTreatment}
                  onChange={(e) => setEditVatTreatment(e.target.value as Unit['vat_treatment'])}
                >
                  <option value="A_EXEMPT">Exempt</option>
                  <option value="B_STANDARD_16">Standard 16%</option>
                  <option value="C_ZERO_RATED">Zero-rated</option>
                  <option value="E_NON_VAT">Non-VAT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">VAT Rate (decimal)</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full border rounded p-2 mt-1"
                  value={editVatRate}
                  onChange={(e) => setEditVatRate(e.target.value ? Number(e.target.value) : 0)}
                />
              </div>

              {/* Garbage Fee Edit */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Garbage Fee</label>
                  <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditGarbageNA}
                      onChange={(e) => {
                        setIsEditGarbageNA(e.target.checked);
                        if (e.target.checked) setEditGarbageFee("");
                      }}
                    />
                    N/A
                  </label>
                </div>
                <input
                  type="number"
                  disabled={isEditGarbageNA}
                  placeholder={isEditGarbageNA ? "N/A" : "0"}
                  className="w-full border rounded p-2 mt-1 disabled:bg-gray-100 disabled:text-gray-400"
                  value={isEditGarbageNA ? "" : editGarbageFee}
                  onChange={(e) => setEditGarbageFee(e.target.value ? Number(e.target.value) : 0)}
                />
              </div>

              {/* Parking Fee Edit */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Parking Fee</label>
                  <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditParkingNA}
                      onChange={(e) => {
                        setIsEditParkingNA(e.target.checked);
                        if (e.target.checked) setEditParkingFee("");
                      }}
                    />
                    N/A
                  </label>
                </div>
                <input
                  type="number"
                  disabled={isEditParkingNA}
                  placeholder={isEditParkingNA ? "N/A" : "0"}
                  className="w-full border rounded p-2 mt-1 disabled:bg-gray-100 disabled:text-gray-400"
                  value={isEditParkingNA ? "" : editParkingFee}
                  onChange={(e) => setEditParkingFee(e.target.value ? Number(e.target.value) : 0)}
                />
              </div>

              {/* Water Fee Edit */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Water Fee / Meter</label>
                  <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditWaterNA}
                      onChange={(e) => {
                        setIsEditWaterNA(e.target.checked);
                        if (e.target.checked) setEditWaterFee("");
                      }}
                    />
                    N/A
                  </label>
                </div>
                <input
                  type="number"
                  disabled={isEditWaterNA}
                  placeholder={isEditWaterNA ? "N/A" : "0"}
                  className="w-full border rounded p-2 mt-1 disabled:bg-gray-100 disabled:text-gray-400"
                  value={isEditWaterNA ? "" : editWaterFee}
                  onChange={(e) => setEditWaterFee(e.target.value ? Number(e.target.value) : 0)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}