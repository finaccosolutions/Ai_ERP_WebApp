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
          settings: any;
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
          settings?: any;
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
          settings?: any;
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
          } | null; // Explicitly define address structure
          shipping_address: {
            street1?: string;
            street2?: string;
            city?: string;
            state?: string;
            country?: string;
            zipCode?: string;
          } | null; // Explicitly define address structure
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
    };
  };
}