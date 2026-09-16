export type TenantEntityType = 'individual' | 'commercial_b2b';
export type EtimsStatus = 'draft' | 'pending_transmission' | 'signed' | 'failed';

export interface Tenant {
  id: string;
  organization_id: string;
  property_id: string;
  unit_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  kra_pin?: string | null;
  entity_type: TenantEntityType;
  created_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  organization_id: string;
  amount: number;
  due_date: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  
  // KRA eTIMS Compliance Fields
  cu_serial_number?: string | null;
  cu_invoice_number?: string | null;
  etims_qr_code_url?: string | null;
  etims_status: EtimsStatus;
  etims_error_message?: string | null;
  created_at: string;
}