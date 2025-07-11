/*
  # Accounting Module Tables

  1. New Tables
    - `chart_of_accounts` - Chart of accounts
    - `journal_entries` - Journal entries
    - `journal_entry_items` - Journal entry line items
    - `payment_entries` - Payment entries
    - `cost_centers` - Cost center master
    - `fixed_assets` - Fixed asset register
    - `depreciation_schedules` - Asset depreciation

  2. Security
    - Enable RLS on all tables
    - Company-based data isolation
*/

-- Chart of accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  account_code text NOT NULL,
  account_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  account_group text NOT NULL,
  parent_account_id uuid REFERENCES chart_of_accounts(id),
  is_group boolean DEFAULT false,
  is_active boolean DEFAULT true,
  opening_balance decimal(15,2) DEFAULT 0,
  balance_type text DEFAULT 'debit' CHECK (balance_type IN ('debit', 'credit')),
  tax_rate decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, account_code)
);

-- Cost centers
CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  cost_center_code text NOT NULL,
  cost_center_name text NOT NULL,
  parent_cost_center_id uuid REFERENCES cost_centers(id),
  is_group boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, cost_center_code)
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  entry_no text NOT NULL,
  posting_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_type text DEFAULT 'journal' CHECK (entry_type IN ('journal', 'opening', 'closing', 'adjustment')),
  reference_type text,
  reference_id uuid,
  reference_no text,
  user_remark text,
  total_debit decimal(15,2) DEFAULT 0,
  total_credit decimal(15,2) DEFAULT 0,
  difference decimal(15,2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, entry_no)
);

-- Journal entry items
CREATE TABLE IF NOT EXISTS journal_entry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id uuid REFERENCES chart_of_accounts(id),
  cost_center_id uuid REFERENCES cost_centers(id),
  debit_amount decimal(15,2) DEFAULT 0,
  credit_amount decimal(15,2) DEFAULT 0,
  against_account text,
  reference_type text,
  reference_id uuid,
  reference_no text,
  user_remark text,
  created_at timestamptz DEFAULT now()
);

-- Payment entries
CREATE TABLE IF NOT EXISTS payment_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  entry_no text NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('receive', 'pay')),
  party_type text CHECK (party_type IN ('customer', 'vendor', 'employee')),
  party_id uuid,
  party_name text,
  posting_date date NOT NULL DEFAULT CURRENT_DATE,
  paid_from_account_id uuid REFERENCES chart_of_accounts(id),
  paid_to_account_id uuid REFERENCES chart_of_accounts(id),
  paid_amount decimal(15,2) NOT NULL DEFAULT 0,
  received_amount decimal(15,2) DEFAULT 0,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'card', 'upi', 'cheque')),
  reference_no text,
  reference_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'cancelled')),
  user_remark text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, entry_no)
);

-- Fixed assets
CREATE TABLE IF NOT EXISTS fixed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  asset_code text NOT NULL,
  asset_name text NOT NULL,
  asset_category text,
  purchase_date date,
  purchase_amount decimal(15,2) DEFAULT 0,
  depreciation_method text DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'written_down_value')),
  useful_life_years integer DEFAULT 5,
  depreciation_rate decimal(5,2) DEFAULT 0,
  accumulated_depreciation decimal(15,2) DEFAULT 0,
  book_value decimal(15,2) DEFAULT 0,
  disposal_date date,
  disposal_amount decimal(15,2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'scrapped')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, asset_code)
);

-- Depreciation schedules
CREATE TABLE IF NOT EXISTS depreciation_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES fixed_assets(id) ON DELETE CASCADE,
  depreciation_date date NOT NULL,
  depreciation_amount decimal(15,2) NOT NULL DEFAULT 0,
  accumulated_depreciation decimal(15,2) DEFAULT 0,
  book_value decimal(15,2) DEFAULT 0,
  journal_entry_id uuid REFERENCES journal_entries(id),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access chart of accounts from their companies"
  ON chart_of_accounts FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access cost centers from their companies"
  ON cost_centers FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access journal entries from their companies"
  ON journal_entries FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access journal entry items from their companies"
  ON journal_entry_items FOR ALL TO authenticated
  USING (entry_id IN (SELECT id FROM journal_entries WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access payment entries from their companies"
  ON payment_entries FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access fixed assets from their companies"
  ON fixed_assets FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access depreciation schedules from their companies"
  ON depreciation_schedules FOR ALL TO authenticated
  USING (asset_id IN (SELECT id FROM fixed_assets WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

-- Insert default chart of accounts for demo company
DO $$
DECLARE
    demo_company_id uuid;
BEGIN
    SELECT id INTO demo_company_id FROM companies WHERE name = 'Demo Corporation' LIMIT 1;
    
    IF demo_company_id IS NOT NULL THEN
        -- Assets
        INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, account_group, is_group) VALUES
        (demo_company_id, '1000', 'Assets', 'asset', 'Assets', true),
        (demo_company_id, '1100', 'Current Assets', 'asset', 'Assets', true),
        (demo_company_id, '1110', 'Cash', 'asset', 'Current Assets', false),
        (demo_company_id, '1120', 'Bank', 'asset', 'Current Assets', false),
        (demo_company_id, '1130', 'Accounts Receivable', 'asset', 'Current Assets', false),
        (demo_company_id, '1140', 'Inventory', 'asset', 'Current Assets', false),
        
        -- Liabilities
        (demo_company_id, '2000', 'Liabilities', 'liability', 'Liabilities', true),
        (demo_company_id, '2100', 'Current Liabilities', 'liability', 'Liabilities', true),
        (demo_company_id, '2110', 'Accounts Payable', 'liability', 'Current Liabilities', false),
        (demo_company_id, '2120', 'Tax Payable', 'liability', 'Current Liabilities', false),
        
        -- Equity
        (demo_company_id, '3000', 'Equity', 'equity', 'Equity', true),
        (demo_company_id, '3100', 'Capital', 'equity', 'Equity', false),
        (demo_company_id, '3200', 'Retained Earnings', 'equity', 'Equity', false),
        
        -- Income
        (demo_company_id, '4000', 'Income', 'income', 'Income', true),
        (demo_company_id, '4100', 'Sales Revenue', 'income', 'Income', false),
        (demo_company_id, '4200', 'Other Income', 'income', 'Income', false),
        
        -- Expenses
        (demo_company_id, '5000', 'Expenses', 'expense', 'Expenses', true),
        (demo_company_id, '5100', 'Cost of Goods Sold', 'expense', 'Expenses', false),
        (demo_company_id, '5200', 'Operating Expenses', 'expense', 'Expenses', false),
        (demo_company_id, '5300', 'Administrative Expenses', 'expense', 'Expenses', false);
        
        -- Cost Centers
        INSERT INTO cost_centers (company_id, cost_center_code, cost_center_name, is_group) VALUES
        (demo_company_id, 'MAIN', 'Main Cost Center', false),
        (demo_company_id, 'SALES', 'Sales Department', false),
        (demo_company_id, 'ADMIN', 'Administration', false);
    END IF;
END $$;