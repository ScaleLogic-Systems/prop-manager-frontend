// app/tenant/types.ts
export type TenantTab = 'dashboard' | 'payments' | 'manual-payment' | 'settings';

export interface StaffContact {
  name: string;
  phone: string;
  role: string;
}

export interface TenantProfile {
  full_name: string;
  property_name: string;
  unit_number: string;
  caretaker_name?: string;
  caretaker_phone?: string;
  contacts?: StaffContact[];
}

export interface MeterReadingInfo {
  previous_meter_reading: number;
  current_meter_reading: number;
  units_consumed: number;
  billing_month: string;
}

export interface TenantInvoice {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'under_review' | 'partial';
  meter_info?: MeterReadingInfo;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  description: string;
  amount: number;
  date: string;
  method: string;
  status: 'completed' | 'under_review' | 'rejected';
}