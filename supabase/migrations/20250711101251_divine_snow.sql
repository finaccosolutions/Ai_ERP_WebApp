/*
  # Inventory Module Tables

  1. New Tables
    - `items` - Item master data
    - `item_categories` - Item categorization
    - `units_of_measure` - UOM master
    - `warehouses` - Storage locations
    - `stock_entries` - Stock movements
    - `stock_entry_items` - Stock entry line items
    - `stock_ledger` - Stock transaction history
    - `batch_master` - Batch tracking
    - `serial_numbers` - Serial number tracking

  2. Security
    - Enable RLS on all tables
    - Company-based data isolation
*/

-- Item categories
CREATE TABLE IF NOT EXISTS item_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_category_id uuid REFERENCES item_categories(id),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Units of measure
CREATE TABLE IF NOT EXISTS units_of_measure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  symbol text,
  is_base_unit boolean DEFAULT false,
  conversion_factor decimal(15,6) DEFAULT 1,
  base_unit_id uuid REFERENCES units_of_measure(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  address jsonb DEFAULT '{}',
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Items master
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  item_name text NOT NULL,
  description text,
  category_id uuid REFERENCES item_categories(id),
  unit_id uuid REFERENCES units_of_measure(id),
  item_type text DEFAULT 'stock' CHECK (item_type IN ('stock', 'non_stock', 'service')),
  is_sales_item boolean DEFAULT true,
  is_purchase_item boolean DEFAULT true,
  is_stock_item boolean DEFAULT true,
  has_batch boolean DEFAULT false,
  has_serial boolean DEFAULT false,
  has_expiry boolean DEFAULT false,
  standard_rate decimal(15,2) DEFAULT 0,
  purchase_rate decimal(15,2) DEFAULT 0,
  min_order_qty decimal(15,3) DEFAULT 0,
  reorder_level decimal(15,3) DEFAULT 0,
  max_level decimal(15,3) DEFAULT 0,
  lead_time_days integer DEFAULT 0,
  weight decimal(15,3) DEFAULT 0,
  weight_unit text DEFAULT 'kg',
  barcode text,
  hsn_code text,
  tax_rate decimal(5,2) DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, item_code)
);

-- Stock entries
CREATE TABLE IF NOT EXISTS stock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  entry_no text NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('material_receipt', 'material_issue', 'material_transfer', 'stock_adjustment', 'opening_stock')),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  from_warehouse_id uuid REFERENCES warehouses(id),
  to_warehouse_id uuid REFERENCES warehouses(id),
  reference_type text,
  reference_id uuid,
  reference_no text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'cancelled')),
  total_value decimal(15,2) DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, entry_no)
);

-- Stock entry items
CREATE TABLE IF NOT EXISTS stock_entry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES stock_entries(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  from_warehouse_id uuid REFERENCES warehouses(id),
  to_warehouse_id uuid REFERENCES warehouses(id),
  quantity decimal(15,3) NOT NULL DEFAULT 0,
  rate decimal(15,2) DEFAULT 0,
  amount decimal(15,2) DEFAULT 0,
  batch_no text,
  serial_nos text[],
  expiry_date date,
  created_at timestamptz DEFAULT now()
);

-- Stock ledger
CREATE TABLE IF NOT EXISTS stock_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  warehouse_id uuid REFERENCES warehouses(id),
  posting_date date NOT NULL,
  posting_time time DEFAULT CURRENT_TIME,
  voucher_type text NOT NULL,
  voucher_no text NOT NULL,
  actual_qty decimal(15,3) NOT NULL DEFAULT 0,
  qty_after_transaction decimal(15,3) DEFAULT 0,
  incoming_rate decimal(15,2) DEFAULT 0,
  valuation_rate decimal(15,2) DEFAULT 0,
  stock_value decimal(15,2) DEFAULT 0,
  stock_value_difference decimal(15,2) DEFAULT 0,
  batch_no text,
  serial_no text,
  created_at timestamptz DEFAULT now()
);

-- Batch master
CREATE TABLE IF NOT EXISTS batch_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  batch_no text NOT NULL,
  item_id uuid REFERENCES items(id),
  manufacturing_date date,
  expiry_date date,
  batch_qty decimal(15,3) DEFAULT 0,
  remaining_qty decimal(15,3) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, batch_no, item_id)
);

-- Serial numbers
CREATE TABLE IF NOT EXISTS serial_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  serial_no text NOT NULL,
  item_id uuid REFERENCES items(id),
  warehouse_id uuid REFERENCES warehouses(id),
  status text DEFAULT 'available' CHECK (status IN ('available', 'delivered', 'expired', 'inactive')),
  purchase_date date,
  warranty_expiry date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, serial_no)
);

-- Enable RLS
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE serial_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access item categories from their companies"
  ON item_categories FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access units of measure from their companies"
  ON units_of_measure FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access warehouses from their companies"
  ON warehouses FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access items from their companies"
  ON items FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access stock entries from their companies"
  ON stock_entries FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access stock entry items from their companies"
  ON stock_entry_items FOR ALL TO authenticated
  USING (entry_id IN (SELECT id FROM stock_entries WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access stock ledger from their companies"
  ON stock_ledger FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access batch master from their companies"
  ON batch_master FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access serial numbers from their companies"
  ON serial_numbers FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

-- Insert default data
INSERT INTO units_of_measure (company_id, name, symbol, is_base_unit) 
SELECT id, 'Nos', 'Nos', true FROM companies WHERE name = 'Demo Corporation';

INSERT INTO units_of_measure (company_id, name, symbol, is_base_unit) 
SELECT id, 'Kg', 'Kg', true FROM companies WHERE name = 'Demo Corporation';

INSERT INTO warehouses (company_id, name, code, is_default) 
SELECT id, 'Main Warehouse', 'MAIN', true FROM companies WHERE name = 'Demo Corporation';