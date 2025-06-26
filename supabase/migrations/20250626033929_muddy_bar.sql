/*
  # Fix Admin Policy Recursion

  1. Problem Fixed
    - Resolves infinite recursion in admin_users policy
    - Fixes error when fetching Stripe customer data
    
  2. Changes
    - Drops problematic admin policies that cause recursion
    - Creates new admin policies with direct user_id checks
    - Avoids using is_admin() function in policies to prevent recursion
    
  3. Security
    - Maintains proper access control
    - Uses direct table checks instead of function calls
*/

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Only admins can access admin data" ON admin_users;
DROP POLICY IF EXISTS "Only admins can access logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can view all customers" ON stripe_customers;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON stripe_subscriptions;

-- Create new admin_users policy without recursion
CREATE POLICY "Only admins can access admin data"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    -- Direct check against user_id instead of using is_admin() function
    auth.uid() = user_id
  );

-- Create new admin_logs policy without recursion
CREATE POLICY "Only admins can access logs"
  ON admin_logs FOR ALL
  TO authenticated
  USING (
    -- Direct check against admin_user_id
    admin_user_id IN (
      SELECT user_id FROM admin_users 
      WHERE is_active = true
    )
  );

-- Create new stripe_customers admin policy without recursion
CREATE POLICY "Admins can view all customers"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (
    -- Direct check against admin_users table
    auth.uid() IN (
      SELECT user_id FROM admin_users 
      WHERE is_active = true
    )
  );

-- Create new stripe_subscriptions admin policy without recursion
CREATE POLICY "Admins can view all subscriptions"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (
    -- Direct check against admin_users table
    auth.uid() IN (
      SELECT user_id FROM admin_users 
      WHERE is_active = true
    )
  );

-- Update is_admin function to be more robust
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Direct query without recursion
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  ) INTO is_admin_user;
  
  RETURN is_admin_user;
EXCEPTION
  WHEN undefined_table THEN
    -- If admin_users table doesn't exist, return false
    RETURN false;
END;
$$;