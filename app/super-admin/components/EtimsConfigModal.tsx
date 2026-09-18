'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface EtimsConfigModalProps {
  profileId: string;
  profileName: string;
  onClose: () => void;
}

export const EtimsConfigModal: React.FC<EtimsConfigModalProps> = ({
  profileId,
  profileName,
  onClose,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [kraPin, setKraPin] = useState('');
  const [vscuSerial, setVscuSerial] = useState('');
  const [branchCode, setBranchCode] = useState('00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function fetchEtimsConfig() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agency_etims_configs')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsEnabled(data.is_enabled || false);
        setKraPin(data.kra_pin || '');
        setVscuSerial(data.vscu_serial_number || '');
        setBranchCode(data.branch_code || '00');
      }
    } catch (err: unknown) {
      console.error('Error fetching eTIMS config:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEtimsConfig();
  }, [profileId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('agency_etims_configs').upsert(
        {
          profile_id: profileId,
          is_enabled: isEnabled,
          kra_pin: kraPin.toUpperCase().trim(),
          vscu_serial_number: vscuSerial.trim(),
          branch_code: branchCode.trim() || '00',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' }
      );

      if (error) throw error;

      setMessage({ type: 'success', text: 'eTIMS configuration updated successfully!' });
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update eTIMS settings.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">eTIMS Feature Configuration</h3>
            <p className="text-xs text-slate-400 mt-0.5">Agency / Client: <span className="text-amber-400 font-semibold">{profileName}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold px-2">
            &times;
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading configuration...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs pt-5">
            {message && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                }`}
              >
                <span>{message.text}</span>
              </div>
            )}

            {/* Feature Toggle */}
            <div className="flex items-center justify-between bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <div>
                <span className="block font-bold text-slate-200">Enable eTIMS Syncing Add-On</span>
                <span className="text-[11px] text-slate-400">
                  Activates real-time KRA tax invoice generation for this agency.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
                  isEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-slate-950 transition-transform transform absolute top-1 ${
                    isEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* KRA PIN */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">KRA PIN</label>
              <input
                type="text"
                required={isEnabled}
                value={kraPin}
                onChange={(e) => setKraPin(e.target.value)}
                placeholder="e.g. P051234567Z"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 uppercase focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* VSCU Serial / Device ID */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">VSCU Serial Number / Device ID</label>
              <input
                type="text"
                required={isEnabled}
                value={vscuSerial}
                onChange={(e) => setVscuSerial(e.target.value)}
                placeholder="e.g. VSCU-KE-998241"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Branch Code */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Branch Code</label>
              <input
                type="text"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                placeholder="00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
