// app/marketer/types.ts

export type MarketerTab = 'dashboard' | 'add-clients' | 'add-properties' | 'add-user' | 'settings';

export type ClientRole = 'property_owner' | 'property_manager';

export type UserAssignedRole = 'tenant' | 'caretaker' | 'staff';

export interface MarketerClient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: ClientRole;
  status: 'active' | 'pending';
  created_at?: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  rent_amount: number;
  garbage_fee: number | null;
  parking_fee: number | null;
  water_fee: number | null;
  is_occupied: boolean;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  created_by?: string;
  client_id?: string;
  units: Unit[];
}

export interface AssignedUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserAssignedRole;
  client_id: string;
  client_name?: string;
  property_id: string;
  property_name?: string;
  unit_id?: string | null;
  unit_number?: string | null;
  created_at: string;
}