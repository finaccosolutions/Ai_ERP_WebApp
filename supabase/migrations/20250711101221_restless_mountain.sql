/*
  # Purchase Module Tables

  1. New Tables
    - `vendors` - Vendor master data
    - `vendor_contacts` - Vendor contact persons
    - `purchase_requests` - Purchase requisitions
    - `purchase_orders` - Purchase orders
    - `purchase_order_items` - Purchase order line items
    - `goods_receipts` - Goods receipt notes
    - `goods_receipt_items` - GRN line items
    - `purchase_invoices` - Vendor bills
    - `purchase_invoice_items` - Bill line items
    - `payments` - Vendor payments

  2. Security
    - Enable RLS on all tables
    - Company-based data isolation
*/

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  vendor_code text NOT NULL,
  name text NOT NULL,
  vendor_type text DEFAULT 'company' CHECK (vendor_type IN ('individual', 'company')),
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
  payment_terms text,
  vendor_group text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, vendor_code)
);

-- Vendor contacts
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  designation text,
  email text,
  phone text,
  mobile text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Purchase requests
CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  request_no text NOT NULL,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  required_by date,
  department text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'ordered')),
  notes text,
  requested_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, request_no)
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  order_no text NOT NULL,
  vendor_id uuid REFERENCES vendors(id),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
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

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  item_name text NOT NULL,
  description text,
  quantity decimal(15,3) NOT NULL DEFAULT 1,
  received_qty decimal(15,3) DEFAULT 0,
  unit text DEFAULT 'Nos',
  rate decimal(15,2) NOT NULL DEFAULT 0,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  line_total decimal(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Goods receipts
CREATE TABLE IF NOT EXISTS goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  grn_no text NOT NULL,
  vendor_id uuid REFERENCES vendors(id),
  order_id uuid REFERENCES purchase_orders(id),
  receipt_date date NOT NULL DEFAULT CURRENT_DATE,
  vendor_invoice_no text,
  vendor_invoice_date date,
  status text DEFAULT 'received' CHECK (status IN ('received', 'quality_check', 'accepted', 'rejected')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, grn_no)
);

-- Goods receipt items
CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id uuid REFERENCES goods_receipts(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES purchase_order_items(id),
  item_code text NOT NULL,
  item_name text NOT NULL,
  ordered_qty decimal(15,3) DEFAULT 0,
  received_qty decimal(15,3) NOT NULL DEFAULT 1,
  accepted_qty decimal(15,3) DEFAULT 0,
  rejected_qty decimal(15,3) DEFAULT 0,
  unit text DEFAULT 'Nos',
  rate decimal(15,2) NOT NULL DEFAULT 0,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Purchase invoices (Bills)
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  bill_no text NOT NULL,
  vendor_id uuid REFERENCES vendors(id),
  order_id uuid REFERENCES purchase_orders(id),
  grn_id uuid REFERENCES goods_receipts(id),
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  vendor_invoice_no text,
  vendor_invoice_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'received', 'paid', 'partially_paid', 'overdue')),
  notes text,
  subtotal decimal(15,2) DEFAULT 0,
  total_tax decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  paid_amount decimal(15,2) DEFAULT 0,
  outstanding_amount decimal(15,2) DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, bill_no)
);

-- Purchase invoice items
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES purchase_invoices(id) ON DELETE CASCADE,
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

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  payment_no text NOT NULL,
  vendor_id uuid REFERENCES vendors(id),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'bank' CHECK (payment_method IN ('cash', 'bank', 'card', 'upi', 'cheque')),
  reference_no text,
  notes text,
  status text DEFAULT 'paid' CHECK (status IN ('paid', 'cleared', 'bounced')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, payment_no)
);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access vendors from their companies"
  ON vendors FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access vendor contacts from their companies"
  ON vendor_contacts FOR ALL TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access purchase requests from their companies"
  ON purchase_requests FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access purchase orders from their companies"
  ON purchase_orders FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access purchase order items from their companies"
  ON purchase_order_items FOR ALL TO authenticated
  USING (order_id IN (SELECT id FROM purchase_orders WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access goods receipts from their companies"
  ON goods_receipts FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access goods receipt items from their companies"
  ON goods_receipt_items FOR ALL TO authenticated
  USING (grn_id IN (SELECT id FROM goods_receipts WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access purchase invoices from their companies"
  ON purchase_invoices FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can access purchase invoice items from their companies"
  ON purchase_invoice_items FOR ALL TO authenticated
  USING (invoice_id IN (SELECT id FROM purchase_invoices WHERE company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "Users can access payments from their companies"
  ON payments FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM users_companies WHERE user_id = auth.uid() AND is_active = true));