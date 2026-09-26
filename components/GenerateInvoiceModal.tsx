// components/GenerateInvoiceModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Loader2, Receipt, Calculator } from 'lucide-react';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorRole: 'owner' | 'property_manager' | 'caretaker' | 'agent';
  profileId: string;
  propertyId?: string;
}

export function GenerateInvoiceModal({
  isOpen,
  onClose,
  creatorRole,
  profileId,
  propertyId,
}: GenerateInvoiceModalProps) {
  const [invoiceType, setInvoiceType] = useState<'water' | 'rent' | 'utility'>('water');
  const [unitId, setUnitId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantKraPin, setTenantKraPin] = useState('');
  const [taxType, setTaxType] = useState('EXEMPT');

  // Water reading states
  const [previousReading, setPreviousReading] = useState<number>(0);
  const [currentReading, setCurrentReading] = useState<number>(0);
  const [ratePerUnit, setRatePerUnit] = useState<number>(150);

  // General invoice states
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-calculated water consumption & total
  const unitsConsumed = Math.max(0, currentReading - previousReading);
  const calculatedWaterTotal = unitsConsumed * ratePerUnit;

  // Dynamic theme mapping based on portal role
  const getTheme = () => {
    switch (creatorRole) {
      case 'agent':
        return {
          primaryBg: 'bg-indigo-600 hover:bg-indigo-700',
          focusRing: 'focus:ring-indigo-500',
          accentText: 'text-indigo-600',
          headerIcon: 'text-indigo-400',
          activeTab: 'bg-indigo-600 text-white border-indigo-600',
          shadow: 'shadow-indigo-600/20',
          alertBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        };
      case 'property_manager':
        return {
          primaryBg: 'bg-blue-600 hover:bg-blue-700',
          focusRing: 'focus:ring-blue-500',
          accentText: 'text-blue-600',
          headerIcon: 'text-blue-400',
          activeTab: 'bg-blue-600 text-white border-blue-600',
          shadow: 'shadow-blue-600/20',
          alertBg: 'bg-blue-50 border-blue-200 text-blue-700',
        };
      default: // owner / caretaker
        return {
          primaryBg: 'bg-emerald-600 hover:bg-emerald-700',
          focusRing: 'focus:ring-emerald-500',
          accentText: 'text-emerald-600',
          headerIcon: 'text-emerald-400',
          activeTab: 'bg-emerald-600 text-white border-emerald-600',
          shadow: 'shadow-emerald-600/20',
          alertBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        };
    }
  };

  const theme = getTheme();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const payload = {
        profile_id: profileId,
        creator_role: creatorRole,
        unit_id: unitId,
        unit_number: unitNumber,
        tenant_name: tenantName,
        invoice_type: invoiceType,
        tenant_kra_pin: tenantKraPin,
        tax_type: taxType,
        ...(invoiceType === 'water'
          ? {
              previous_reading: Number(previousReading),
              current_reading: Number(currentReading),
              rate_per_unit: Number(ratePerUnit),
              amount: calculatedWaterTotal,
            }
          : {
              amount: Number(amount),
              description,
            }),
      };

      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      setSuccessMsg(data.message || 'Invoice generated successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Receipt className={theme.headerIcon} size={20} />
            <h3 className="font-bold text-base">Generate New Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className={`p-3 border text-xs rounded-xl font-medium ${theme.alertBg}`}>
              {successMsg}
            </div>
          )}

          {/* Invoice Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['water', 'rent', 'utility'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInvoiceType(type)}
                  className={`py-2 text-xs font-semibold rounded-xl capitalize transition border ${
                    invoiceType === type
                      ? theme.activeTab + ' shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tenant Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Number</label>
              <input
                type="text"
                required
                placeholder="e.g. A4"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className={`w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant Name</label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className={`w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing}`}
              />
            </div>
          </div>

          {/* Water Meter Section */}
          {invoiceType === 'water' ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Calculator size={14} className={theme.accentText} />
                <span>Water Meter Readings</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Previous</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={previousReading}
                    onChange={(e) => setPreviousReading(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Current</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentReading}
                    onChange={(e) => setCurrentReading(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Rate/Unit</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ratePerUnit}
                    onChange={(e) => setRatePerUnit(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2 font-semibold">
                <span className="text-slate-600">Consumed: {unitsConsumed} units</span>
                <span className={`text-sm font-extrabold ${theme.accentText}`}>
                  KES {calculatedWaterTotal.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (KES)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 25000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing}`}
              />
            </div>
          )}

          {/* eTIMS Tax Compliance Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              eTIMS / KRA Configuration
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant KRA PIN</label>
                <input
                  type="text"
                  placeholder="Optional (e.g. A012345678Z)"
                  value={tenantKraPin}
                  onChange={(e) => setTenantKraPin(e.target.value)}
                  className={`w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing} uppercase`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Classification</label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                  className={`w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${theme.focusRing} bg-white`}
                >
                  <option value="EXEMPT">Exempt (Residential Rent)</option>
                  <option value="B">Standard 16% (Commercial)</option>
                  <option value="E">Zero Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 text-xs font-semibold text-white rounded-xl transition flex items-center justify-center gap-2 shadow-md ${theme.primaryBg} ${theme.shadow}`}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}