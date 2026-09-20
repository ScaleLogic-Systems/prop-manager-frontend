'use client';

import React from 'react';
import { OwnerTab } from '../types';
import {
  LayoutDashboard,
  PlusSquare,
  FileText,
  Users,
  UserCheck,
  AlertCircle,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

interface SidebarProps {
  activeTab: OwnerTab;
  setActiveTab: (tab: OwnerTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems: { id: OwnerTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate-invoice', label: 'Generate Invoice', icon: FileText },
    { id: 'add-property', label: 'Add Property', icon: PlusSquare },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'tenants', label: 'Tenants', icon: UserCheck },
    { id: 'unassigned-payments', label: 'Unassigned Payments', icon: AlertCircle },
    { id: 'subscription', label: 'Subscriptions', icon: CreditCard },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between hidden md:flex">
      <div>
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-tight text-white">Owner Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Landlord Management System</p>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};