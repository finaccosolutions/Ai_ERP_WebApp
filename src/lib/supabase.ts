import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
          address: any;
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
          address?: any;
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
          address?: any;
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
    };
  };
}