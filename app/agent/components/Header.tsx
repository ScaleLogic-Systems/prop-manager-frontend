// app/agent/components/Header.tsx
'use client';

import React from 'react';
import { Building2, ShieldCheck } from 'lucide-react';
import { AgentProfile } from '../types';

interface HeaderProps {
  profile: AgentProfile | null;
  selectedPropertyId: string;
  onSelectProperty: (propertyId: string) => void;
  properties: { id: string; name: string }[];
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  selectedPropertyId,
  onSelectProperty,
  properties,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
            Agent Mode v1.0.0
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Welcome Back, {profile?.full_name || 'Portfolio Agent'} 👋
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <Building2 size={18} className="text-blue-600" />
          <span className="text-xs font-bold text-slate-600">Property Filter:</span>
          <select
            value={selectedPropertyId}
            onChange={(e) => onSelectProperty(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="">All Assigned Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};