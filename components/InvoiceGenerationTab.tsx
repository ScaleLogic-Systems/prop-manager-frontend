// components/InvoiceGenerationTab.tsx
'use client';

import React, { useState } from 'react';
import { Plus, FileText, Search } from 'lucide-react';
import { GenerateInvoiceModal } from './GenerateInvoiceModal';

export interface InvoiceGenerationTabProps {
  role?: 'owner' | 'property_manager' | 'caretaker' | 'agent';
  propertyId?: string;
  profileId?: string;
}

export function InvoiceGenerationTab({ role = 'owner', propertyId, profileId }: InvoiceGenerationTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Invoices & Billing</h1>
          <p className="text-xs text-slate-500">Generate and manage tenant invoices, water bills, and eTIMS compliance.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
        >
          <Plus size={16} />
          <span>Generate New Invoice</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search invoices by tenant or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="text-center py-12 text-slate-400 text-xs">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p>Invoice history list will appear here.</p>
        </div>
      </div>

      <GenerateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        creatorRole={role as any}
        profileId={profileId || 'current-user'}
        propertyId={propertyId}
      />
    </div>
  );
}
