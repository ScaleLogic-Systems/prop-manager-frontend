// app/marketer/tabs/AddUserTab.tsx
'use client';

import React, { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddUserTabProps {
  currentUserId?: string;
  fullName?: string;
}

export const AddUserTab: React.FC<AddUserTabProps> = ({
  fullName: marketerFullName,
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'tenant' | 'property_manager' | 'accountant' | 'agent' | 'caretaker'>('tenant');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/marketer/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to invite user.');
      setMessage({ type: 'success', text: `Account created and invitation sent to ${email}.` });
      setEmail('');
      setFullName('');
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to invite user.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <UserPlus size={20} className="text-amber-500" />
          Add / Invite User
        </h2>
        {marketerFullName && (
          <p className="text-xs text-gray-500 mt-0.5">
            Invited by: <span className="font-semibold text-gray-700">{marketerFullName}</span>
          </p>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Assign Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="tenant">Tenant</option>
            <option value="property_manager">Property Manager</option>
            <option value="accountant">Accountant</option>
            <option value="agent">Agent</option>
            <option value="caretaker">Caretaker</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'Sending Invitation...' : 'Invite User'}
        </button>
      </form>
    </div>
  );
};