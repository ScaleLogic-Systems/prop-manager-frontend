// app/super-admin/components/HeroSection.tsx
'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  Landmark,
  Wallet,
  Building2,
  Receipt,
  ShieldAlert,
  RotateCw,
  UserCheck,
  Shield,
  Sliders,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { SuperadminTab } from '../types';

interface HeroConfig {
  category: string;
  title: string;
  description: string;
  badges: string[];
  icon: LucideIcon;
  badgeColor: string;
  gradient: string;
}

const TAB_HERO_CONFIG: Record<string, HeroConfig> = {
  // Business & SaaS Operations
  dashboard: {
    category: 'Operations & SaaS Management',
    title: 'Platform Overview & Revenue Metrics',
    description: 'Real-time SaaS recurring revenue metrics, subscription cash flows, and platform operational health.',
    badges: ['Live Sync', 'Revenue Analytics', 'M-Pesa IPN'],
    icon: LayoutDashboard,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    gradient: 'from-amber-500/10 via-slate-900 to-slate-950',
  },
  subscribers: {
    category: 'Operations & SaaS Management',
    title: 'Subscribers & Agency Accounts',
    description: 'Monitor client subscriber profiles, track occupied unit capacities, and view payment histories.',
    badges: ['Agency Directory', 'Tenancy Metrics', 'Payment Logs'],
    icon: Users,
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    gradient: 'from-blue-500/10 via-slate-900 to-slate-950',
  },
  'add-users': {
    category: 'Operations & SaaS Management',
    title: 'User Onboarding & RBAC',
    description: 'Provision system roles, invite team administrators, and configure developer access.',
    badges: ['Role Delegation', 'Secure Onboarding', 'Multi-Role'],
    icon: UserPlus,
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    gradient: 'from-indigo-500/10 via-slate-900 to-slate-950',
  },
  'generate-invoice': {
    category: 'Operations & SaaS Management',
    title: 'SaaS Invoicing & Billing Engine',
    description: 'Generate occupancy-based subscriber bills and dispatch notifications via SMS, WhatsApp & Email.',
    badges: ['Automated Tiers', 'Multi-Channel Dispatch', 'e-Billing'],
    icon: FileText,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    gradient: 'from-emerald-500/10 via-slate-900 to-slate-950',
  },
  'saas-invoicing': {
    category: 'Operations & SaaS Management',
    title: 'SaaS Invoicing & Billing Engine',
    description: 'Generate occupancy-based subscriber bills and dispatch notifications via SMS, WhatsApp & Email.',
    badges: ['Automated Tiers', 'Multi-Channel Dispatch', 'e-Billing'],
    icon: FileText,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    gradient: 'from-emerald-500/10 via-slate-900 to-slate-950',
  },
  'kra-etims': {
    category: 'Operations & SaaS Management',
    title: 'KRA eTIMS Compliance Hub',
    description: 'Manage Kenya Revenue Authority ESD device settings, PIN configurations, and eTIMS transmission.',
    badges: ['Tax Compliance', 'ESD Device VSCU', 'Auto Signature'],
    icon: Landmark,
    badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    gradient: 'from-teal-500/10 via-slate-900 to-slate-950',
  },

  // Reconciliation Hubs
  'unassigned-payments-hub': {
    category: 'Financial Reconciliation Hub',
    title: 'Unassigned Payments Central Hub',
    description: 'Identify, review, and reconcile orphaned M-Pesa and bank transactions across tenants and subscribers.',
    badges: ['Smart Matching', 'Audit Trail', 'Queue Overview'],
    icon: Wallet,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    gradient: 'from-purple-500/10 via-slate-900 to-slate-950',
  },
  'payments-overview': {
    category: 'Financial Reconciliation Hub',
    title: 'Unassigned Payments Central Hub',
    description: 'Identify, review, and reconcile orphaned M-Pesa and bank transactions across tenants and subscribers.',
    badges: ['Smart Matching', 'Audit Trail', 'Queue Overview'],
    icon: Wallet,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    gradient: 'from-purple-500/10 via-slate-900 to-slate-950',
  },
  'saas-unassigned-payments': {
    category: 'Financial Reconciliation Hub',
    title: 'SaaS B2B Unassigned Payments',
    description: 'Reconcile unallocated direct subscription payments from property managers and agency owners.',
    badges: ['B2B Reconciler', 'Auto-Credit', 'Direct Resolution'],
    icon: Building2,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    gradient: 'from-emerald-500/10 via-slate-900 to-slate-950',
  },
  'saas-b2b-unassigned': {
    category: 'Financial Reconciliation Hub',
    title: 'SaaS B2B Unassigned Payments',
    description: 'Reconcile unallocated direct subscription payments from property managers and agency owners.',
    badges: ['B2B Reconciler', 'Auto-Credit', 'Direct Resolution'],
    icon: Building2,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    gradient: 'from-emerald-500/10 via-slate-900 to-slate-950',
  },
  'unassigned-saas-payments': {
    category: 'Financial Reconciliation Hub',
    title: 'SaaS B2B Unassigned Payments',
    description: 'Reconcile unallocated direct subscription payments from property managers and agency owners.',
    badges: ['B2B Reconciler', 'Auto-Credit', 'Direct Resolution'],
    icon: Building2,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    gradient: 'from-emerald-500/10 via-slate-900 to-slate-950',
  },
  'tenant-unassigned-payments': {
    category: 'Financial Reconciliation Hub',
    title: 'Tenant Rent Unassigned Payments',
    description: 'Resolve orphaned tenant rent payments and map mismatched unit references to active leases.',
    badges: ['Tenant Billing', 'Lease Re-alignment', 'M-Pesa Fuzzy Match'],
    icon: Receipt,
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    gradient: 'from-indigo-500/10 via-slate-900 to-slate-950',
  },
  'unassigned-tenant-payments': {
    category: 'Financial Reconciliation Hub',
    title: 'Tenant Rent Unassigned Payments',
    description: 'Resolve orphaned tenant rent payments and map mismatched unit references to active leases.',
    badges: ['Tenant Billing', 'Lease Re-alignment', 'M-Pesa Fuzzy Match'],
    icon: Receipt,
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    gradient: 'from-indigo-500/10 via-slate-900 to-slate-950',
  },

  // Technical & God-Mode Controls
  'system-control': {
    category: 'Technical & God-Mode Controls',
    title: 'Cron Automation & Emergency Lockdown',
    description: 'Trigger backend background jobs on demand and manage emergency platform maintenance lockdown.',
    badges: ['God-Mode Control', 'Worker Queues', 'Kill Switch'],
    icon: ShieldAlert,
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    gradient: 'from-rose-500/10 via-slate-900 to-slate-950',
  },
  'cron-lockdown': {
    category: 'Technical & God-Mode Controls',
    title: 'Cron Automation & Emergency Lockdown',
    description: 'Trigger backend background jobs on demand and manage emergency platform maintenance lockdown.',
    badges: ['God-Mode Control', 'Worker Queues', 'Kill Switch'],
    icon: ShieldAlert,
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    gradient: 'from-rose-500/10 via-slate-900 to-slate-950',
  },
  'webhook-debugger': {
    category: 'Technical & God-Mode Controls',
    title: 'Webhook Dead Letter Queue & Replay',
    description: 'Inspect unrouted payment gateway callbacks, inspect raw JSON payloads, and replay drops.',
    badges: ['DLQ Inspector', 'Payload Replay', 'M-Pesa Callbacks'],
    icon: RotateCw,
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    gradient: 'from-cyan-500/10 via-slate-900 to-slate-950',
  },
  'webhook-dlq': {
    category: 'Technical & God-Mode Controls',
    title: 'Webhook Dead Letter Queue & Replay',
    description: 'Inspect unrouted payment gateway callbacks, inspect raw JSON payloads, and replay drops.',
    badges: ['DLQ Inspector', 'Payload Replay', 'M-Pesa Callbacks'],
    icon: RotateCw,
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    gradient: 'from-cyan-500/10 via-slate-900 to-slate-950',
  },
  impersonator: {
    category: 'Technical & God-Mode Controls',
    title: 'Tenant & Client Impersonation',
    description: 'Generate diagnostic read-only access sessions to inspect layouts as any tenant, landlord, or caretaker.',
    badges: ['Diagnostic Session', 'Read-Only Mode', '15m Expiry'],
    icon: UserCheck,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    gradient: 'from-amber-500/10 via-slate-900 to-slate-950',
  },
  'tenant-impersonation': {
    category: 'Technical & God-Mode Controls',
    title: 'Tenant & Client Impersonation',
    description: 'Generate diagnostic read-only access sessions to inspect layouts as any tenant, landlord, or caretaker.',
    badges: ['Diagnostic Session', 'Read-Only Mode', '15m Expiry'],
    icon: UserCheck,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    gradient: 'from-amber-500/10 via-slate-900 to-slate-950',
  },

  // Governance & Feature Control
  'audit-logs': {
    category: 'Governance & Feature Control',
    title: 'Platform Security & Audit Logs',
    description: 'Immutable activity trail of administrative operations, login events, and sensitive data changes.',
    badges: ['Immutable Ledger', 'Security Monitored', 'Audit Trail'],
    icon: Shield,
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    gradient: 'from-sky-500/10 via-slate-900 to-slate-950',
  },
  'feature-flags': {
    category: 'Governance & Feature Control',
    title: 'Feature Flags & Module Controls',
    description: 'Dynamically toggle platform modules, WhatsApp automations, AI agents, and tier features.',
    badges: ['Modular Toggles', 'Tier Gateways', 'Instant Deployment'],
    icon: Sliders,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    gradient: 'from-emerald-500/10 via-slate-900 to-slate-950',
  },
};

interface HeroSectionProps {
  activeTab: SuperadminTab;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ activeTab }) => {
  const config = TAB_HERO_CONFIG[activeTab] || {
    category: 'Superadmin Management',
    title: 'Management Portal',
    description: 'PropManager administrative and platform operations workspace.',
    badges: ['Superadmin', 'Active Session'],
    icon: Sparkles,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    gradient: 'from-amber-500/10 via-slate-900 to-slate-950',
  };

  const Icon = config.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r ${config.gradient} p-6 md:p-8 shadow-2xl mb-8 transition-all duration-300`}
    >
      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          {/* Category Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border bg-slate-950/80 backdrop-blur-md">
            <span className={`inline-flex items-center gap-1.5 font-bold ${config.badgeColor.split(' ')[0]}`}>
              <Icon size={13} />
              {config.category}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {config.title}
          </h1>

          {/* Description */}
          <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed font-normal">
            {config.description}
          </p>
        </div>

        {/* Badges / Live indicators */}
        <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0">
          {config.badges.map((badge, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold border ${config.badgeColor} backdrop-blur-sm shadow-sm`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

