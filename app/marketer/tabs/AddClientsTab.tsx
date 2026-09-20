// app/marketer/tabs/AddClientsTab.tsx
'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Sparkles, User, Mail, Phone, UserCheck } from 'lucide-react';
import { ClientRole } from '../types';

interface AddClientsTabProps {
  fullName: string;
}

export const AddClientsTab: React.FC<AddClientsTabProps> = ({ fullName }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    role: 'property_owner' as ClientRole,
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/marketer/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone_number,
          role: formData.role,
          entry_point: 'Direct Outreach',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification link.');
      }

      setFeedback({
        type: 'success',
        msg: `Account initialized and verification link sent to ${formData.email}!`,
      });

      // Reset Form
      setFormData({
        full_name: '',
        phone_number: '',
        email: '',
        role: 'property_owner',
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during client addition.';
      setFeedback({ type: 'error', msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-blue-100 text-xs px-3 py-1 rounded-full font-medium mb-3 border border-white/10">
            <Sparkles size={14} className="text-amber-300" /> Onboard New Clients
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {fullName}!
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Register new Property Owners or Property Managers. A temporary password and verification login link will be generated automatically.
          </p>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATION */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-red-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.msg}</span>
        </div>
      )}

      {/* ADD CLIENT FORM CONTAINER */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 max-w-2xl mx-auto">
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900">Client Details</h2>
          <p className="text-xs text-gray-500 mt-1">
            Fill in the client&apos;s information below to provision their account credentials.
          </p>
        </div>

        <form onSubmit={handleSendVerification} className="space-y-5">
          {/* FULL NAME */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                name="full_name"
                required
                placeholder="e.g. Jane Doe"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="email"
                required
                placeholder="client@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* PHONE NUMBER */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                name="phone_number"
                required
                placeholder="+254 7XX XXX XXX"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* ROLE SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Role Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <UserCheck size={18} />
              </div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition"
              >
                <option value="property_owner">Property Owner</option>
                <option value="property_manager">Property Manager</option>
              </select>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Send size={16} />
              {loading ? 'Sending Verification Link...' : 'Send Verification Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};