// app/agent/components/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Gauge, 
  FileText, 
  UserPlus, 
  Users, 
  CreditCard, 
  HelpCircle, 
  Settings, 
  LogOut, 
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { AgentTab } from '../types';

interface SidebarProps {
  activeTab: AgentTab;
  setActiveTab: (tab: AgentTab) => void;
  unassignedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, unassignedCount = 0 }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems: { id: AgentTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'meter-readings', label: 'Meter Readings', icon: <Gauge size={18} /> },
    { id: 'generate-invoice', label: 'Generate Invoice', icon: <FileText size={18} /> },
    { id: 'add-tenant', label: 'Add Tenant', icon: <UserPlus size={18} /> },
    { id: 'tenants', label: 'Tenants List', icon: <Users size={18} /> },
    { id: 'payments', label: 'Payment History', icon: <CreditCard size={18} /> },
    { 
      id: 'unassigned-payments', 
      label: 'Unassigned Payments', 
      icon: <ShieldAlert size={18} />, 
      badge: unassignedCount 
    },
    { id: 'support', label: 'Help & Support', icon: <HelpCircle size={18} /> },
    { id: 'settings', label: 'Account Settings', icon: <Settings size={18} /> },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
      <div>
        <div className="p-6 border-b border-slate-800">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Agent Portal</div>
          <h1 className="text-xl font-bold tracking-wide text-white mt-0.5">Property Operations</h1>
        </div>

        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          {isLoggingOut ? 'Logging out...' : 'Log Out'}
        </button>

        <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-800/60">
          &copy; 2026 Property Portal
        </div>
      </div>
    </aside>
  );
};