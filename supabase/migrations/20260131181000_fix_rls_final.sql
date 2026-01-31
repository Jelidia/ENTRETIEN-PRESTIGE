-- =====================================================
-- FINAL FIX: Use SECURITY DEFINER function
-- =====================================================
-- Create a helper function that bypasses RLS using SECURITY DEFINER
-- This breaks the recursion loop
-- =====================================================

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "users_read_self" ON users;
DROP POLICY IF EXISTS "users_read_company" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_admin_manage" ON users;

-- Create a SECURITY DEFINER function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT company_id FROM public.users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create a SECURITY DEFINER function for role check
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =====================================================
-- USERS TABLE - No recursion with SECURITY DEFINER
-- =====================================================

-- Simple policy: users can read their own row
CREATE POLICY "users_read_self"
  ON users
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can read others in their company (uses SECURITY DEFINER function)
CREATE POLICY "users_read_company_others"
  ON users
  FOR SELECT
  USING (company_id = public.get_my_company_id());

-- Users can update themselves
CREATE POLICY "users_update_self"
  ON users
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins and managers can manage users
CREATE POLICY "users_admin_manage"
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

-- =====================================================
-- COMPANIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "companies_read" ON companies;
DROP POLICY IF EXISTS "companies_write" ON companies;

CREATE POLICY "companies_read"
  ON companies
  FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "companies_write"
  ON companies
  FOR UPDATE
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================

DROP POLICY IF EXISTS "customers_company_read" ON customers;
DROP POLICY IF EXISTS "customers_company_write" ON customers;

CREATE POLICY "customers_company_read"
  ON customers
  FOR SELECT
  USING (
    company_id = public.get_my_company_id()
    AND deleted_at IS NULL
  );

CREATE POLICY "customers_company_write"
  ON customers
  FOR ALL
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager', 'sales_rep')
  )
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager', 'sales_rep')
  );

-- =====================================================
-- JOBS TABLE
-- =====================================================

DROP POLICY IF EXISTS "jobs_company_read" ON jobs;
DROP POLICY IF EXISTS "jobs_company_write" ON jobs;
DROP POLICY IF EXISTS "jobs_technician_update" ON jobs;

CREATE POLICY "jobs_read"
  ON jobs
  FOR SELECT
  USING (
    company_id = public.get_my_company_id()
    OR technician_id = auth.uid()
  );

CREATE POLICY "jobs_write"
  ON jobs
  FOR ALL
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager', 'sales_rep')
  )
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager', 'sales_rep')
  );

CREATE POLICY "jobs_technician_update"
  ON jobs
  FOR UPDATE
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

-- =====================================================
-- INVOICES
-- =====================================================

DROP POLICY IF EXISTS "invoices_company_read" ON invoices;
DROP POLICY IF EXISTS "invoices_company_write" ON invoices;

CREATE POLICY "invoices_read"
  ON invoices
  FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "invoices_write"
  ON invoices
  FOR ALL
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager')
  )
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager')
  );

-- =====================================================
-- SMS MESSAGES
-- =====================================================

DROP POLICY IF EXISTS "sms_company_read" ON sms_messages;
DROP POLICY IF EXISTS "sms_company_write" ON sms_messages;

CREATE POLICY "sms_read"
  ON sms_messages
  FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "sms_write"
  ON sms_messages
  FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- =====================================================
-- LEADS
-- =====================================================

DROP POLICY IF EXISTS "leads_company_read" ON leads;
DROP POLICY IF EXISTS "leads_own_write" ON leads;
DROP POLICY IF EXISTS "leads_manager_write" ON leads;

CREATE POLICY "leads_read"
  ON leads
  FOR SELECT
  USING (
    company_id = public.get_my_company_id()
    AND (
      public.get_my_role() IN ('admin', 'manager')
      OR sales_rep_id = auth.uid()
    )
  );

CREATE POLICY "leads_write_own"
  ON leads
  FOR ALL
  USING (
    company_id = public.get_my_company_id()
    AND sales_rep_id = auth.uid()
  )
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND sales_rep_id = auth.uid()
  );

CREATE POLICY "leads_write_admin"
  ON leads
  FOR ALL
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager')
  )
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager')
  );

-- =====================================================
-- EMPLOYEE COMMISSIONS
-- =====================================================

DROP POLICY IF EXISTS "commissions_own_read" ON employee_commissions;
DROP POLICY IF EXISTS "commissions_company_read" ON employee_commissions;
DROP POLICY IF EXISTS "commissions_company_write" ON employee_commissions;

CREATE POLICY "commissions_read_own"
  ON employee_commissions
  FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "commissions_read_company"
  ON employee_commissions
  FOR SELECT
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager')
  );

CREATE POLICY "commissions_write"
  ON employee_commissions
  FOR ALL
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager')
  )
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin', 'manager')
  );

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

DROP POLICY IF EXISTS "notifications_own" ON notifications;

CREATE POLICY "notifications_all"
  ON notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
