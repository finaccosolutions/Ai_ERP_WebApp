/*
  # ERP System Core Tables

  1. New Tables
    - `companies` - Multi-company support with tax configuration
    - `periods` - Financial periods and fiscal years
    - `users_companies` - User-company relationships
    - `user_roles` - Role-based access control
    - `permissions` - Granular permissions system

  2. Security
    - Enable RLS on all tables
    - Add policies for multi-company data isolation
    - Secure user access based on company membership
*/

-- Companies table for multi-company support
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  currency text NOT NULL DEFAULT 'INR',
  fiscal_year_start date NOT NULL DEFAULT '2024-04-01',
  fiscal_year_end date NOT NULL DEFAULT '2025-03-31',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  logo text,
  tax_config jsonb NOT NULL DEFAULT '{"type": "GST", "rates": [0, 5, 12, 18, 28]}',
  address jsonb DEFAULT '{}',
  contact_info jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Financial periods table
CREATE TABLE IF NOT EXISTS periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  is_closed boolean DEFAULT false,
  period_type text DEFAULT 'fiscal_year' CHECK (period_type IN ('fiscal_year', 'quarter', 'month')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb DEFAULT '[]',
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- User-company relationships
CREATE TABLE IF NOT EXISTS users_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  role_id uuid REFERENCES user_roles(id),
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- User profiles extending auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  department text,
  designation text,
  employee_id text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read companies they belong to"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can read periods for their companies"
  ON periods FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can read their own profile"
  ON user_profiles FOR ALL
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can read roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read their company relationships"
  ON users_companies FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Insert default roles
INSERT INTO user_roles (name, description, permissions, is_system_role) VALUES
('Super Admin', 'Full system access', '["all"]', true),
('Admin', 'Company administration', '["company_admin", "user_management", "all_modules"]', true),
('Manager', 'Department management', '["sales", "purchase", "inventory", "reports"]', true),
('Accountant', 'Financial operations', '["accounting", "reports", "compliance"]', true),
('Sales User', 'Sales operations', '["sales", "crm", "customers"]', true),
('Purchase User', 'Purchase operations', '["purchase", "vendors", "inventory"]', true),
('Employee', 'Basic access', '["dashboard", "hr_self"]', true);

-- Insert demo company
INSERT INTO companies (name, country, currency, fiscal_year_start, fiscal_year_end, timezone, tax_config) VALUES
('Demo Corporation', 'India', 'INR', '2024-04-01', '2025-03-31', 'Asia/Kolkata', '{"type": "GST", "rates": [0, 5, 12, 18, 28]}');