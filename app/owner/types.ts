// app/owner/types.ts

export type OwnerTab =
  | 'dashboard'
  | 'generate-invoice'
  | 'meter-reading'
  | 'add-property'
  | 'users'
  | 'tenants'
  | 'unassigned-payments'
  | 'subscription'
  | 'support'
  | 'settings';

export type UserRole = 'tenant' | 'caretaker' | 'owner' | 'property_manager';

export interface PropertyOption {
  id: string;
  name: string;
  units?: string[];
}

export interface ManagedUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  property_id?: string;
  property_name?: string;
  unit_id?: string;      // 👈 Added this missing field
  unit_number?: string;
  status: 'active' | 'pending';
  invited_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  description?: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  date: string;
  due_date?: string;
  pdf_url?: string;
}

export interface TenantPaymentHistory {
  id: string;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  date: string;
}

export interface UnassignedPayment {
  id: string;
  sender_name?: string;
  phone?: string;
  reference: string;
  amount: number;
  date: string;
}