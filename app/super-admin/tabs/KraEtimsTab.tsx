// app/super-admin/tabs/KraEtimsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { EtimsConfigModal } from '../components/EtimsConfigModal';

interface AgencyProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  created_at?: string;
}

export const KraEtimsTab: React.FC = () => {
  const [agencies, setAgencies] = useState<AgencyProfile[]>([]);
  const [etimsConfigs, setEtimsConfigs] = useState<Record<string, { is_enabled: boolean; kra_pin?: string; branch_code?: string }>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAgency, setSelectedAgency] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  async function fetchAgencies() {
    setLoading(true);
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['property_manager', 'super_admin', 'owner', 'property-manager', 'super-admin'])
        .order('created_at', { ascending: false });

      if (profileErr) throw profileErr;
      setAgencies(profileData || []);

      const { data: configData, error: configErr } = await supabase
        .from('agency_etims_configs')
        .select('profile_id, is_enabled, kra_pin, branch_code');

      if (!configErr && configData) {
        const configMap: Record<string, { is_enabled: boolean; kra_pin?: string; branch_code?: string }> = {};
        configData.forEach((c) => {
          configMap[c.profile_id] = {
            is_enabled: c.is_enabled,
            kra_pin: c.kra_pin,
            branch_code: c.branch_code,
          };
        });
        setEtimsConfigs(configMap);
      }
    } catch (err: unknown) {
      console.error('Failed to load agency eTIMS data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleConfigure = (agency: AgencyProfile) => {
    setSelectedAgency({ id: agency.id, name: agency.full_name || agency.email });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            KRA eTIMS Agency Configurations
          </h2>
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
                  <th className="py-3.5 px-4">Subscriber / Agency</th>
                  <th className="py-3.5 px-4">Contact Email</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">KRA PIN</th>
                  <th className="py-3.5 px-4">Branch Code</th>
                  <th className="py-3.5 px-4">eTIMS Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {agencies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No agencies found.
                    </td>
                  </tr>
                ) : (
                  agencies.map((agency) => {
                    const cfg = etimsConfigs[agency.id];
                    const isEnabled = cfg?.is_enabled || false;
                    return (
                      <tr key={agency.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {agency.full_name || 'Unnamed Agency'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{agency.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-amber-400">
                            {agency.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-400">
                          {cfg?.kra_pin || 'Not Set'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {cfg?.branch_code || '00'}
                        </td>
                        <td className="py-3.5 px-4">
                          {isEnabled ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active / Transmitting
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedAgency && (
        <EtimsConfigModal
          profileId={selectedAgency.id}
          profileName={selectedAgency.name}
          onClose={() => {
            setSelectedAgency(null);
            fetchAgencies();
          }}
        />
      )}
    </div>
  );
};