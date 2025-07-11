/*
  # Fix Company Creation RLS Policy

  1. Security Updates
    - Update RLS policy for companies table to allow authenticated users to create companies
    - Ensure users can create companies they will have access to
    - Add proper insert policy for companies table

  2. Changes
    - Add INSERT policy for companies table
    - Update existing SELECT policy to be more permissive for company creation
    - Ensure users_companies relationship can be created properly
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read companies they belong to" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can update their companies" ON companies;

-- Create comprehensive policies for companies table
CREATE POLICY "Users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read companies they belong to"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT users_companies.company_id
      FROM users_companies
      WHERE users_companies.user_id = auth.uid()
      AND users_companies.is_active = true
    )
  );

CREATE POLICY "Users can update their companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT users_companies.company_id
      FROM users_companies
      WHERE users_companies.user_id = auth.uid()
      AND users_companies.is_active = true
    )
  );

-- Ensure users_companies policies allow creation
DROP POLICY IF EXISTS "Users can create company relationships" ON users_companies;

CREATE POLICY "Users can create company relationships"
  ON users_companies
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Ensure periods policies allow creation
DROP POLICY IF EXISTS "Users can create periods for their companies" ON periods;

CREATE POLICY "Users can create periods for their companies"
  ON periods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT users_companies.company_id
      FROM users_companies
      WHERE users_companies.user_id = auth.uid()
      AND users_companies.is_active = true
    )
  );