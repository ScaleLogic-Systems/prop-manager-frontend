// app/super-admin/tabs/AuditLogsTab.tsx
'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

export interface AuditLogItem {
  id: string;
  actor_email: string;
  action: string;
  target_organization: string;
  ip_address: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
}

const MOCK_LOGS: AuditLogItem[] = [
  {
    id: 'log_901',
    actor_email: 'superadmin@propmanager.co.ke',
    action: 'IMPERSONATE_USER',
    target_organization: 'Kiprono Real Estate',
    ip_address: '102.217.64.12',
    status: 'warning',
    timestamp: '2026-09-18T11:45:00.000Z',
  },
  {
    id: 'log_902',
    actor_email: 'superadmin@propmanager.co.ke',
    action: 'REPLAY_MPESA_WEBHOOK',
    target_organization: 'Greenwood Heights',
    ip_address: '102.217.64.12',
    status: 'success',
    timestamp: '2026-09-18T11:15:00.000Z',
  },
  {
    id: 'log_903',
    actor_email: 'accounts@kiprono.co.ke',
    action: 'MANUAL_RECONCILE_PAYMENT',
    target_organization: 'Kiprono Real Estate',
    ip_address: '197.232.14.88',
    status: 'success',
    timestamp: '2026-09-18T09:45:00.000Z',
  },
];

export const AuditLogsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = MOCK_LOGS.filter(
    (log) =>
      log.actor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by actor, action, or agency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing {filteredLogs.length} Audit Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target Agency</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3.5 font-bold text-white">{log.actor_email}</td>
                  <td className="p-3.5 font-bold text-indigo-400">{log.action}</td>
                  <td className="p-3.5 text-slate-300">{log.target_organization}</td>
                  <td className="p-3.5 text-slate-400 text-[11px]">{log.ip_address}</td>
                  <td className="p-3.5 text-right">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        log.status === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};