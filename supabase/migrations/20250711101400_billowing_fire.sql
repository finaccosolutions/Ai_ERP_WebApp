/*
  # HR Module Tables

  1. New Tables
    - `employees` - Employee master data
    - `departments` - Department master
    - `designations` - Designation master
    - `attendance` - Daily attendance records
    - `leave_types` - Leave type master
    - `leave_applications` - Leave applications
    - `salary_structures` - Salary structure templates
    - `salary_slips` - Monthly salary slips
    - `employee_benefits` - Employee benefits

  2. Security
    - Enable RLS on all tables
    - Company-based data isolation
*/

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  head_of_department uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Designations
CREATE TABLE IF NOT EXISTS designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  employee_id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  mobile text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  marital_status text CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  blood_group text,
  emergency_contact jsonb DEFAULT '{}',
  address jsonb DEFAULT '{}',
  department_id uuid REFERENCES departments(id),
  designation_id uuid REFERENCES designations(id),
  reporting_manager_id uuid REFERENCES employees(id),
  date_of_joining date NOT NULL,
  employment_type text DEFAULT 'permanent' CHECK (employment_type IN ('permanent', 'contract', 'intern', 'consultant')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  salary_structure_id uuid,
  bank_details jsonb DEFAULT '{}',
  tax_details jsonb DEFAULT '{}',
  documents jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, employee_id)
);

-- Leave types
CREATE TABLE IF NOT EXISTS leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  max_days_allowed integer DEFAULT 0,
  carry_forward boolean DEFAULT false,
  encash_allowed boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id),
  attendance_date date NOT NULL,
  check_in time,
  check_out time,
  working_hours decimal(4,2) DEFAULT 0,
  overtime_hours decimal(4,2) DEFAULT 0,
  status text DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'holiday')),
  remarks text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, employee_id, attendance_date)
);

-- Leave applications
CREATE TABLE IF NOT EXISTS leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id),
  leave_type_id uuid REFERENCES leave_types(id),
  from_date date NOT NULL,
  to_date date NOT NULL,
  total_days decimal(3,1) NOT NULL,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid REFERENCES employees(id),
  approved_at timestamptz,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Salary structures
CREATE TABLE IF NOT EXISTS salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  basic_salary decimal(15,2) NOT NULL DEFAULT 0,
  allowances jsonb DEFAULT '{}',
  deductions jsonb DEFAULT '{}',
  total_earning decimal(15,2) DEFAULT 0,
  total_deduction decimal(15,2) DEFAULT 0,
  net_salary decimal(15,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Salary slips
CREATE TABLE IF NOT EXISTS salary_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id),
  salary_structure_id uuid REFERENCES salary_structures(id),
  payroll_period text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  working_days integer DEFAULT 0,
  present_days integer DEFAULT 0,
  basic_salary decimal(15,2) DEFAULT 0,
  allowances jsonb DEFAULT '{}',
  deductions jsonb DEFAULT '{}',
  gross_salary decimal(15,2) DEFAULT 0,
  total_deduction decimal(15,2) DEFAULT 0,
  net_salary decimal(15,2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'paid')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, employee_id, payroll_period)
);

-- Employee benefits
CREATE TABLE IF NOT EXISTS employee_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id),
  benefit_type text NOT NULL,
  benefit_name text NOT NULL,
  amount decimal(15,2) DEFAULT 0,
  effective_from date NOT NULL,
  effective_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_benefits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access departments from their companies"
  ON departments FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access designations from their companies"
  ON designations FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access employees from their companies"
  ON employees FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access leave types from their companies"
  ON leave_types FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access attendance from their companies"
  ON attendance FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access leave applications from their companies"
  ON leave_applications FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access salary structures from their companies"
  ON salary_structures FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access salary slips from their companies"
  ON salary_slips FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access employee benefits from their companies"
  ON employee_benefits FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

-- Insert default data
DO $$
DECLARE
    demo_company_id uuid;
BEGIN
    SELECT id INTO demo_company_id FROM companies WHERE name = 'Demo Corporation' LIMIT 1;
    
    IF demo_company_id IS NOT NULL THEN
        -- Departments
        INSERT INTO departments (company_id, name, description) VALUES
        (demo_company_id, 'Administration', 'Administrative Department'),
        (demo_company_id, 'Sales', 'Sales Department'),
        (demo_company_id, 'Accounts', 'Accounts Department'),
        (demo_company_id, 'IT', 'Information Technology');
        
        -- Designations
        INSERT INTO designations (company_id, name, description) VALUES
        (demo_company_id, 'Manager', 'Department Manager'),
        (demo_company_id, 'Executive', 'Executive Level'),
        (demo_company_id, 'Assistant', 'Assistant Level'),
        (demo_company_id, 'Accountant', 'Accounting Professional');
        
        -- Leave Types
        INSERT INTO leave_types (company_id, name, max_days_allowed, carry_forward) VALUES
        (demo_company_id, 'Annual Leave', 21, true),
        (demo_company_id, 'Sick Leave', 12, false),
        (demo_company_id, 'Casual Leave', 12, false),
        (demo_company_id, 'Maternity Leave', 180, false);
    END IF;
END $$;