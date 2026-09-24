// app/property-manager/components/SendInviteModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface Property {
  id: string;
  name: string;
}

interface SendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
}

export default function SendInviteModal({ isOpen, onClose, properties }: SendInviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'property_manager'>('owner');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleProperty = (id: string) => {
    setSelectedPropertyIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || selectedPropertyIds.length === 0) {
      setError('Please provide an email and select at least one property.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/send-property-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          propertyIds: selectedPropertyIds,
          role,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to send invitation.');
      }

      setSuccessMessage(`Invitation successfully sent to ${email}!`);
      setTimeout(() => {
        setEmail('');
        setSelectedPropertyIds([]);
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold">Invite Owner / Manager</h3>
            <p className="text-xs text-slate-400">Select properties to assign and send a secure access link.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs">{error}</div>}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 size={16} /> {successMessage}
          </div>
        )}

        <form onSubmit={handleSendInvite} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Recipient Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Assign Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'owner' | 'property_manager')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="owner">Property Owner (Landlord)</option>
              <option value="property_manager">Property Manager (Co-Manager)</option>
            </select>
          </div>

          {/* Property Multi-Select Checkboxes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Select Properties to Link ({selectedPropertyIds.length} selected)</label>
            <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-950 border border-slate-800 p-3 rounded-xl">
              {properties.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No properties available.</p>
              ) : (
                properties.map((prop) => (
                  <label
                    key={prop.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPropertyIds.includes(prop.id)}
                      onChange={() => toggleProperty(prop.id)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-200">{prop.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedPropertyIds.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send Invitation Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}