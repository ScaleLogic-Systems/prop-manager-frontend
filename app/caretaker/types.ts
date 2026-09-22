// app/caretaker/types.ts

export type CaretakerTab = 
  | 'dashboard' 
  | 'meter'
  | 'meter-reading' 
  | 'generate-invoice'
  | 'add-tenant'
  | 'tenants' 
  | 'payments' 
  | 'unassigned-payments'
  | 'requests'
  | 'support'
  | 'settings';

export interface CaretakerProfile {
  id?: string;
  full_name: string;
  assigned_property_id?: string;
  assigned_property_name: string;
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

export interface UnitMeterData {
  unit_id: string;
  unit_number: string;
  tenant_name: string;
  previous_meter_reading: number;
  water_rate_per_unit: number; // e.g. $5 per unit
}

export interface WaterInvoice {
  id: string;
  unit_number: string;
  tenant_name: string;
  previous_reading: number;
  current_reading: number;
  units_consumed: number;
  rate_per_unit: number;
  total_amount: number;
  created_at: string;
  status: 'sent' | 'pending';
}

export interface TenantInvoiceRecord {
  id: string;
  tenant_name: string;
  unit_number: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  due_date: string;
  paid_amount?: number;
}