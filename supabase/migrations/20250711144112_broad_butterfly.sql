/*
  # Fix Company Creation RLS Policies

  This migration fixes the Row-Level Security policies that are preventing 
  authenticated users from creating companies.

  ## Changes Made:
  1. Drop the restrictive INSERT policy on companies table
  2. Create a new permissive INSERT policy for authenticated users
  3. Ensure the trigger function exists to link users to companies
  4. Update other policies for consistency

  ## Security:
  - Authenticated users can create companies
  - Users are automatically linked to companies they create
  - Users can only access companies they belong to
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;

-- Create a new permissive INSERT policy that allows any authenticated user to create companies
CREATE POLICY "Allow authenticated users to create companies" 
ON companies 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Ensure the trigger function exists to automatically link users to companies
CREATE OR REPLACE FUNCTION link_user_to_company()
RETURNS TRIGGER AS $$
DECLARE
  admin_role_id UUID;
BEGIN
  -- Get or create the Admin role
  SELECT id INTO admin_role_id 
  FROM user_roles 
  WHERE name = 'Admin' AND is_system_role = true;
  
  IF admin_role_id IS NULL THEN
    INSERT INTO user_roles (name, description, is_system_role, permissions)
    VALUES ('Admin', 'Company Administrator', true, '["all"]'::jsonb)
    RETURNING id INTO admin_role_id;
  END IF;
  
  -- Link the user who created the company to the company with Admin role
  INSERT INTO users_companies (user_id, company_id, role_id, is_active)
  VALUES (auth.uid(), NEW.id, admin_role_id, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_link_user_to_company ON companies;
CREATE TRIGGER trigger_link_user_to_company
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION link_user_to_company();

-- Update the SELECT policy to be more explicit
DROP POLICY IF EXISTS "Users can read companies they belong to" ON companies;
CREATE POLICY "Users can read companies they belong to" 
ON companies 
FOR SELECT 
TO authenticated 
USING (
  id IN (
    SELECT company_id 
    FROM users_companies 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Update the UPDATE policy to be more explicit
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
CREATE POLICY "Users can update their companies" 
ON companies 
FOR UPDATE 
TO authenticated 
USING (
  id IN (
    SELECT company_id 
    FROM users_companies 
    WHERE user_id = auth.uid() AND is_active = true
  )
) 
WITH CHECK (
  id IN (
    SELECT company_id 
    FROM users_companies 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Ensure RLS is enabled on the companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Also ensure the users_companies table has proper policies
-- Update INSERT policy for users_companies
DROP POLICY IF EXISTS "Users can create company relationships" ON users_companies;
CREATE POLICY "Users can create company relationships" 
ON users_companies 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Update SELECT policy for users_companies
DROP POLICY IF EXISTS "Users can read their company relationships" ON users_companies;
CREATE POLICY "Users can read their company relationships" 
ON users_companies 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Ensure RLS is enabled on users_companies table
ALTER TABLE users_companies ENABLE ROW LEVEL SECURITY;