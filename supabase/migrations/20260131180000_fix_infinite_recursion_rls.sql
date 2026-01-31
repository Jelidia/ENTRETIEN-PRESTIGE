-- =====================================================
-- FIX: Infinite Recursion in RLS Policies
-- =====================================================
-- The helper functions were causing infinite recursion
-- because they query the users table, which has RLS
-- policies that call those same functions.
--
-- Solution: Use direct auth.uid() comparisons instead
-- =====================================================

-- =====================================================
-- STEP 1: Drop ALL policies that use the helper functions
-- =====================================================

-- Companies
DROP POLICY IF EXISTS "companies_read" ON companies;
DROP POLICY IF EXISTS "companies_write" ON companies;

-- Users
DROP POLICY IF EXISTS "users_read_own_company" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_admin_manage" ON users;

-- Customers
DROP POLICY IF EXISTS "customers_company_read" ON customers;
DROP POLICY IF EXISTS "customers_company_write" ON customers;

-- Jobs
DROP POLICY IF EXISTS "jobs_company_read" ON jobs;
DROP POLICY IF EXISTS "jobs_company_write" ON jobs;
DROP POLICY IF EXISTS "jobs_technician_update" ON jobs;

-- Invoices
DROP POLICY IF EXISTS "invoices_company_read" ON invoices;
DROP POLICY IF EXISTS "invoices_company_write" ON invoices;

-- SMS
DROP POLICY IF EXISTS "sms_company_read" ON sms_messages;
DROP POLICY IF EXISTS "sms_company_write" ON sms_messages;

-- Leads
DROP POLICY IF EXISTS "leads_company_read" ON leads;
DROP POLICY IF EXISTS "leads_own_write" ON leads;
DROP POLICY IF EXISTS "leads_manager_write" ON leads;

-- Commissions
DROP POLICY IF EXISTS "commissions_own_read" ON employee_commissions;
DROP POLICY IF EXISTS "commissions_company_read" ON employee_commissions;
DROP POLICY IF EXISTS "commissions_company_write" ON employee_commissions;

-- Notifications
DROP POLICY IF EXISTS "notifications_own" ON notifications;

-- =====================================================
-- STEP 2: Now drop the problematic helper functions
-- =====================================================

DROP FUNCTION IF EXISTS public.get_user_company_id();
DROP FUNCTION IF EXISTS public.get_user_role();

-- =====================================================
-- STEP 3: Recreate policies without recursion
-- =====================================================

-- COMPANIES TABLE - Fixed RLS

-- Users can read their own company (join through users table)
CREATE POLICY "companies_read"
  ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.company_id = companies.company_id
      AND users.user_id = auth.uid()
    )
  );

-- Admins can update their company
CREATE POLICY "companies_write"
  ON companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.company_id = companies.company_id
      AND users.user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- USERS TABLE - Fixed RLS (No Recursion!)
-- =====================================================

-- Everyone can read their own profile (no recursion!)
CREATE POLICY "users_read_self"
  ON users
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can read other users in their company (using subquery, no recursion)
CREATE POLICY "users_read_company"
  ON users
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE user_id = auth.uid()
    )
  );

-- Users can update themselves
CREATE POLICY "users_update_self"
  ON users
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins and managers can manage users in their company
CREATE POLICY "users_admin_manage"
  ON users
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- CUSTOMERS TABLE - Fixed RLS
-- =====================================================

-- Users can read customers in their company
CREATE POLICY "customers_company_read"
  ON customers
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Admins, managers, sales can write
CREATE POLICY "customers_company_write"
  ON customers
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'sales_rep')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'sales_rep')
    )
  );

-- =====================================================
-- JOBS TABLE - Fixed RLS
-- =====================================================

-- Admins/managers/sales can read all jobs
-- Technicians can read only their assigned jobs
CREATE POLICY "jobs_company_read"
  ON jobs
  FOR SELECT
  USING (
    -- Admin/manager/sales see all jobs in their company
    (
      company_id IN (
        SELECT company_id FROM users
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager', 'sales_rep')
      )
    )
    OR
    -- Technicians see only their assigned jobs
    (
      technician_id = auth.uid()
    )
  );

-- Admins/managers/sales can write jobs
CREATE POLICY "jobs_company_write"
  ON jobs
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'sales_rep')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'sales_rep')
    )
  );

-- Technicians can update their assigned jobs
CREATE POLICY "jobs_technician_update"
  ON jobs
  FOR UPDATE
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

-- =====================================================
-- OTHER TABLES - Fixed RLS
-- =====================================================

-- INVOICES

CREATE POLICY "invoices_company_read"
  ON invoices
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "invoices_company_write"
  ON invoices
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- SMS_MESSAGES

CREATE POLICY "sms_company_read"
  ON sms_messages
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "sms_company_write"
  ON sms_messages
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE user_id = auth.uid()
    )
  );

-- LEADS

CREATE POLICY "leads_company_read"
  ON leads
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND (role IN ('admin', 'manager') OR sales_rep_id = auth.uid())
    )
  );

CREATE POLICY "leads_own_write"
  ON leads
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role = 'sales_rep'
    )
    AND sales_rep_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role = 'sales_rep'
    )
    AND sales_rep_id = auth.uid()
  );

CREATE POLICY "leads_manager_write"
  ON leads
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- EMPLOYEE_COMMISSIONS

CREATE POLICY "commissions_own_read"
  ON employee_commissions
  FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "commissions_company_read"
  ON employee_commissions
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "commissions_company_write"
  ON employee_commissions
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- NOTIFICATIONS

CREATE POLICY "notifications_own"
  ON notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
