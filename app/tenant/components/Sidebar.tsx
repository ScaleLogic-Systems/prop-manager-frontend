// app/tenant/components/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, History, LogOut, Loader2 } from 'lucide-react';
import { TenantTab } from '../types';

interface SidebarProps {
  activeTab: TenantTab;
  setActiveTab: (tab: TenantTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const navItems: { id: TenantTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'payments', label: 'Payment History', icon: <History size={18} /> },
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
          <h1 className="text-xl font-bold tracking-wide text-blue-400">Tenant Portal</h1>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* BOTTOM SECTION WITH LOGOUT & COPYRIGHT */}
      <div className="p-4 border-t border-slate-800 space-y-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition disabled:opacity-50"
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