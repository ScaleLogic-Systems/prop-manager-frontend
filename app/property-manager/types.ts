export type ManagerTab = 
  | 'dashboard' 
  | 'generate-invoice'
  | 'add-property' 
  | 'users' // NEW
  | 'tenants' 
  | 'unassigned-payments' 
  | 'subscription';

export interface ManagerProfile {
  full_name: string;
}

export interface PropertyFeeStructure {
  propertyName: string;
  unitsCount: number;
  rentPerUnit: number;
  garbageFee: number;
  parkingFee: number;
  waterFeePerMeter: number;
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
  sender_name: string;
  phone: string;
  reference: string;
  amount: number;
  date: string;
}

export interface SubscriptionInvoice {
  id: string;
  description: string;
  due_date: string;
  amount: number;
  status: 'paid' | 'unpaid';
  paid_date?: string;
}

// --- NEW USER MANAGEMENT TYPES ---
export type UserRole = 'caretaker' | 'tenant';

export interface PropertyOption {
  id: string;
  name: string;
  units: string[]; // List of available unit numbers (e.g. ['Apt 1A', 'Apt 1B', 'Apt 2A'])
}

export interface ManagedUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  property_id: string;
  property_name: string;
  unit_number?: string; // Optional for Caretakers
  status: 'pending_verification' | 'active';
  invited_at: string;
}