// app/agent/tabs/AddTenantTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  units?: Array<{ id: string; unit_number: string }>;
}

interface Unit {
  id: string;
  unit_number: string;
}

export const AddTenantTab: React.FC<{ propertyId?: string }> = ({ propertyId }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyId || '');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingUnits, setFetchingUnits] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch agent profile and assigned properties using agent API routes
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const res = await fetch('/agent/api/profile', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) {
            const assignedProp = {
              id: data.profile.assigned_property_id || propertyId || '',
              name: data.profile.assigned_property_name || 'Assigned Property',
            };
            if (assignedProp.id) {
              setProperties([assignedProp]);
              if (!selectedPropertyId) {
                setSelectedPropertyId(assignedProp.id);
              }
            }
          }
        }

        const tenantsRes = await fetch('/agent/api/tenants', { cache: 'no-store' });
        if (tenantsRes.ok) {
          const tenantsData = await tenantsRes.json();
          if (Array.isArray(tenantsData.properties) && tenantsData.properties.length > 0) {
            setProperties(tenantsData.properties);
          }
        }
      } catch (err) {
        console.error('Failed to fetch agent properties and profile:', err);
      }
    };
    fetchAgentData();
  }, [propertyId]);

  // 2. Fetch units when property changes using agent tenants API route
  useEffect(() => {
    if (!selectedPropertyId) return;
    const fetchUnits = async () => {
      try {
        setFetchingUnits(true);
        const res = await fetch(`/agent/api/tenants?property_id=${selectedPropertyId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setUnits(data.units || data.available_units || []);
        }
      } catch (err) {
        console.error('Failed to fetch units:', err);
      } finally {
        setFetchingUnits(false);
      }
    };
    fetchUnits();
  }, [selectedPropertyId]);

  const handleInviteTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/agent/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          property_id: selectedPropertyId,
          unit_id: selectedUnitId,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to send verification link.');

      setSuccessMsg(`Verification link successfully emailed to ${email}`);
      setFullName('');
      setEmail('');
      setPhone('');
      setSelectedUnitId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error triggering invite email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
          <UserPlus size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Add New Tenant</h2>
          <p className="text-sm text-gray-500">
            Assign tenants to units and trigger a verification link for account setup.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm mb-6 flex items-center gap-2">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm mb-6 flex items-center gap-2">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleInviteTenant} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Property</label>
            <select
              required
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">-- Select Property --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Unit</label>
            <select
              required
              disabled={fetchingUnits || units.length === 0}
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-100"
            >
              <option value="">
                {fetchingUnits ? 'Loading units...' : units.length === 0 ? 'No units found' : '-- Select Unit --'}
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.unit_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tenant Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 712 345678"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedUnitId}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Mail size={18} />
          {loading ? 'Sending Verification Link...' : 'Send Verification Link & Register Tenant'}
        </button>
      </form>
    </div>
  );
};