// app/property-manager/tabs/AddPropertyTab.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabaseClient";
import { UserPlus } from "lucide-react";
import SendInviteModal from "../components/SendInviteModal";

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
}

export default function AddPropertyTab({ currentUserId }: AddPropertyTabProps) {
  const [propertyName, setPropertyName] = useState("");
  const [location, setLocation] = useState("");

  const [unitNumber, setUnitNumber] = useState("");
  const [rentAmount, setRentAmount] = useState<number | "">("");
  const [depositFee, setDepositFee] = useState<number | "">("");
  const [useType, setUseType] = useState<'residential' | 'commercial'>('residential');

  const [waterFee, setWaterFee] = useState<number | "">(0);
  const [isWaterNA, setIsWaterNA] = useState(false);

  const [utilities, setUtilities] = useState<UtilityItem[]>([]);
  const [tempUtilityName, setTempUtilityName] = useState("");
  const [tempUtilityFee, setTempUtilityFee] = useState<number | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editUnitNumber, setEditUnitNumber] = useState("");
  const [editRentAmount, setEditRentAmount] = useState<number | "">("");
  const [editDepositFee, setEditDepositFee] = useState<number | "">("");
  const [editUseType, setEditUseType] = useState<'residential' | 'commercial'>('residential');
  const [editWaterFee, setEditWaterFee] = useState<number | "">(0);
  const [isEditWaterNA, setIsEditWaterNA] = useState(false);
  const [editUtilities, setEditUtilities] = useState<UtilityItem[]>([]);
  const [editTempName, setEditTempName] = useState("");
  const [editTempFee, setEditTempFee] = useState<number | "">("");

  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

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

      const res = await fetch("/property-manager/api/properties-overview", {
        cache: "no-store",
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch (Status ${res.status})`);
      }

      const data = await res.json();
      
      // Map API response keys (propertyId, propertyName) to component keys (id, name)
      const mappedProperties: Property[] = (data.properties || []).map((p: any) => ({
        id: p.propertyId || p.id,
        name: p.propertyName || p.name || 'Unnamed Property',
        location: p.location || '',
        units: p.units || [],
      }));

      setProperties(mappedProperties);
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

  const handleAddUtility = () => {
    if (!tempUtilityName.trim() || tempUtilityFee === "") return;
    setUtilities([...utilities, { name: tempUtilityName.trim(), amount: Number(tempUtilityFee) }]);
    setTempUtilityName("");
    setTempUtilityFee("");
  };

  const handleRemoveUtility = (index: number) => {
    setUtilities(utilities.filter((_, i) => i !== index));
  };

  const handleAddEditUtility = () => {
    if (!editTempName.trim() || editTempFee === "") return;
    setEditUtilities([...editUtilities, { name: editTempName.trim(), amount: Number(editTempFee) }]);
    setEditTempName("");
    setEditTempFee("");
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
        depositFee: Number(depositFee) || 0,
        useType,
        vatTreatment,
        vatRate,
        waterFee: isWaterNA ? null : Number(waterFee) || 0,
        utilities,
      };

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/property-manager/api/properties-overview", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save property record.");
      }

      setFormSuccess(`Successfully saved ${payload.propertyName} - Unit ${payload.unitNumber}`);
      setPropertyName("");
      setLocation("");
      setUnitNumber("");
      setRentAmount("");
      setDepositFee("");
      setUseType('residential');
      setWaterFee(0);
      setIsWaterNA(false);
      setUtilities([]);

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
    setIsEditWaterNA(unit.water_fee === null);
    setEditWaterFee(unit.water_fee === null ? "" : unit.water_fee);
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
        depositFee: Number(editDepositFee) || 0,
        useType: editUseType,
        vatTreatment,
        vatRate,
        waterFee: isEditWaterNA ? null : Number(editWaterFee) || 0,
        utilities: editUtilities,
      };

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/property-manager/api/properties-overview", {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update unit record.");
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
          Configure property names, locations, unit numbers, water meters, and dynamic utility fees.
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
                onChange={(e) => setUseType(e.target.value as 'residential' | 'commercial')}
              >
                <option value="residential">Residential (VAT-Exempt)</option>
                <option value="commercial">Commercial (eTIMS Standard VAT)</option>
              </select>
            </div>

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

          <div className="mt-4 border-t pt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">Additional Utilities</label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Utility Name (e.g. Garbage Fee)"
                  className="w-full border rounded p-2 text-sm"
                  value={tempUtilityName}
                  onChange={(e) => setTempUtilityName(e.target.value)}
                />
              </div>
              <div className="w-36">
                <input
                  type="number"
                  placeholder="Fee (KES)"
                  className="w-full border rounded p-2 text-sm"
                  value={tempUtilityFee}
                  onChange={(e) => setTempUtilityFee(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <button
                type="button"
                onClick={handleAddUtility}
                className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900 transition"
              >
                Add Utility
              </button>
            </div>

            {utilities.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {utilities.map((u, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 bg-gray-100 border px-3 py-1 rounded-full text-xs font-medium text-gray-800">
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
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {submitting ? "Saving..." : "Save Property"}
        </button>
      </form>

      <div className="border rounded-lg bg-white shadow-sm space-y-4 p-6">
        <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registered Managed Properties</h2>
            <p className="text-sm text-gray-500">
              Inventory of properties assigned to your manager account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition"
            >
              <UserPlus size={16} />
              Invite Owner / Manager
            </button>
            <button
              onClick={fetchProperties}
              className="border px-4 py-2 rounded text-sm hover:bg-gray-50 font-medium"
            >
              Refresh List
            </button>
          </div>
        </div>

        {listLoading ? (
          <p className="text-gray-500">Loading records...</p>
        ) : listError ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
            {listError}
          </div>
        ) : properties.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No properties assigned to your account yet.</p>
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
                          <th className="p-3">Water Fee</th>
                          <th className="p-3">Other Utilities</th>
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
                              {unit.water_fee === null ? "N/A" : `KES ${unit.water_fee?.toLocaleString()}`}
                            </td>
                            <td className="p-3">
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

      {editingUnit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setEditUseType(e.target.value as 'residential' | 'commercial')}
                >
                  <option value="residential">Residential (VAT-Exempt)</option>
                  <option value="commercial">Commercial (eTIMS Standard VAT)</option>
                </select>
              </div>

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
                  className="border px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="bg-blue-600 text-white px-5 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SendInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        properties={properties.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}