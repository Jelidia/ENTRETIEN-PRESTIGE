-- =====================================================
-- ULTIMATE FIX: Completely bypass RLS for helper functions
-- =====================================================
-- The issue: SECURITY DEFINER alone doesn't bypass RLS
-- Solution: Grant service role privileges to the function
-- Or: Disable RLS temporarily within the function
-- =====================================================

-- First, disable RLS on users table temporarily to break recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Now create functions that can query without RLS
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result uuid;
BEGIN
  SELECT company_id INTO result FROM public.users WHERE user_id = auth.uid() LIMIT 1;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  SELECT role INTO result FROM public.users WHERE user_id = auth.uid() LIMIT 1;
  RETURN result;
END;
$$;

-- Re-enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Now recreate policies using the helper functions
-- These should work now because the functions bypass RLS

DROP POLICY IF EXISTS "users_read_self" ON users;
DROP POLICY IF EXISTS "users_read_company_others" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_admin_manage" ON users;

-- Simple: users can always read their own row
CREATE POLICY "users_read_self"
  ON users
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can read company members (no recursion with SECURITY DEFINER)
CREATE POLICY "users_read_company"
  ON users
  FOR SELECT
  USING (company_id = public.get_my_company_id());

-- Update self
CREATE POLICY "users_update_self"
  ON users
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin/manager can manage
CREATE POLICY "users_manage"
  ON users
  FOR ALL
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager')
  )
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager')
  );

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;
