// app/accountant/types.ts

export type AccountantTab = 
  | 'overview' 
  | 'rent-roll' 
  | 'invoices' 
  | 'reconciliation' 
  | 'payouts'
  | 'settings';

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';
export type PaymentMethod = 'mpesa' | 'bank_transfer' | 'cash' | 'cheque';

export interface RentRollEntry {
  id: string;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  monthly_rent: number;
  water_fee: number;
  garbage_fee: number;
  total_due: number;
  amount_paid: number;
  balance: number;
  status: PaymentStatus;
  due_date: string;
}

export interface PaymentTransaction {
  id: string;
  tenant_id: string;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_code: string;
  paid_at: string;
  status: 'reconciled' | 'unassigned' | 'flagged';
}

export interface OwnerPayout {
  id: string;
  owner_id: string;
  owner_name: string;
  property_name: string;
  gross_collected: number;
  management_fee: number;
  expenses: number;
  net_payout: number;
  status: 'pending' | 'approved' | 'processed';
  created_at: string;
}