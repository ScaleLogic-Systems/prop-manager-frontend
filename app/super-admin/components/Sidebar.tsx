// app/super-admin/components/Sidebar.tsx
'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText, 
  Wallet, 
  Building2, 
  Receipt, 
  ShieldAlert, 
  RotateCw, 
  UserCheck, 
  Crown, 
  LogOut,
  Landmark,
  Shield,
  Sliders
} from 'lucide-react';
import { SuperadminTab } from '../types';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: SuperadminTab;
  setActiveTab: (tab: SuperadminTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navGroups = [
    {
      title: 'Operations & SaaS Management',
      items: [
        { id: 'dashboard' as SuperadminTab, label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'subscribers' as SuperadminTab, label: 'Subscribers & Agencies', icon: Users },
        { id: 'add-users' as SuperadminTab, label: 'User Onboarding', icon: UserPlus },
        { id: 'saas-invoicing' as SuperadminTab, label: 'SaaS Invoicing', icon: FileText },
        { id: 'kra-etims' as SuperadminTab, label: 'KRA eTIMS Config', icon: Landmark },
      ],
    },
    {
      title: 'Reconciliation Hub',
      items: [
        { id: 'unassigned-payments-hub' as SuperadminTab, label: 'Payments Hub Overview', icon: Wallet },
        { id: 'saas-unassigned-payments' as SuperadminTab, label: 'SaaS B2B Unassigned', icon: Building2 },
        { id: 'tenant-unassigned-payments' as SuperadminTab, label: 'Tenant Rent Unassigned', icon: Receipt },
      ],
    },
    {
      title: 'Technical & God-Mode Controls',
      items: [
        { id: 'system-control' as SuperadminTab, label: 'Cron & Emergency Lockdown', icon: ShieldAlert },
        { id: 'webhook-debugger' as SuperadminTab, label: 'Webhook DLQ & Replay', icon: RotateCw },
        { id: 'impersonator' as SuperadminTab, label: 'Tenant Impersonation', icon: UserCheck },
      ],
    },
    {
      title: 'Governance & Feature Control',
      items: [
        { id: 'audit-logs' as SuperadminTab, label: 'Platform Audit Logs', icon: Shield },
        { id: 'feature-flags' as SuperadminTab, label: 'Feature Flags & Modules', icon: Sliders },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-amber-500 text-slate-950 p-2 rounded-xl flex items-center justify-center font-black shadow-sm">
          <Crown size={20} />
        </div>
        <div>
          <h1 className="font-bold text-white text-sm tracking-tight">PropManager HQ</h1>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
            Superadmin Portal
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
              {group.title}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sign Out Footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-red-950/40 hover:text-red-400 transition"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};