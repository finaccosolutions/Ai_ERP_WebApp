// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add these console logs
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          country: string;
          currency: string;
          fiscal_year_start: string;
          fiscal_year_end: string;
          timezone: string;
          logo: string | null;
          tax_config: any;
          address: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          }; // Explicitly define address structure
          contact_info: any;
          settings: {
            displayName?: string;
            legalName?: string;
            industry?: string;
            businessType?: string; // NEW: Added businessType
            legalStructure?: string; // NEW: Added legalStructure
            registrationNo?: string;
            languagePreference?: string;
            decimalPlaces?: number;
            multiCurrencySupport?: boolean;
            autoRounding?: boolean;
            dateFormat?: string;
            batchTracking?: boolean;
            costCenterAllocation?: boolean;
            multiUserAccess?: boolean;
            aiSuggestions?: boolean;
            enablePassword?: boolean;
            password?: string;
            splitByPeriod?: boolean;
            barcodeSupport?: boolean;
            autoVoucherCreationAI?: boolean;
            companyType?: string; // Renamed to legalStructure
            employeeCount?: string;
            annualRevenue?: string;
            inventoryTracking?: boolean;
            companyUsername?: string;
            bankDetails?: { // NEW: Added bankDetails
              bankName?: string;
              accountNumber?: string;
              ifscCode?: string;
              swiftCode?: string;
              accountHolderName?: string; // NEW
              currency?: string; // NEW
            };
          };
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          country?: string;
          currency?: string;
          fiscal_year_start?: string;
          fiscal_year_end?: string;
          timezone?: string;
          logo?: string | null;
          tax_config?: any;
          address?: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          };
          contact_info?: any;
          settings?: {
            displayName?: string;
            legalName?: string;
            industry?: string;
            businessType?: string; // NEW: Added businessType
            legalStructure?: string; // NEW: Added legalStructure
            registrationNo?: string;
            languagePreference?: string;
            decimalPlaces?: number;
            multiCurrencySupport?: boolean;
            autoRounding?: boolean;
            dateFormat?: string;
            batchTracking?: boolean;
            costCenterAllocation?: boolean;
            multiUserAccess?: boolean;
            aiSuggestions?: boolean;
            enablePassword?: boolean;
            password?: string;
            splitByPeriod?: boolean;
            barcodeSupport?: boolean;
            autoVoucherCreationAI?: boolean;
            companyType?: string; // Renamed to legalStructure
            employeeCount?: string;
            annualRevenue?: string;
            inventoryTracking?: boolean;
            companyUsername?: string;
            bankDetails?: { // NEW: Added bankDetails
              bankName?: string;
              accountNumber?: string;
              ifscCode?: string;
              swiftCode?: string;
              accountHolderName?: string; // NEW
              currency?: string; // NEW
            };
          };
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          country?: string;
          currency?: string;
          fiscal_year_start?: string;
          fiscal_year_end?: string;
          timezone?: string;
          logo?: string | null;
          tax_config?: any;
          address?: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          };
          contact_info?: any;
          settings?: {
            displayName?: string;
            legalName?: string;
            industry?: string;
            businessType?: string; // NEW: Added businessType
            legalStructure?: string; // NEW: Added legalStructure
            registrationNo?: string;
            languagePreference?: string;
            decimalPlaces?: number;
            multiCurrencySupport?: boolean;
            autoRounding?: boolean;
            dateFormat?: string;
            batchTracking?: boolean;
            costCenterAllocation?: boolean;
            multiUserAccess?: boolean;
            aiSuggestions?: boolean;
            enablePassword?: boolean;
            password?: string;
            splitByPeriod?: boolean;
            barcodeSupport?: boolean;
            autoVoucherCreationAI?: boolean;
            companyType?: string; // Renamed to legalStructure
            employeeCount?: string;
            annualRevenue?: string;
            inventoryTracking?: boolean;
            companyUsername?: string;
            bankDetails?: { // NEW: Added bankDetails
              bankName?: string;
              accountNumber?: string;
              ifscCode?: string;
              swiftCode?: string;
              accountHolderName?: string; // NEW
              currency?: string; // NEW
            };
          };
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      periods: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          is_closed: boolean;
          period_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          is_closed?: boolean;
          period_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          is_closed?: boolean;
          period_type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          department: string | null;
          designation: string | null;
          employee_id: string | null;
          preferences: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          department?: string | null;
          designation?: string | null;
          employee_id?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          department?: string | null;
          designation?: string | null;
          employee_id?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      users_companies: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          role_id: string | null;
          is_active: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          role_id?: string | null;
          is_active?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          role_id?: string | null;
          is_active?: boolean;
          joined_at?: string;
        };
      };
      sales_invoices: {
        Row: {
          id: string;
          company_id: string;
          invoice_no: string;
          customer_id: string | null;
          order_id: string | null;
          invoice_date: string;
          due_date: string | null;
          status: string;
          reference_no: string | null;
          terms_and_conditions: string | null;
          notes: string | null;
          subtotal: number | null;
          total_tax: number | null;
          total_amount: number | null;
          paid_amount: number | null;
          outstanding_amount: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          // New fields for tax and other ledger entries
          tax_details: any | null; // JSONB to store dynamic tax rows
          other_ledger_entries: any | null; // JSONB to store other ledger entries
          project_id: string | null; // NEW: Added project_id
        };
        Insert: {
          id?: string;
          company_id: string;
          invoice_no: string;
          customer_id?: string | null;
          order_id?: string | null;
          invoice_date?: string;
          due_date?: string | null;
          status?: string;
          reference_no?: string | null;
          terms_and_conditions?: string | null;
          notes?: string | null;
          subtotal?: number | null;
          total_tax?: number | null;
          total_amount?: number | null;
          paid_amount?: number | null;
          outstanding_amount?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          tax_details?: any | null;
          other_ledger_entries?: any | null;
          project_id?: string | null; // NEW: Added project_id
        };
        Update: {
          id?: string;
          company_id?: string;
          invoice_no?: string;
          customer_id?: string | null;
          order_id?: string | null;
          invoice_date?: string;
          due_date?: string | null;
          status?: string;
          reference_no?: string | null;
          terms_and_conditions?: string | null;
          notes?: string | null;
          subtotal?: number | null;
          total_tax?: number | null;
          total_amount?: number | null;
          paid_amount?: number | null;
          outstanding_amount?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          tax_details?: any | null;
          other_ledger_entries?: any | null;
          project_id?: string | null; // NEW: Added project_id
        };
      };
      sales_invoice_items: {
        Row: {
          id: string;
          invoice_id: string | null;
          item_code: string;
          item_name: string;
          description: string | null;
          quantity: number;
          unit: string;
          rate: number;
          amount: number;
          tax_rate: number | null;
          tax_amount: number | null;
          line_total: number;
          created_at: string;
          hsn_code: string | null; // Added hsn_code
          discount_percent: number | null; // NEW
          discount_amount: number | null; // NEW
        };
        Insert: {
          id?: string;
          invoice_id?: string | null;
          item_code: string;
          item_name: string;
          description?: string | null;
          quantity?: number;
          unit?: string;
          rate?: number;
          amount?: number;
          tax_rate?: number | null;
          tax_amount?: number | null;
          line_total?: number;
          created_at?: string;
          hsn_code?: string | null; // Added hsn_code
          discount_percent?: number | null; // NEW
          discount_amount?: number | null; // NEW
        };
        Update: {
          id?: string;
          invoice_id?: string | null;
          item_code?: string;
          item_name?: string;
          description?: string | null;
          quantity?: number;
          unit?: string;
          rate?: number;
          amount?: number;
          tax_rate?: number | null;
          tax_amount?: number | null;
          line_total?: number;
          created_at?: string;
          hsn_code?: string | null; // Added hsn_code
          discount_percent?: number | null; // NEW
          discount_amount?: number | null; // NEW
        };
      };
      customers: {
        Row: {
          id: string;
          company_id: string | null;
          customer_code: string;
          name: string;
          customer_type: string | null;
          email: string | null;
          phone: string | null;
          mobile: string | null;
          website: string | null;
          tax_id: string | null;
          pan: string | null;
          gstin: string | null;
          billing_address: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          } | null;
          shipping_address: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          } | null;
          credit_limit: number | null;
          credit_days: number | null;
          price_list_id: string | null;
          territory: string | null;
          payment_terms: string | null;
          is_active: boolean | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          customer_group_id: string | null;
          // NEW: Banking Details
          bank_name: string | null;
          account_number: string | null;
          ifsc_code: string | null;
          // NEW: Tax Registration Type
          tax_registration_type: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          customer_code: string;
          name: string;
          customer_type?: string | null;
          email?: string | null;
          phone?: string | null;
          mobile?: string | null;
          website?: string | null;
          tax_id?: string | null;
          pan?: string | null;
          gstin?: string | null;
          billing_address?: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          } | null;
          shipping_address?: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          } | null;
          credit_limit?: number | null;
          credit_days?: number | null;
          price_list_id?: string | null;
          territory?: string | null;
          payment_terms?: string | null;
          is_active?: boolean | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          customer_group_id?: string | null;
          // NEW: Banking Details
          bank_name?: string | null;
          account_number?: string | null;
          ifsc_code?: string | null;
          // NEW: Tax Registration Type
          tax_registration_type?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          customer_code?: string;
          name?: string;
          customer_type?: string | null;
          email?: string | null;
          phone?: string | null;
          mobile?: string | null;
          website?: string | null;
          tax_id?: string | null;
          pan?: string | null;
          gstin?: string | null;
          billing_address?: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          } | null;
          shipping_address?: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          } | null;
          credit_limit?: number | null;
          credit_days?: number | null;
          price_list_id?: string | null;
          territory?: string | null;
          payment_terms?: string | null;
          is_active?: boolean | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          customer_group_id?: string | null;
          // NEW: Banking Details
          bank_name?: string | null;
          account_number?: string | null;
          ifsc_code?: string | null;
          // NEW: Tax Registration Type
          tax_registration_type?: string | null;
        };
      };
      chart_of_accounts: {
        Row: {
          id: string;
          company_id: string | null;
          account_code: string;
          account_name: string;
          account_type: string;
          account_group: string;
          parent_account_id: string | null;
          is_group: boolean | null;
          is_active: boolean | null;
          opening_balance: number | null;
          balance_type: string | null;
          tax_rate: number | null;
          is_default: boolean | null;
          comment: string | null; // NEW: Added comment column
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          account_code: string;
          account_name: string;
          account_type: string;
          account_group: string;
          parent_account_id?: string | null;
          is_group?: boolean | null;
          is_active?: boolean | null;
          opening_balance?: number | null;
          balance_type?: string | null;
          tax_rate?: number | null;
          is_default?: boolean | null;
          comment?: string | null; // NEW: Added comment column
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          account_code?: string;
          account_name?: string;
          account_type?: string;
          account_group?: string;
          parent_account_id?: string | null;
          is_group?: boolean | null;
          is_active?: boolean | null;
          opening_balance?: number | null;
          balance_type?: string | null;
          tax_rate?: number | null;
          is_default?: boolean | null;
          comment?: string | null; // NEW: Added comment column
          created_at?: string;
          updated_at?: string;
        };
      };
      items: { // Updated items table type
        Row: {
          id: string;
          company_id: string | null;
          item_code: string;
          item_name: string;
          description: string | null;
          category_id: string | null;
          unit_id: string | null;
          item_type: string | null;
          is_sales_item: boolean | null;
          is_purchase_item: boolean | null;
          is_stock_item: boolean | null;
          has_batch: boolean | null;
          has_serial: boolean | null;
          has_expiry: boolean | null;
          standard_rate: number | null;
          purchase_rate: number | null;
          min_order_qty: number | null;
          reorder_level: number | null;
          max_level: number | null;
          lead_time_days: number | null;
          weight: number | null;
          weight_unit: string | null;
          barcode: string | null;
          hsn_code: string | null;
          tax_rate: number | null;
          image_url: string | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
          // custom_attributes: any | null; // Removed custom_attributes
          item_group_id: string | null; // NEW: Added item_group_id
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          item_code: string;
          item_name: string;
          description?: string | null;
          category_id?: string | null;
          unit_id?: string | null;
          item_type?: string | null;
          is_sales_item?: boolean | null;
          is_purchase_item?: boolean | null;
          is_stock_item?: boolean | null;
          has_batch?: boolean | null;
          has_serial?: boolean | null;
          has_expiry?: boolean | null;
          standard_rate?: number | null;
          purchase_rate?: number | null;
          min_order_qty?: number | null;
          reorder_level?: number | null;
          max_level?: number | null;
          lead_time_days?: number | null;
          weight?: number | null;
          weight_unit?: string | null;
          barcode?: string | null;
          hsn_code?: string | null;
          tax_rate?: number | null;
          image_url?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
          // custom_attributes?: any | null; // Removed custom_attributes
          item_group_id?: string | null; // NEW: Added item_group_id
        };
        Update: {
          id?: string;
          company_id?: string | null;
          item_code?: string;
          item_name?: string;
          description?: string | null;
          category_id?: string | null;
          unit_id?: string | null;
          item_type?: string | null;
          is_sales_item?: boolean | null;
          is_purchase_item?: boolean | null;
          is_stock_item?: boolean | null;
          has_batch?: boolean | null;
          has_serial?: boolean | null;
          has_expiry?: boolean | null;
          standard_rate?: number | null;
          purchase_rate?: number | null;
          min_order_qty?: number | null;
          reorder_level?: number | null;
          max_level?: number | null;
          lead_time_days?: number | null;
          weight?: number | null;
          weight_unit?: string | null;
          barcode?: string | null;
          hsn_code?: string | null;
          tax_rate?: number | null;
          image_url?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
          // custom_attributes?: any | null; // Removed custom_attributes
          item_group_id?: string | null; // NEW: Added item_group_id
        };
      };
      item_groups: { // NEW: Added item_groups table definition
        Row: {
          id: string;
          company_id: string | null;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: { // EXISTING: Leads table definition
        Row: {
          id: string;
          company_id: string | null;
          lead_name: string;
          company_name: string | null;
          email: string | null;
          phone: string | null;
          mobile: string | null;
          website: string | null;
          lead_source_id: string | null;
          territory_id: string | null;
          status: string | null;
          lead_owner_id: string | null;
          annual_revenue: number | null;
          no_of_employees: number | null;
          industry: string | null;
          address: any | null;
          notes: string | null;
          next_contact_date: string | null;
          converted_customer_id: string | null;
          converted_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          lead_name: string;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          mobile?: string | null;
          website?: string | null;
          lead_source_id?: string | null;
          territory_id?: string | null;
          status?: string | null;
          lead_owner_id?: string | null;
          annual_revenue?: number | null;
          no_of_employees?: number | null;
          industry?: string | null;
          address?: any | null;
          notes?: string | null;
          next_contact_date?: string | null;
          converted_customer_id?: string | null;
          converted_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          lead_name?: string;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          mobile?: string | null;
          website?: string | null;
          lead_source_id?: string | null;
          territory_id?: string | null;
          status?: string | null;
          lead_owner_id?: string | null;
          annual_revenue?: number | null;
          no_of_employees?: number | null;
          industry?: string | null;
          address?: any | null;
          notes?: string | null;
          next_contact_date?: string | null;
          converted_customer_id?: string | null;
          converted_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_sources: { // EXISTING: Lead Sources table definition
        Row: {
          id: string;
          company_id: string | null;
          name: string;
          description: string | null;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          name: string;
          description?: string | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          name?: string;
          description?: string | null;
          is_active?: boolean | null;
          created_at?: string;
        };
      };
      opportunities: { // EXISTING: Opportunities table definition
        Row: {
          id: string;
          company_id: string | null;
          opportunity_name: string;
          customer_id: string | null;
          lead_id: string | null;
          opportunity_owner_id: string | null;
          opportunity_amount: number | null;
          probability: number | null;
          stage: string | null;
          expected_close_date: string | null;
          actual_close_date: string | null;
          next_step: string | null;
          description: string | null;
          competitor: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          opportunity_name: string;
          customer_id?: string | null;
          lead_id?: string | null;
          opportunity_owner_id?: string | null;
          opportunity_amount?: number | null;
          probability?: number | null;
          stage?: string | null;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          next_step?: string | null;
          description?: string | null;
          competitor?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          opportunity_name?: string;
          customer_id?: string | null;
          lead_id?: string | null;
          opportunity_owner_id?: string | null;
          opportunity_amount?: number | null;
          probability?: number | null;
          stage?: string | null;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          next_step?: string | null;
          description?: string | null;
          competitor?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: { // NEW: Projects table definition
        Row: {
          id: string;
          company_id: string | null;
          project_name: string;
          customer_id: string | null;
          start_date: string;
          due_date: string;
          billing_type: string | null;
          assigned_staff_id: string | null;
          status: string | null;
          description: string | null;
          is_recurring: boolean | null;
          recurrence_frequency: string | null;
          recurrence_due_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          reference_no: string | null;
          category_type: string | null;
          expected_value: number | null;
          project_owner_id: string | null;
          progress_percentage: number | null;
          last_recurrence_created_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          project_name: string;
          customer_id?: string | null;
          start_date: string;
          due_date: string;
          billing_type?: string | null;
          assigned_staff_id?: string | null;
          status?: string | null;
          description?: string | null;
          is_recurring?: boolean | null;
          recurrence_frequency?: string | null;
          recurrence_due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          reference_no?: string | null;
          category_type?: string | null;
          expected_value?: number | null;
          project_owner_id?: string | null;
          progress_percentage?: number | null;
          last_recurrence_created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          project_name?: string;
          customer_id?: string | null;
          start_date?: string;
          due_date?: string;
          billing_type?: string | null;
          assigned_staff_id?: string | null;
          status?: string | null;
          description?: string | null;
          is_recurring?: boolean | null;
          recurrence_frequency?: string | null;
          recurrence_due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          reference_no?: string | null;
          category_type?: string | null;
          expected_value?: number | null;
          project_owner_id?: string | null;
          progress_percentage?: number | null;
          last_recurrence_created_at?: string | null;
        };
      };
      tasks: { // NEW: Tasks table definition
        Row: {
          id: string;
          project_id: string | null;
          task_name: string;
          assigned_to_id: string | null;
          status: string | null;
          due_date: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
          start_date: string | null;
          priority: string | null;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          task_name: string;
          assigned_to_id?: string | null;
          status?: string | null;
          due_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          start_date?: string | null;
          priority?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          task_name?: string;
          assigned_to_id?: string | null;
          status?: string | null;
          due_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          start_date?: string | null;
          priority?: string | null;
        };
      };
      time_logs: { // NEW: Time Logs table definition
        Row: {
          id: string;
          task_id: string | null;
          employee_id: string | null;
          start_time: string;
          end_time: string | null;
          duration_minutes: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          employee_id?: string | null;
          start_time: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string | null;
          employee_id?: string | null;
          start_time?: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      activities: { // UPDATED: Activities table definition
        Row: {
          id: string;
          company_id: string | null;
          activity_type: string;
          subject: string;
          description: string | null;
          activity_date: string;
          activity_time: string | null;
          duration_minutes: number | null;
          status: string | null;
          priority: string | null;
          assigned_to_id: string | null;
          reference_type: string | null; // NEW
          reference_id: string | null; // NEW
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          activity_type: string;
          subject: string;
          description?: string | null;
          activity_date?: string;
          activity_time?: string | null;
          duration_minutes?: number | null;
          status?: string | null;
          priority?: string | null;
          assigned_to_id?: string | null;
          reference_type?: string | null; // NEW
          reference_id?: string | null; // NEW
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          activity_type?: string;
          subject?: string;
          description?: string | null;
          activity_date?: string;
          activity_time?: string | null;
          duration_minutes?: number | null;
          status?: string | null;
          priority?: string | null;
          assigned_to_id?: string | null;
          reference_type?: string | null; // NEW
          reference_id?: string | null; // NEW
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchase_invoices: { // NEW: Added purchase_invoices table definition
        Row: {
          id: string;
          company_id: string | null;
          bill_no: string;
          vendor_id: string | null;
          order_id: string | null;
          grn_id: string | null;
          bill_date: string;
          due_date: string | null;
          vendor_invoice_no: string | null;
          vendor_invoice_date: string | null;
          status: string | null;
          notes: string | null;
          subtotal: number | null;
          total_tax: number | null;
          total_amount: number | null;
          paid_amount: number | null;
          outstanding_amount: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          project_id: string | null; // NEW: Added project_id
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          bill_no: string;
          vendor_id?: string | null;
          order_id?: string | null;
          grn_id?: string | null;
          bill_date?: string;
          due_date?: string | null;
          vendor_invoice_no?: string | null;
          vendor_invoice_date?: string | null;
          status?: string | null;
          notes?: string | null;
          subtotal?: number | null;
          total_tax?: number | null;
          total_amount?: number | null;
          paid_amount?: number | null;
          outstanding_amount?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          project_id?: string | null; // NEW: Added project_id
        };
        Update: {
          id?: string;
          company_id?: string | null;
          bill_no?: string;
          vendor_id?: string | null;
          order_id?: string | null;
          grn_id?: string | null;
          bill_date?: string;
          due_date?: string | null;
          vendor_invoice_no?: string | null;
          vendor_invoice_date?: string | null;
          status?: string | null;
          notes?: string | null;
          subtotal?: number | null;
          total_tax?: number | null;
          total_amount?: number | null;
          paid_amount?: number | null;
          outstanding_amount?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          project_id?: string | null; // NEW: Added project_id
        };
      };
      compliance_tasks: { // NEW: Added recurrence fields
        Row: {
          id: string;
          company_id: string | null;
          task_name: string;
          task_type: string;
          description: string | null;
          due_date: string;
          priority: string | null;
          status: string | null;
          assigned_to: string | null;
          completed_by: string | null;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          recurrence_frequency: string | null; // NEW
          recurrence_due_date: string | null; // NEW
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          task_name: string;
          task_type: string;
          description?: string | null;
          due_date: string;
          priority?: string | null;
          status?: string | null;
          assigned_to?: string | null;
          completed_by?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          recurrence_frequency?: string | null; // NEW
          recurrence_due_date?: string | null; // NEW
        };
        Update: {
          id?: string;
          company_id?: string | null;
          task_name?: string;
          task_type?: string;
          description?: string | null;
          due_date?: string;
          priority?: string | null;
          status?: string | null;
          assigned_to?: string | null;
          completed_by?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          recurrence_frequency?: string | null; // NEW
          recurrence_due_date?: string | null; // NEW
        };
      };
      document_attachments: { // NEW: Added document_attachments table definition
        Row: {
          id: string;
          company_id: string | null;
          reference_type: string;
          reference_id: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          description: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          reference_type: string;
          reference_id: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          description?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          reference_type?: string;
          reference_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          description?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      project_team_members: {
        Row: {
          id: string;
          project_id: string;
          employee_id: string;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          employee_id: string;
          role?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          employee_id?: string;
          role?: string | null;
          created_at?: string;
        };
      };
      project_comments: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          comment_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          comment_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          comment_text?: string;
          created_at?: string;
        };
      };
      project_activity_log: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          activity_type: string;
          description: string;
          old_value: any | null;
          new_value: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          activity_type: string;
          description: string;
          old_value?: any | null;
          new_value?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string | null;
          activity_type?: string;
          description?: string;
          old_value?: any | null;
          new_value?: any | null;
          created_at?: string;
        };
      };
    };
  };
}
