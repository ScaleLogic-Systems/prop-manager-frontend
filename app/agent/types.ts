// app/agent/types.ts
export type AgentTab = 
  | 'dashboard' 
  | 'meter-readings' 
  | 'generate-invoice' 
  | 'add-tenant' 
  | 'tenants' 
  | 'payments' 
  | 'unassigned-payments' 
  | 'support' 
  | 'settings';

export interface AgentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  assigned_properties_count?: number;
}

export interface DashboardMetrics {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalCollected: number;
  pendingReviewPayments: number;
  activeTenantsCount: number;
}

export interface TenantRecord {
  id: string;
  tenant_name: string;
  email: string;
  phone: string;
  unit_id: string;
  unit_number: string;
  property_id: string;
  property_name: string;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  tenant_name: string;
  unit_number: string;
  property_name: string;
  amount: number;
  method: string;
  date: string;
  status: 'completed' | 'under_review' | 'rejected';
}