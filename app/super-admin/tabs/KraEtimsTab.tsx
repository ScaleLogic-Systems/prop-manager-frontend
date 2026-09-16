// app/super-admin/tabs/KraEtimsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { EtimsConfigModal } from '../components/EtimsConfigModal';

interface Agency {
  id: string;
  agency_name: string;
  contact_email: string;
  phone: string;
  etims_enabled?: boolean;
  kra_pin?: string;
  branch_id?: string;
}

export const KraEtimsTab: React.FC = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchAgencies();
  }, []);

  async function fetchAgencies() {
    setLoading(true);
    const { data, error } = await supabase
      .from('organizations') // or 'subscribers' / 'agencies' depending on your schema
      .select('id, agency_name, contact_email, phone, etims_enabled, kra_pin, branch_id')
      .order('agency_name', { ascending: true });

    if (!error && data) {
      setAgencies(data);
    }
    setLoading(false);
  }

  const handleConfigure = (agency: Agency) => {
    setSelectedAgency(agency);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400 mb-1">OPERATIONS & SAAS MANAGEMENT</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            KRA eTIMS Agency Configurations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Assign eTIMS integration options, ESD details, and KRA PIN compliance to subscriber agencies.
          </p>
        </div>
        <button
          onClick={fetchAgencies}
          className="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-xl transition"
        >
          Refresh Agencies
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading agency eTIMS statuses...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Agency Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">KRA PIN</th>
                  <th className="py-3.5 px-4">Branch ID</th>
                  <th className="py-3.5 px-4">eTIMS Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {agencies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No agencies found.
                    </td>
                  </tr>
                ) : (
                  agencies.map((agency) => (
                    <tr key={agency.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {agency.agency_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{agency.contact_email}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">
                        {agency.kra_pin || 'Not Configured'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {agency.branch_id || '00'}
                      </td>
                      <td className="py-3.5 px-4">
                        {agency.etims_enabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleConfigure(agency)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Configure eTIMS
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && selectedAgency && (
        <EtimsConfigModal
          profileId={selectedAgency.id}
          profileName={selectedAgency.agency_name}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAgency(null);
            fetchAgencies();
          }}
        />
      )}
    </div>
  );
};