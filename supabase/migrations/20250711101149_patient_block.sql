/*
  # Sales Module Tables

  1. New Tables
    - `customers` - Customer master data
    - `customer_contacts` - Customer contact persons
    - `price_lists` - Pricing configurations
    - `quotations` - Sales quotations
    - `quotation_items` - Quotation line items
    - `sales_orders` - Sales orders
    - `sales_order_items` - Sales order line items
    - `sales_invoices` - Sales invoices
    - `sales_invoice_items` - Sales invoice line items
    - `credit_notes` - Credit notes
    - `receipts` - Payment receipts

  2. Security
    - Enable RLS on all tables
    - Company-based data isolation
*/

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  customer_code text NOT NULL,
  name text NOT NULL,
  customer_type text DEFAULT 'individual' CHECK (customer_type IN ('individual', 'company')),
  email text,
  phone text,
  mobile text,
  website text,
  tax_id text,
  pan text,
  gstin text,
  billing_address jsonb DEFAULT '{}',
  shipping_address jsonb DEFAULT '{}',
  credit_limit decimal(15,2) DEFAULT 0,
  credit_days integer DEFAULT 30,
  price_list_id uuid,
  territory text,
  customer_group text,
  payment_terms text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, customer_code)
);

-- Customer contacts
CREATE TABLE IF NOT EXISTS customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  designation text,
  email text,
  phone text,
  mobile text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Price lists
CREATE TABLE IF NOT EXISTS price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  is_default boolean DEFAULT false,
  valid_from date,
  valid_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  quotation_no text NOT NULL,
  customer_id uuid REFERENCES customers(id),
  quotation_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_till date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  reference_no text,
  terms_and_conditions text,
  notes text,
  subtotal decimal(15,2) DEFAULT 0,
  total_tax decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, quotation_no)
);

-- Quotation items
CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES quotations(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  item_name text NOT NULL,
  description text,
  quantity decimal(15,3) NOT NULL DEFAULT 1,
  unit text DEFAULT 'Nos',
  rate decimal(15,2) NOT NULL DEFAULT 0,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  line_total decimal(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Sales orders
CREATE TABLE IF NOT EXISTS sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  order_no text NOT NULL,
  customer_id uuid REFERENCES customers(id),
  quotation_id uuid REFERENCES quotations(id),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'partially_delivered', 'delivered', 'cancelled')),
  reference_no text,
  terms_and_conditions text,
  notes text,
  subtotal decimal(15,2) DEFAULT 0,
  total_tax decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, order_no)
);

-- Sales order items
CREATE TABLE IF NOT EXISTS sales_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES sales_orders(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  item_name text NOT NULL,
  description text,
  quantity decimal(15,3) NOT NULL DEFAULT 1,
  delivered_qty decimal(15,3) DEFAULT 0,
  unit text DEFAULT 'Nos',
  rate decimal(15,2) NOT NULL DEFAULT 0,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  line_total decimal(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Sales invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  invoice_no text NOT NULL,
  customer_id uuid REFERENCES customers(id),
  order_id uuid REFERENCES sales_orders(id),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled')),
  reference_no text,
  terms_and_conditions text,
  notes text,
  subtotal decimal(15,2) DEFAULT 0,
  total_tax decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  paid_amount decimal(15,2) DEFAULT 0,
  outstanding_amount decimal(15,2) DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, invoice_no)
);

-- Sales invoice items
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES sales_invoices(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  item_name text NOT NULL,
  description text,
  quantity decimal(15,3) NOT NULL DEFAULT 1,
  unit text DEFAULT 'Nos',
  rate decimal(15,2) NOT NULL DEFAULT 0,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  line_total decimal(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  receipt_no text NOT NULL,
  customer_id uuid REFERENCES customers(id),
  receipt_date date NOT NULL DEFAULT CURRENT_DATE,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'card', 'upi', 'cheque')),
  reference_no text,
  notes text,
  status text DEFAULT 'received' CHECK (status IN ('received', 'cleared', 'bounced')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, receipt_no)
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company-based access
CREATE POLICY "Users can access customers from their companies"
  ON customers FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access customer contacts from their companies"
  ON customer_contacts FOR ALL TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access price lists from their companies"
  ON price_lists FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access quotations from their companies"
  ON quotations FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access quotation items from their companies"
  ON quotation_items FOR ALL TO authenticated
  USING (quotation_id IN (SELECT id FROM quotations WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access sales orders from their companies"
  ON sales_orders FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access sales order items from their companies"
  ON sales_order_items FOR ALL TO authenticated
  USING (order_id IN (SELECT id FROM sales_orders WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access sales invoices from their companies"
  ON sales_invoices FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access sales invoice items from their companies"
  ON sales_invoice_items FOR ALL TO authenticated
  USING (invoice_id IN (SELECT id FROM sales_invoices WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access receipts from their companies"
  ON receipts FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));