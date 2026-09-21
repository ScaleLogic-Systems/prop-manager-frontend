'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  UserPlus, 
  Receipt, 
  CreditCard,
  Building2,
  ShieldCheck,
  Loader2,
  LogOut,
  FileText,
  HelpCircle,
  Settings
} from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';

// Import tab components
import { DashboardTab } from './tabs/DashboardTab';
import AddPropertyTab from './tabs/AddPropertyTab';
import { UserManagementTab } from './tabs/UserManagementTab';
import { TenantsTab } from './tabs/TenantsTab';
import { UnassignedPaymentsTab } from './tabs/UnassignedPaymentsTab';
import { SubscriptionsTab } from './tabs/SubscriptionsTab';
import { InvoiceGenerationTab } from '@/components/InvoiceGenerationTab';
import { ContactSupportTab } from '@/components/support/ContactSupportTab';
import PropertyManagerSettingsTab from './tabs/SettingsTab';

export type ManagerTab = 
  | 'dashboard' 
  | 'generate-invoice' 
  | 'add-property' 
  | 'users' 
  | 'tenants' 
  | 'unassigned-payments' 
  | 'subscription' 
  | 'support'
  | 'settings';

export default function PropertyManagerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ManagerTab>('dashboard');
  const [fullName, setFullName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingUser(true);

        // 1. Fetch current auth user directly from client Supabase instance
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);

          // Check user metadata first
          const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
          if (metaName && typeof metaName === 'string' && metaName.trim()) {
            setFullName(metaName.trim());
          }

          // 2. Query profiles database table directly
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, name')
            .eq('id', user.id)
            .maybeSingle();

          const dbName = profile?.full_name || profile?.name;
          if (dbName && typeof dbName === 'string' && dbName.trim()) {
            setFullName(dbName.trim());
          } else if (!metaName && user.email) {
            setFullName(user.email.split('@')[0]);
          }
        } else {
          // 3. Fallback to API endpoint fetch if client session is in cookies
          const res = await fetch('/api/auth/me', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data?.full_name) setFullName(data.full_name);
            if (data?.id) setCurrentUserId(data.id);
          }
        }
      } catch (err) {
        console.error('Error fetching profile full_name:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = fullName && fullName.trim() !== '' ? fullName : 'Property Manager';

  const navItems: { id: ManagerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'generate-invoice', label: 'Generate Invoice', icon: <FileText size={18} /> },
    { id: 'add-property', label: 'Add Property', icon: <PlusCircle size={18} /> },
    { id: 'users', label: 'User Management', icon: <UserPlus size={18} /> },
    { id: 'tenants', label: 'Tenants & Payments', icon: <Users size={18} /> },
    { id: 'unassigned-payments', label: 'Unassigned Payments', icon: <Receipt size={18} /> },
    { id: 'subscription', label: 'Subscriptions', icon: <CreditCard size={18} /> },
    { id: 'support', label: 'Help & Support', icon: <HelpCircle size={18} /> },
    { id: 'settings', label: 'Account Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. SIDEBAR MENU */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">PropManager</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Manager Portal</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Main Menu
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User Info & Log Out Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              {loadingUser ? <Loader2 size={14} className="animate-spin" /> : displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {loadingUser ? 'Loading...' : displayName}
              </p>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400 inline" /> Property Manager
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-red-600/20 text-slate-300 hover:text-red-400 border border-slate-700/50 hover:border-red-500/30 text-xs font-medium transition-all"
          >
            {loggingOut ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            <span>{loggingOut ? 'Signing out...' : 'Log Out'}</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HERO HEADER */}
        <header className="bg-slate-900 border-b border-slate-800 px-8 py-6 text-white shrink-0 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Property Manager Portal
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back,{' '}
                <span className="text-blue-400">
                  {loadingUser ? (
                    <span className="inline-flex items-center gap-2 text-slate-300 text-lg font-normal">
                      <Loader2 size={18} className="animate-spin" /> Fetching profile...
                    </span>
                  ) : (
                    displayName
                  )}
                </span> 👋
              </h1>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'generate-invoice' && <InvoiceGenerationTab role="property_manager" />}
            {activeTab === 'add-property' && <AddPropertyTab />}
            {activeTab === 'users' && <UserManagementTab />}
            {activeTab === 'tenants' && <TenantsTab />}
            {activeTab === 'unassigned-payments' && <UnassignedPaymentsTab />}
            {activeTab === 'subscription' && <SubscriptionsTab />}
            {activeTab === 'support' && <ContactSupportTab roleTitle="Property Manager" />}
            {activeTab === 'settings' && <PropertyManagerSettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}