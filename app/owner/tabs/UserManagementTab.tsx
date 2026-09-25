// app/owner/tabs/UserManagementTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Home, Mail, CheckCircle, Clock, Loader2, AlertCircle, RefreshCw, Briefcase, UserX } from 'lucide-react';
import { UserRole, PropertyOption, ManagedUser } from '../types';
import { RemoveUserModal } from '@/components/modals/RemoveUserModal';
import { createClient } from '@/lib/supabaseClient';

export const UserManagementTab: React.FC = () => {
  const [availableProperties, setAvailableProperties] = useState<PropertyOption[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal state for user removal
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole | 'agent'>('tenant');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('N/A');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchInitialData = async () => {
    setFetching(true);
    setFetchError(null);
    const errors: string[] = [];

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const propsRes = await fetch('/owner/api/properties-overview', { 
        cache: 'no-store',
        headers
      });
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        const loadedProps = (propsData.properties || []).map((p: any) => ({
          id: p.propertyId || p.id,
          name: p.propertyName || p.name,
          units: Array.isArray(p.units)
            ? p.units.map((u: any) => String(u.unit_number || ''))
            : [],
        }));
        setAvailableProperties(loadedProps);
        if (loadedProps.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(loadedProps[0].id);
        }
      } else {
        errors.push(`Properties API failed (${propsRes.status})`);
      }

      const usersRes = await fetch('/owner/api/invite-user', { 
        cache: 'no-store',
        headers
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      } else {
        errors.push(`Users API failed (${usersRes.status})`);
      }
    } catch (err: any) {
      errors.push(`Network error: ${err.message}`);
    }

    if (errors.length > 0) {
      setFetchError(errors.join(' | '));
    }

    setFetching(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const currentProperty = availableProperties.find((p) => p.id === selectedPropertyId);

  // Filter out units already occupied in the selected property
  const occupiedUnits = new Set(
    users
      .filter((u) => u.property_id === selectedPropertyId && u.unit_number && u.unit_number !== 'N/A' && !u.unit_number.includes('Building Level'))
      .map((u) => u.unit_number)
  );
  const availableUnits = currentProperty?.units?.filter((unit: string) => !occupiedUnits.has(unit)) || [];

  // Helper to format invitation date cleanly
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Today';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/owner/api/invite-user', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          role,
          property_id: selectedPropertyId,
          unit_number: selectedUnit === 'N/A' || !selectedUnit ? null : selectedUnit,
        }),
      });

      const contentType = res.headers.get('content-type');
      let result: any = {};
      if (contentType && contentType.includes('application/json')) {
        result = await res.json();
      }

      if (!res.ok) {
        throw new Error(result.error || `Request failed with status ${res.status}`);
      }

      setFeedback({
        type: 'success',
        msg: `Verification link sent successfully to ${email}. Record saved to database.`,
      });

      setFullName('');
      setEmail('');
      setPhone('');
      setSelectedUnit('N/A');
      await fetchInitialData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong while sending the invitation.';
      setFeedback({ type: 'error', msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. ADD NEW USER FORM */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Add &amp; Assign New User</h2>
              <p className="text-sm text-gray-500">
                Invite a Property Manager, Caretaker, Agent, or Tenant. An automated verification link will be emailed to set up their password.
              </p>
            </div>
          </div>
          <button
            onClick={fetchInitialData}
            disabled={fetching}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition"
          >
            <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
            Refresh Directory
          </button>
        </div>

        {fetchError && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {feedback && (
          <div
            className={`p-4 rounded-lg text-sm mb-6 flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {feedback.msg}
          </div>
        )}

        <form onSubmit={handleInviteUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address (For Verification)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role Assignment</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="tenant">Tenant</option>
                <option value="caretaker">Caretaker</option>
                <option value="agent">Agent</option>
                <option value="property_manager">Property Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Select Building / Property
              </label>
              <select
                required
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  setSelectedUnit('N/A');
                }}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">-- Choose Property --</option>
                {availableProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Unit</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="N/A">N/A (Not Living in Unit / Building Level)</option>
                {availableUnits.map((unit: string) => (
                  <option key={unit} value={unit}>
                    Unit {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Sending Verification Link...
              </>
            ) : (
              <>
                <Mail size={18} />
                Send Verification Link &amp; Add User
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. ASSIGNED USERS DIRECTORY */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Managed Users &amp; Roles</h3>
            <p className="text-sm text-gray-500">
              Property Managers, Caretakers, Agents, and Tenants assigned to your properties in the database.
            </p>
          </div>
          {fetching && <Loader2 className="animate-spin text-blue-600" size={18} />}
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No registered users found for your properties in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Assigned Building</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Invited Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {users.map((usr) => (
                  <tr key={`${usr.id}-${usr.role}`}>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{usr.full_name}</div>
                      <div className="text-xs text-gray-500">{usr.email} | {usr.phone}</div>
                    </td>
                    <td className="p-4">
                      {usr.role === 'property_manager' ? (
                        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-medium">
                          <Briefcase size={12} /> Property Manager
                        </span>
                      ) : usr.role === 'caretaker' ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-medium">
                          <Shield size={12} /> Caretaker
                        </span>
                      ) : (usr.role as string) === 'agent' ? (
                        <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-xs px-2.5 py-1 rounded-full font-medium">
                          <Shield size={12} /> Agent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                          <Home size={12} /> Tenant
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-700 font-medium">{usr.property_name || 'N/A'}</td>
                    <td className="p-4 text-gray-600">{usr.unit_number || 'N/A (Building Level)'}</td>
                    <td className="p-4">
                      {usr.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">
                          <Clock size={12} /> Pending Password
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">
                      {formatDate(usr.invited_at || (usr as Record<string, any>).created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedUser(usr)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition shadow-sm"
                      >
                        <UserX size={14} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation & Removal Modal */}
      {selectedUser && (
        <RemoveUserModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={() => {
            setSelectedUser(null);
            fetchInitialData();
          }}
          targetUserId={selectedUser.id}
          targetName={selectedUser.full_name}
          targetRole={selectedUser.role}
          propertyId={selectedUser.property_id}
          unitId={selectedUser.unit_id}
        />
      )}
    </div>
  );
};