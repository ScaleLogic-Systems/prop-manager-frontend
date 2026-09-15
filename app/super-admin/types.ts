// app/super-admin/types.ts

export type SuperadminTab = 
  // Business & SaaS Operations
  | 'dashboard'
  | 'subscribers'
  | 'add-users'
  | 'generate-invoice'
  | 'saas-invoicing'
  // Reconciliation Hubs
  | 'payments-overview'
  | 'unassigned-payments'
  | 'unassigned-payments-hub'
  | 'saas-unassigned-payments'
  | 'unassigned-saas-payments'
  | 'saas-b2b-unassigned'
  | 'tenant-unassigned-payments'
  | 'unassigned-tenant-payments'
  // Technical & Developer Controls
  | 'system-control'
  | 'cron-lockdown'
  | 'webhook-debugger'
  | 'webhook-dlq'
  | 'impersonator'
  | 'tenant-impersonation'
  // Governance & Feature Control
  | 'audit-logs'
  | 'feature-flags';

export type SuperAdminTab = SuperadminTab;

export interface SaaSPayment {
  id: string;
  amount: number;
  sender_name?: string;
  sender_phone?: string;
  transaction_code?: string;
  payment_method?: string;
  mpesa_code?: string;
  phone_number?: string;
  payer_name?: string;
  agency_id?: string;
  agency_name?: string;
  status: 'unassigned' | 'matched' | 'resolved' | 'pending' | 'UNASSIGNED' | string;
  created_at?: string;
  raw_payload?: Record<string, any>;
}

export interface TenantPayment {
  id: string;
  amount: number;
  sender_name?: string;
  sender_phone?: string;
  transaction_code?: string;
  payment_method?: string;
  mpesa_code?: string;
  phone_number?: string;
  tenant_name?: string;
  tenant_full_name?: string;
  property_name?: string;
  unit_number?: string;
  unit_name?: string;
  payment_date?: string;
  status: 'unassigned' | 'matched' | 'resolved' | 'pending' | 'UNASSIGNED' | string;
  created_at?: string;
  raw_payload?: Record<string, any>;
}

export interface InvoiceMetrics {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalCount?: number;
  paidCount?: number;
  pendingCount?: number;
  overdueCount?: number;
  partialAmount?: number;
}

export interface Subscriber {
  id: string;
  agency_name: string;
  contact_email: string;
  phone: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'suspended' | 'past_due';
  created_at?: string;
}

export interface FailedWebhook {
  id: string;
  source: 'mpesa_c2b' | 'mpesa_stk' | 'whatsapp' | 'sms';
  endpoint: string;
  payload: Record<string, any>;
  error_message: string;
  retry_count: number;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_email: string;
  action: string;
  target_organization: string;
  ip_address: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  min_tier: 'starter' | 'growth' | 'enterprise';
  enabled_globally: boolean;
}