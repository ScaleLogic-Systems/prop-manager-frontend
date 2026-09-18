// app/super-admin/tabs/SystemControlTab.tsx
'use client';

import React, { useState } from 'react';
import { Play, ToggleRight, ToggleLeft, AlertTriangle } from 'lucide-react';

export const SystemControlTab: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const jobs = [
    {
      id: 'job_monthly_invoices',
      name: 'Batch Monthly Rent Invoicing',
      description: 'Generates recurring monthly rent and utility invoices for all active leases across agencies.',
      lastRun: 'Today, 00:00 EAT',
    },
    {
      id: 'job_mpesa_reconcile',
      name: 'M-Pesa Auto-Match Worker',
      description: 'Scans unassigned C2B payments and attempts fuzzy matching on house numbers.',
      lastRun: '15 minutes ago',
    },
    {
      id: 'job_whatsapp_dispatch',
      name: 'WhatsApp Bot Rent Reminders',
      description: 'Dispatches automated payment notifications to tenants with balance > 0.',
      lastRun: 'Yesterday, 08:00 EAT',
    },
  ];

  const handleRunJob = async (id: string) => {
    setRunningJob(id);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRunningJob(null);
    alert(`Job [${id}] triggered and completed successfully.`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Maintenance Mode Emergency Alert */}
      <div className="bg-red-950/30 border border-red-900/60 rounded-2xl p-6 text-red-200 flex items-center justify-between shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
            <AlertTriangle size={18} /> Maintenance Mode & Emergency Lockdown
          </div>
          <p className="text-xs text-red-300/80">
            Locks down database mutations across client portals during critical database maintenance or outage windows.
          </p>
        </div>
        <button onClick={() => setMaintenanceMode(!maintenanceMode)} className="cursor-pointer">
          {maintenanceMode ? (
            <ToggleRight size={44} className="text-red-500" />
          ) : (
            <ToggleLeft size={44} className="text-slate-600" />
          )}
        </button>
      </div>

      {/* Manual Worker Queues */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 className="font-bold text-white text-sm tracking-tight">Manual Job Runner & Queue Trigger</h3>
        <div className="divide-y divide-slate-800/80">
          {jobs.map((job) => (
            <div key={job.id} className="py-4 flex items-center justify-between text-xs gap-4">
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">{job.name}</p>
                <p className="text-slate-400 text-xs">{job.description}</p>
                <p className="text-slate-500 text-[11px] font-mono">Last execution: {job.lastRun}</p>
              </div>
              <button
                onClick={() => handleRunJob(job.id)}
                disabled={runningJob === job.id}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl transition text-xs disabled:opacity-50 shrink-0 shadow-sm cursor-pointer"
              >
                <Play size={12} className={runningJob === job.id ? 'animate-spin' : ''} />
                {runningJob === job.id ? 'Executing...' : 'Run Worker'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};