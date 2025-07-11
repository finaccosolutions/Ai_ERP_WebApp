/*
  # Manufacturing Module Tables

  1. New Tables
    - `bom` - Bill of Materials
    - `bom_items` - BOM line items
    - `work_orders` - Production work orders
    - `work_order_items` - Work order items
    - `production_entries` - Production completion entries
    - `job_cards` - Job card tracking

  2. Security
    - Enable RLS on all tables
    - Company-based data isolation
*/

-- Bill of Materials
CREATE TABLE IF NOT EXISTS bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  bom_no text NOT NULL,
  item_id uuid REFERENCES items(id),
  item_name text NOT NULL,
  quantity decimal(15,3) DEFAULT 1,
  unit text DEFAULT 'Nos',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  with_operations boolean DEFAULT false,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, bom_no)
);

-- BOM Items
CREATE TABLE IF NOT EXISTS bom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid REFERENCES bom(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  item_name text NOT NULL,
  quantity decimal(15,3) NOT NULL DEFAULT 1,
  unit text DEFAULT 'Nos',
  rate decimal(15,2) DEFAULT 0,
  amount decimal(15,2) DEFAULT 0,
  scrap_percentage decimal(5,2) DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  work_order_no text NOT NULL,
  item_id uuid REFERENCES items(id),
  item_name text NOT NULL,
  bom_id uuid REFERENCES bom(id),
  qty_to_manufacture decimal(15,3) NOT NULL DEFAULT 1,
  manufactured_qty decimal(15,3) DEFAULT 0,
  pending_qty decimal(15,3) DEFAULT 0,
  unit text DEFAULT 'Nos',
  planned_start_date date,
  planned_end_date date,
  actual_start_date date,
  actual_end_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'not_started', 'in_process', 'completed', 'stopped', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  warehouse_id uuid REFERENCES warehouses(id),
  sales_order_id uuid REFERENCES sales_orders(id),
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, work_order_no)
);

-- Work Order Items (Required Materials)
CREATE TABLE IF NOT EXISTS work_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  item_name text NOT NULL,
  required_qty decimal(15,3) NOT NULL DEFAULT 1,
  consumed_qty decimal(15,3) DEFAULT 0,
  returned_qty decimal(15,3) DEFAULT 0,
  unit text DEFAULT 'Nos',
  rate decimal(15,2) DEFAULT 0,
  amount decimal(15,2) DEFAULT 0,
  warehouse_id uuid REFERENCES warehouses(id),
  created_at timestamptz DEFAULT now()
);

-- Production Entries
CREATE TABLE IF NOT EXISTS production_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  entry_no text NOT NULL,
  work_order_id uuid REFERENCES work_orders(id),
  posting_date date NOT NULL DEFAULT CURRENT_DATE,
  posting_time time DEFAULT CURRENT_TIME,
  fg_completed_qty decimal(15,3) DEFAULT 0,
  process_loss_qty decimal(15,3) DEFAULT 0,
  total_outgoing_value decimal(15,2) DEFAULT 0,
  total_incoming_value decimal(15,2) DEFAULT 0,
  value_difference decimal(15,2) DEFAULT 0,
  remarks text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, entry_no)
);

-- Job Cards
CREATE TABLE IF NOT EXISTS job_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  job_card_no text NOT NULL,
  work_order_id uuid REFERENCES work_orders(id),
  operation text,
  workstation text,
  planned_start_time timestamptz,
  planned_end_time timestamptz,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  total_time_minutes integer DEFAULT 0,
  completed_qty decimal(15,3) DEFAULT 0,
  status text DEFAULT 'open' CHECK (status IN ('open', 'work_in_progress', 'completed', 'on_hold')),
  employee_id uuid REFERENCES employees(id),
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, job_card_no)
);

-- Enable RLS
ALTER TABLE bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access BOM from their companies"
  ON bom FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access BOM items from their companies"
  ON bom_items FOR ALL TO authenticated
  USING (bom_id IN (SELECT id FROM bom WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access work orders from their companies"
  ON work_orders FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access work order items from their companies"
  ON work_order_items FOR ALL TO authenticated
  USING (work_order_id IN (SELECT id FROM work_orders WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access production entries from their companies"
  ON production_entries FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access job cards from their companies"
  ON job_cards FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));