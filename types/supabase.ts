export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agency_etims_configs: {
        Row: {
          branch_code: string | null
          created_at: string | null
          is_enabled: boolean | null
          kra_pin: string | null
          profile_id: string
          updated_at: string | null
          vscu_serial_number: string | null
        }
        Insert: {
          branch_code?: string | null
          created_at?: string | null
          is_enabled?: boolean | null
          kra_pin?: string | null
          profile_id: string
          updated_at?: string | null
          vscu_serial_number?: string | null
        }
        Update: {
          branch_code?: string | null
          created_at?: string | null
          is_enabled?: boolean | null
          kra_pin?: string | null
          profile_id?: string
          updated_at?: string | null
          vscu_serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_etims_configs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          created_at: string | null
          cu_credit_note_number: string | null
          cu_serial_number: string | null
          description: string | null
          etims_qr_code_url: string | null
          etims_status: Database["public"]["Enums"]["etims_status_type"]
          id: string
          invoice_id: string
          profile_id: string
          reason: Database["public"]["Enums"]["credit_note_reason"]
          vat_amount: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          cu_credit_note_number?: string | null
          cu_serial_number?: string | null
          description?: string | null
          etims_qr_code_url?: string | null
          etims_status?: Database["public"]["Enums"]["etims_status_type"]
          id: string
          invoice_id: string
          profile_id: string
          reason?: Database["public"]["Enums"]["credit_note_reason"]
          vat_amount?: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          cu_credit_note_number?: string | null
          cu_serial_number?: string | null
          description?: string | null
          etims_qr_code_url?: string | null
          etims_status?: Database["public"]["Enums"]["etims_status_type"]
          id?: string
          invoice_id?: string
          profile_id?: string
          reason?: Database["public"]["Enums"]["credit_note_reason"]
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      etims_invoice_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          invoice_id: string | null
          kra_cuin: string | null
          kra_qr_code_url: string | null
          kra_signature: string | null
          profile_id: string | null
          status: string | null
          synced_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          kra_cuin?: string | null
          kra_qr_code_url?: string | null
          kra_signature?: string | null
          profile_id?: string | null
          status?: string | null
          synced_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          kra_cuin?: string | null
          kra_qr_code_url?: string | null
          kra_signature?: string | null
          profile_id?: string | null
          status?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etims_invoice_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_audit_logs: {
        Row: {
          action: string
          actor_name_snapshot: string
          actor_profile_id: string
          changed_fields: Json
          created_at: string
          id: string
          invoice_id: string
        }
        Insert: {
          action: string
          actor_name_snapshot: string
          actor_profile_id: string
          changed_fields?: Json
          created_at?: string
          id?: string
          invoice_id: string
        }
        Update: {
          action?: string
          actor_name_snapshot?: string
          actor_profile_id?: string
          changed_fields?: Json
          created_at?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_audit_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          item_type: string
          quantity: number
          tax_category: Database["public"]["Enums"]["kra_tax_category"]
          tax_rate: number
          taxable_amount: number
          total_amount: number
          unit_price: number
          vat_amount: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          item_type: string
          quantity?: number
          tax_category?: Database["public"]["Enums"]["kra_tax_category"]
          tax_rate?: number
          taxable_amount: number
          total_amount: number
          unit_price: number
          vat_amount: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          item_type?: string
          quantity?: number
          tax_category?: Database["public"]["Enums"]["kra_tax_category"]
          tax_rate?: number
          taxable_amount?: number
          total_amount?: number
          unit_price?: number
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          balance: number | null
          billing_key: string
          billing_month: string
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string
          cu_invoice_number: string | null
          cu_serial_number: string | null
          currency_code: string
          customer_kra_pin: string | null
          customer_name: string | null
          due_date: string | null
          etims_attempts: number
          etims_error_message: string | null
          etims_qr_code_url: string | null
          etims_request: Json | null
          etims_response: Json | null
          etims_result_code: string | null
          etims_status: Database["public"]["Enums"]["etims_status_type"]
          exempt_amount: number
          garbage_fee: number | null
          grand_total: number
          id: string
          invoice_number: string | null
          invoice_type: string
          issued_at: string | null
          issued_by: string | null
          issuer_profile_id: string | null
          line_items: Json
          non_vat_amount: number
          parking_fee: number | null
          property_id: string | null
          rent_amount: number | null
          status: string | null
          subtotal_amount: number
          tax_summary: Json
          taxable_amount: number
          tenant_id: string | null
          total_amount: number | null
          transmitted_at: string | null
          unit_id: string | null
          vat_amount: number
          water_bill: number | null
        }
        Insert: {
          amount_paid?: number | null
          balance?: number | null
          billing_key?: string
          billing_month: string
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          cu_invoice_number?: string | null
          cu_serial_number?: string | null
          currency_code?: string
          customer_kra_pin?: string | null
          customer_name?: string | null
          due_date?: string | null
          etims_attempts?: number
          etims_error_message?: string | null
          etims_qr_code_url?: string | null
          etims_request?: Json | null
          etims_response?: Json | null
          etims_result_code?: string | null
          etims_status?: Database["public"]["Enums"]["etims_status_type"]
          exempt_amount?: number
          garbage_fee?: number | null
          grand_total?: number
          id?: string
          invoice_number?: string | null
          invoice_type?: string
          issued_at?: string | null
          issued_by?: string | null
          issuer_profile_id?: string | null
          line_items?: Json
          non_vat_amount?: number
          parking_fee?: number | null
          property_id?: string | null
          rent_amount?: number | null
          status?: string | null
          subtotal_amount?: number
          tax_summary?: Json
          taxable_amount?: number
          tenant_id?: string | null
          total_amount?: number | null
          transmitted_at?: string | null
          unit_id?: string | null
          vat_amount?: number
          water_bill?: number | null
        }
        Update: {
          amount_paid?: number | null
          balance?: number | null
          billing_key?: string
          billing_month?: string
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          cu_invoice_number?: string | null
          cu_serial_number?: string | null
          currency_code?: string
          customer_kra_pin?: string | null
          customer_name?: string | null
          due_date?: string | null
          etims_attempts?: number
          etims_error_message?: string | null
          etims_qr_code_url?: string | null
          etims_request?: Json | null
          etims_response?: Json | null
          etims_result_code?: string | null
          etims_status?: Database["public"]["Enums"]["etims_status_type"]
          exempt_amount?: number
          garbage_fee?: number | null
          grand_total?: number
          id?: string
          invoice_number?: string | null
          invoice_type?: string
          issued_at?: string | null
          issued_by?: string | null
          issuer_profile_id?: string | null
          line_items?: Json
          non_vat_amount?: number
          parking_fee?: number | null
          property_id?: string | null
          rent_amount?: number | null
          status?: string | null
          subtotal_amount?: number
          tax_summary?: Json
          taxable_amount?: number
          tenant_id?: string | null
          total_amount?: number | null
          transmitted_at?: string | null
          unit_id?: string | null
          vat_amount?: number
          water_bill?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_issuer_profile_id_fkey"
            columns: ["issuer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          created_at: string | null
          current_reading: number
          id: string
          previous_reading: number
          reading_date: string
          recorded_by: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          current_reading: number
          id?: string
          previous_reading?: number
          reading_date?: string
          recorded_by?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string | null
          current_reading?: number
          id?: string
          previous_reading?: number
          reading_date?: string
          recorded_by?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          invoice_id: string | null
          mpesa_code: string
          payer_phone: string
          payment_date: string
          property_id: string | null
          receipt_url: string | null
          tenant_id: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          mpesa_code: string
          payer_phone: string
          payment_date?: string
          property_id?: string | null
          receipt_url?: string | null
          tenant_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          mpesa_code?: string
          payer_phone?: string
          payment_date?: string
          property_id?: string | null
          receipt_url?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          must_change_password: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          must_change_password?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          must_change_password?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          agent_id: string | null
          caretaker_id: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          manager_id: string | null
          name: string
          owner_id: string | null
          property_manager_id: string | null
          water_rate_per_unit: number
        }
        Insert: {
          agent_id?: string | null
          caretaker_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          manager_id?: string | null
          name: string
          owner_id?: string | null
          property_manager_id?: string | null
          water_rate_per_unit?: number
        }
        Update: {
          agent_id?: string | null
          caretaker_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          manager_id?: string | null
          name?: string
          owner_id?: string | null
          property_manager_id?: string | null
          water_rate_per_unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_caretaker_id_fkey"
            columns: ["caretaker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_property_manager_id_fkey"
            columns: ["property_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_change_audit_logs: {
        Row: {
          action: string
          actor_name_snapshot: string
          actor_profile_id: string
          changed_fields: Json
          created_at: string
          id: string
          property_id: string | null
          unit_id: string | null
        }
        Insert: {
          action?: string
          actor_name_snapshot: string
          actor_profile_id: string
          changed_fields?: Json
          created_at?: string
          id?: string
          property_id?: string | null
          unit_id?: string | null
        }
        Update: {
          action?: string
          actor_name_snapshot?: string
          actor_profile_id?: string
          changed_fields?: Json
          created_at?: string
          id?: string
          property_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_change_audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_change_audit_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_change_audit_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      property_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          property_ids: string[]
          role: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          property_ids: string[]
          role?: string
          status?: string
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          property_ids?: string[]
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_utility_types: {
        Row: {
          billing_method: string
          code: string
          created_at: string
          created_by: string | null
          default_amount: number | null
          default_tax_treatment: Database["public"]["Enums"]["kra_tax_category"]
          default_vat_rate: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          property_id: string
          updated_at: string
        }
        Insert: {
          billing_method?: string
          code: string
          created_at?: string
          created_by?: string | null
          default_amount?: number | null
          default_tax_treatment?: Database["public"]["Enums"]["kra_tax_category"]
          default_vat_rate?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          property_id: string
          updated_at?: string
        }
        Update: {
          billing_method?: string
          code?: string
          created_at?: string
          created_by?: string | null
          default_amount?: number | null
          default_tax_treatment?: Database["public"]["Enums"]["kra_tax_category"]
          default_vat_rate?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_utility_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_utility_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_unassigned_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          matched_profile_id: string | null
          notes: string | null
          payment_method: string
          sender_name: string | null
          sender_phone: string | null
          status: string
          transaction_code: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          matched_profile_id?: string | null
          notes?: string | null
          payment_method?: string
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
          transaction_code: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          matched_profile_id?: string | null
          notes?: string | null
          payment_method?: string
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
          transaction_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_unassigned_payments_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          due_date: string
          id: string
          property_manager_id: string | null
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          property_manager_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          property_manager_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_property_manager_id_fkey"
            columns: ["property_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount_paid: number
          id: string
          invoice_id: string | null
          paid_at: string | null
          payment_method: string
          property_manager_id: string | null
          transaction_reference: string
        }
        Insert: {
          amount_paid: number
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          payment_method?: string
          property_manager_id?: string | null
          transaction_reference: string
        }
        Update: {
          amount_paid?: number
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          payment_method?: string
          property_manager_id?: string | null
          transaction_reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "subscription_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_property_manager_id_fkey"
            columns: ["property_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          entity_type: Database["public"]["Enums"]["tenant_entity_type"]
          id: string
          kra_pin: string | null
          lease_end: string | null
          lease_start: string | null
          profile_id: string | null
          property_id: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          entity_type?: Database["public"]["Enums"]["tenant_entity_type"]
          id?: string
          kra_pin?: string | null
          lease_end?: string | null
          lease_start?: string | null
          profile_id?: string | null
          property_id?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          entity_type?: Database["public"]["Enums"]["tenant_entity_type"]
          id?: string
          kra_pin?: string | null
          lease_end?: string | null
          lease_start?: string | null
          profile_id?: string | null
          property_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unassigned_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invalid_account_ref: string | null
          mpesa_code: string
          payer_name: string | null
          payer_phone: string
          resolved_by: string | null
          resolved_invoice_id: string | null
          resolved_tenant_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invalid_account_ref?: string | null
          mpesa_code: string
          payer_name?: string | null
          payer_phone: string
          resolved_by?: string | null
          resolved_invoice_id?: string | null
          resolved_tenant_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invalid_account_ref?: string | null
          mpesa_code?: string
          payer_name?: string | null
          payer_phone?: string
          resolved_by?: string | null
          resolved_invoice_id?: string | null
          resolved_tenant_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unassigned_payments_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unassigned_payments_resolved_invoice_id_fkey"
            columns: ["resolved_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unassigned_payments_resolved_tenant_id_fkey"
            columns: ["resolved_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_utility_charges: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          is_active: boolean
          rate_per_unit: number | null
          tax_treatment: Database["public"]["Enums"]["kra_tax_category"] | null
          unit_id: string
          updated_at: string
          utility_type_id: string
          vat_rate: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          rate_per_unit?: number | null
          tax_treatment?: Database["public"]["Enums"]["kra_tax_category"] | null
          unit_id: string
          updated_at?: string
          utility_type_id: string
          vat_rate?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          rate_per_unit?: number | null
          tax_treatment?: Database["public"]["Enums"]["kra_tax_category"] | null
          unit_id?: string
          updated_at?: string
          utility_type_id?: string
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_utility_charges_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_utility_charges_utility_type_id_fkey"
            columns: ["utility_type_id"]
            isOneToOne: false
            referencedRelation: "property_utility_types"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string | null
          deposit_fee: number
          garbage_fee: number
          id: string
          is_occupied: boolean | null
          parking_fee: number
          property_id: string
          rent_amount: number
          unit_number: string
          use_type: string
          vat_rate: number
          vat_treatment: Database["public"]["Enums"]["kra_tax_category"]
          water_fee: number
        }
        Insert: {
          created_at?: string | null
          deposit_fee?: number
          garbage_fee?: number
          id?: string
          is_occupied?: boolean | null
          parking_fee?: number
          property_id: string
          rent_amount?: number
          unit_number: string
          use_type?: string
          vat_rate?: number
          vat_treatment?: Database["public"]["Enums"]["kra_tax_category"]
          water_fee?: number
        }
        Update: {
          created_at?: string | null
          deposit_fee?: number
          garbage_fee?: number
          id?: string
          is_occupied?: boolean | null
          parking_fee?: number
          property_id?: string
          rent_amount?: number
          unit_number?: string
          use_type?: string
          vat_rate?: number
          vat_treatment?: Database["public"]["Enums"]["kra_tax_category"]
          water_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      demo_login: { Args: { login_email: string }; Returns: Json }
      generate_tenant_invoice:
        | {
            Args: {
              p_current_water_reading: number
              p_due_date: string
              p_issued_by: string
              p_tenant_id: string
              p_unit_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_billing_month: string
              p_current_water_reading: number
              p_due_date: string
              p_garbage_fee?: number
              p_parking_fee?: number
              p_previous_water_reading: number
              p_unit_id: string
            }
            Returns: string
          }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      process_mpesa_payment: {
        Args: {
          p_account_reference: string
          p_amount: number
          p_mpesa_code: string
          p_phone_number: string
          p_raw_payload?: Json
        }
        Returns: Json
      }
      reassign_unassigned_payment: {
        Args: {
          p_notes?: string
          p_target_invoice_id: string
          p_unassigned_id: string
        }
        Returns: Json
      }
      seed_demo_user: {
        Args: {
          p_email: string
          p_full_name: string
          p_password: string
          p_role: string
        }
        Returns: undefined
      }
    }
    Enums: {
      credit_note_reason:
        | "OVERCHARGE"
        | "CANCELLATION"
        | "LEASE_TERMINATION"
        | "SERVICE_DISPUTE"
      etims_status_type: "draft" | "pending_transmission" | "signed" | "failed"
      invoice_status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
      kra_tax_category:
        | "A_EXEMPT"
        | "B_STANDARD_16"
        | "C_ZERO_RATED"
        | "E_NON_VAT"
      tenant_entity_type: "individual" | "commercial_b2b"
      user_role:
        | "SUPER_ADMIN"
        | "LANDLORD"
        | "PROPERTY_MANAGER"
        | "CARETAKER"
        | "TENANT"
        | "super_admin"
        | "property_manager"
        | "admin"
        | "caretaker"
        | "tenant"
        | "owner"
        | "developer"
        | "accountant"
        | "marketer"
        | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      credit_note_reason: [
        "OVERCHARGE",
        "CANCELLATION",
        "LEASE_TERMINATION",
        "SERVICE_DISPUTE",
      ],
      etims_status_type: ["draft", "pending_transmission", "signed", "failed"],
      invoice_status: ["PENDING", "PAID", "OVERDUE", "CANCELLED"],
      kra_tax_category: [
        "A_EXEMPT",
        "B_STANDARD_16",
        "C_ZERO_RATED",
        "E_NON_VAT",
      ],
      tenant_entity_type: ["individual", "commercial_b2b"],
      user_role: [
        "SUPER_ADMIN",
        "LANDLORD",
        "PROPERTY_MANAGER",
        "CARETAKER",
        "TENANT",
        "super_admin",
        "property_manager",
        "admin",
        "caretaker",
        "tenant",
        "owner",
        "developer",
        "accountant",
        "marketer",
        "agent",
      ],
    },
  },
} as const
