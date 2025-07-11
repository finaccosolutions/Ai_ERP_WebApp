/*
  # Fix Company Creation RLS Policy

  1. Security Updates
    - Update companies INSERT policy to allow authenticated users to create companies
    - Create trigger to automatically link user to company upon creation
    - Ensure proper access control for newly created companies

  2. Changes
    - Drop existing restrictive INSERT policy on companies
    - Create new permissive INSERT policy for authenticated users
    - Add trigger function to auto-create users_companies relationship
    - Add trigger to companies table for automatic user linking
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create companies" ON companies;

-- Create a new INSERT policy that allows authenticated users to create companies
CREATE POLICY "Authenticated users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create a function to automatically link the user to the company they create
CREATE OR REPLACE FUNCTION link_user_to_company()
RETURNS TRIGGER AS $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Get the admin role ID (assuming it exists, if not we'll create a basic relationship)
  SELECT id INTO admin_role_id 
  FROM user_roles 
  WHERE name = 'Admin' AND is_system_role = true
  LIMIT 1;

  -- If no admin role exists, we'll still create the relationship without a role
  INSERT INTO users_companies (user_id, company_id, role_id, is_active)
  VALUES (auth.uid(), NEW.id, admin_role_id, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically link user to company when they create one
DROP TRIGGER IF EXISTS trigger_link_user_to_company ON companies;
CREATE TRIGGER trigger_link_user_to_company
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION link_user_to_company();

-- Ensure we have a default admin role for system use
INSERT INTO user_roles (name, description, permissions, is_system_role)
VALUES (
  'Admin',
  'Full administrative access to company data',
  '["all"]'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Update the companies SELECT policy to be more explicit
DROP POLICY IF EXISTS "Users can read companies they belong to" ON companies;
CREATE POLICY "Users can read companies they belong to"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM users_companies 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Update the companies UPDATE policy to be more explicit  
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
CREATE POLICY "Users can update their companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM users_companies 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id 
      FROM users_companies 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );