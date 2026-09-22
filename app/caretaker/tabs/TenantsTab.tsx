// app/caretaker/tabs/TenantsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserX, Loader2, Mail, Phone } from 'lucide-react';
import { RemoveUserModal } from '@/components/modals/RemoveUserModal';

interface TenantRecord {
  id: string;
  tenant_name: string;
  email: string;
  phone: string;
  unit_id: string;
  unit_number: string;
  property_id: string;
  property_name: string;
}

export const TenantsTab: React.FC<{ propertyId?: string }> = ({ propertyId }) => {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const queryParam = propertyId ? `?property_id=${propertyId}` : '';
      const res = await fetch(`/caretaker/api/tenants${queryParam}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="animate-spin text-emerald-600" size={20} />
        <span>Loading active tenants...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-emerald-600" size={22} />
            Active Property Tenants
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage active tenants currently occupying units under your assigned property.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
          {tenants.length} Active {tenants.length === 1 ? 'Tenant' : 'Tenants'}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {tenants.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No active tenants found for this property.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Tenant Name</th>
                <th className="p-4">Unit</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-semibold text-slate-900">{tenant.tenant_name}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold">
                      Unit {tenant.unit_number}
                    </span>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail size={12} className="text-slate-400" /> {tenant.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone size={12} className="text-slate-400" /> {tenant.phone}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedTenant(tenant)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition shadow-sm"
                    >
                      <UserX size={14} />
                      Vacate / Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation & Removal Modal */}
      {selectedTenant && (
        <RemoveUserModal
          isOpen={!!selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onSuccess={() => {
            setSelectedTenant(null);
            fetchTenants();
          }}
          targetUserId={selectedTenant.id}
          targetName={selectedTenant.tenant_name}
          targetRole="tenant"
          propertyId={selectedTenant.property_id}
          unitId={selectedTenant.unit_id}
        />
      )}
    </div>
  );
};