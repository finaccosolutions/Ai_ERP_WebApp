/*
  # CRM Module Tables

  1. New Tables
    - `leads` - Lead management
    - `lead_sources` - Lead source master
    - `opportunities` - Sales opportunities
    - `campaigns` - Marketing campaigns
    - `activities` - Customer activities/interactions
    - `territories` - Sales territories

  2. Security
    - Enable RLS on all tables
    - Company-based data isolation
*/

-- Lead sources
CREATE TABLE IF NOT EXISTS lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Territories
CREATE TABLE IF NOT EXISTS territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_territory_id uuid REFERENCES territories(id),
  territory_manager_id uuid REFERENCES employees(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  lead_name text NOT NULL,
  company_name text,
  email text,
  phone text,
  mobile text,
  website text,
  lead_source_id uuid REFERENCES lead_sources(id),
  territory_id uuid REFERENCES territories(id),
  status text DEFAULT 'open' CHECK (status IN ('open', 'contacted', 'qualified', 'converted', 'lost')),
  lead_owner_id uuid REFERENCES employees(id),
  annual_revenue decimal(15,2) DEFAULT 0,
  no_of_employees integer DEFAULT 0,
  industry text,
  address jsonb DEFAULT '{}',
  notes text,
  next_contact_date date,
  converted_customer_id uuid REFERENCES customers(id),
  converted_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_name text NOT NULL,
  customer_id uuid REFERENCES customers(id),
  lead_id uuid REFERENCES leads(id),
  opportunity_owner_id uuid REFERENCES employees(id),
  opportunity_amount decimal(15,2) DEFAULT 0,
  probability decimal(5,2) DEFAULT 0,
  stage text DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  expected_close_date date,
  actual_close_date date,
  next_step text,
  description text,
  competitor text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  campaign_type text DEFAULT 'email' CHECK (campaign_type IN ('email', 'social_media', 'print', 'event', 'webinar', 'other')),
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  budget decimal(15,2) DEFAULT 0,
  actual_cost decimal(15,2) DEFAULT 0,
  expected_leads integer DEFAULT 0,
  actual_leads integer DEFAULT 0,
  expected_revenue decimal(15,2) DEFAULT 0,
  actual_revenue decimal(15,2) DEFAULT 0,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note')),
  subject text NOT NULL,
  description text,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  activity_time time,
  duration_minutes integer DEFAULT 0,
  status text DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to_id uuid REFERENCES employees(id),
  reference_type text CHECK (reference_type IN ('lead', 'customer', 'opportunity')),
  reference_id uuid,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access lead sources from their companies"
  ON lead_sources FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access territories from their companies"
  ON territories FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access leads from their companies"
  ON leads FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access opportunities from their companies"
  ON opportunities FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access campaigns from their companies"
  ON campaigns FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access activities from their companies"
  ON activities FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

-- Insert default data
DO $$
DECLARE
    demo_company_id uuid;
BEGIN
    SELECT id INTO demo_company_id FROM companies WHERE name = 'Demo Corporation' LIMIT 1;
    
    IF demo_company_id IS NOT NULL THEN
        -- Lead Sources
        INSERT INTO lead_sources (company_id, name, description) VALUES
        (demo_company_id, 'Website', 'Website inquiries'),
        (demo_company_id, 'Referral', 'Customer referrals'),
        (demo_company_id, 'Cold Call', 'Cold calling'),
        (demo_company_id, 'Social Media', 'Social media leads'),
        (demo_company_id, 'Trade Show', 'Trade show contacts');
        
        -- Territories
        INSERT INTO territories (company_id, name) VALUES
        (demo_company_id, 'North Region'),
        (demo_company_id, 'South Region'),
        (demo_company_id, 'East Region'),
        (demo_company_id, 'West Region');
    END IF;
END $$;