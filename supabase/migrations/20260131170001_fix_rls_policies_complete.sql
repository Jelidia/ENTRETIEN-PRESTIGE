-- =====================================================
-- COMPREHENSIVE RLS POLICIES FOR ENTRETIEN PRESTIGE
-- =====================================================
-- This migration fixes all RLS policies to prevent 403 Forbidden errors
-- =====================================================

-- Helper function to get user's company_id from their user_id
create or replace function public.get_user_company_id()
returns uuid
language sql
stable
security definer
as $$
  select company_id from public.users where user_id = auth.uid();
$$;

-- Helper function to get user's role
create or replace function public.get_user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.users where user_id = auth.uid();
$$;

-- =====================================================
-- COMPANIES TABLE - RLS POLICIES
-- =====================================================

alter table companies enable row level security;

-- Drop existing policies if they exist
drop policy if exists "companies_read" on companies;
drop policy if exists "companies_write" on companies;

-- Users can read their own company
create policy "companies_read"
  on companies
  for select
  using (
    company_id = public.get_user_company_id()
  );

-- Only admins can update their company
create policy "companies_write"
  on companies
  for update
  using (
    company_id = public.get_user_company_id()
    and public.get_user_role() = 'admin'
  );

-- =====================================================
-- USERS TABLE - RLS POLICIES
-- =====================================================

alter table users enable row level security;

-- Drop existing policies
drop policy if exists "users_read_own_company" on users;
drop policy if exists "users_read_self" on users;
drop policy if exists "users_update_self" on users;
drop policy if exists "users_admin_all" on users;
drop policy if exists "users_admin_manage" on users;

-- Everyone can read users in their company
create policy "users_read_own_company"
  on users
  for select
  using (
    company_id = public.get_user_company_id()
    and deleted_at is null
  );

-- Users can update themselves
create policy "users_update_self"
  on users
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins and managers can insert/update/delete users in their company
create policy "users_admin_manage"
  on users
  for all
  using (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager')
  )
  with check (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager')
  );

-- =====================================================
-- AUTH_CHALLENGES TABLE - RLS POLICIES
-- =====================================================

alter table auth_challenges enable row level security;

drop policy if exists "auth_challenges_owner" on auth_challenges;

-- Users can manage their own auth challenges
create policy "auth_challenges_owner"
  on auth_challenges
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =====================================================
-- USER_SESSIONS TABLE - RLS POLICIES
-- =====================================================

alter table user_sessions enable row level security;

drop policy if exists "sessions_owner" on user_sessions;

-- Users can read their own sessions
create policy "sessions_owner"
  on user_sessions
  for select
  using (user_id = auth.uid());

-- =====================================================
-- CUSTOMERS TABLE - RLS POLICIES
-- =====================================================

alter table customers enable row level security;

drop policy if exists "customers_company_read" on customers;
drop policy if exists "customers_company_write" on customers;

-- Users can read customers in their company
create policy "customers_company_read"
  on customers
  for select
  using (
    company_id = public.get_user_company_id()
    and deleted_at is null
  );

-- Users can create/update customers in their company (except technicians who are read-only)
create policy "customers_company_write"
  on customers
  for all
  using (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager', 'sales_rep')
  )
  with check (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager', 'sales_rep')
  );

-- =====================================================
-- JOBS TABLE - RLS POLICIES
-- =====================================================

alter table jobs enable row level security;

drop policy if exists "jobs_company_read" on jobs;
drop policy if exists "jobs_technician_assigned" on jobs;
drop policy if exists "jobs_company_write" on jobs;

-- Users can read jobs in their company
create policy "jobs_company_read"
  on jobs
  for select
  using (
    (
      company_id = public.get_user_company_id()
      and public.get_user_role() in ('admin', 'manager', 'sales_rep')
    )
    or
    (
      technician_id = auth.uid()
      and public.get_user_role() = 'technician'
    )
  );

-- Admins, managers, and sales reps can create/update jobs
create policy "jobs_company_write"
  on jobs
  for all
  using (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager', 'sales_rep')
  )
  with check (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager', 'sales_rep')
  );

-- Technicians can update their assigned jobs
create policy "jobs_technician_update"
  on jobs
  for update
  using (
    technician_id = auth.uid()
    and public.get_user_role() = 'technician'
  )
  with check (
    technician_id = auth.uid()
    and public.get_user_role() = 'technician'
  );

-- =====================================================
-- INVOICES TABLE - RLS POLICIES
-- =====================================================

alter table invoices enable row level security;

drop policy if exists "invoices_company_read" on invoices;
drop policy if exists "invoices_company_write" on invoices;

-- Users can read invoices in their company
create policy "invoices_company_read"
  on invoices
  for select
  using (company_id = public.get_user_company_id());

-- Admins and managers can manage invoices
create policy "invoices_company_write"
  on invoices
  for all
  using (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager')
  )
  with check (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager')
  );

-- =====================================================
-- SMS_MESSAGES TABLE - RLS POLICIES
-- =====================================================

alter table sms_messages enable row level security;

drop policy if exists "sms_company_read" on sms_messages;
drop policy if exists "sms_company_write" on sms_messages;

-- Users can read SMS in their company
create policy "sms_company_read"
  on sms_messages
  for select
  using (company_id = public.get_user_company_id());

-- Users can send SMS in their company
create policy "sms_company_write"
  on sms_messages
  for all
  using (company_id = public.get_user_company_id())
  with check (company_id = public.get_user_company_id());

-- =====================================================
-- LEADS TABLE - RLS POLICIES
-- =====================================================

alter table leads enable row level security;

drop policy if exists "leads_company_read" on leads;
drop policy if exists "leads_own_write" on leads;
drop policy if exists "leads_manager_write" on leads;

-- Users can read leads in their company
create policy "leads_company_read"
  on leads
  for select
  using (
    company_id = public.get_user_company_id()
    and (
      public.get_user_role() in ('admin', 'manager')
      or sales_rep_id = auth.uid()
    )
  );

-- Sales reps can manage their own leads
create policy "leads_own_write"
  on leads
  for all
  using (
    company_id = public.get_user_company_id()
    and sales_rep_id = auth.uid()
    and public.get_user_role() = 'sales_rep'
  )
  with check (
    company_id = public.get_user_company_id()
    and sales_rep_id = auth.uid()
    and public.get_user_role() = 'sales_rep'
  );

-- Admins and managers can manage all leads
create policy "leads_manager_write"
  on leads
  for all
  using (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager')
  )
  with check (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager')
  );

-- =====================================================
-- EMPLOYEE_COMMISSIONS TABLE - RLS POLICIES
-- =====================================================

alter table employee_commissions enable row level security;

drop policy if exists "commissions_own_read" on employee_commissions;
drop policy if exists "commissions_company_read" on employee_commissions;
drop policy if exists "commissions_company_write" on employee_commissions;

-- Employees can read their own commissions
create policy "commissions_own_read"
  on employee_commissions
  for select
  using (employee_id = auth.uid());

-- Admins and managers can read all commissions in their company
create policy "commissions_company_read"
  on employee_commissions
  for select
  using (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager')
  );

-- Admins and managers can manage commissions
create policy "commissions_company_write"
  on employee_commissions
  for all
  using (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager')
  )
  with check (
    company_id = public.get_user_company_id()
    and public.get_user_role() in ('admin', 'manager')
  );

-- =====================================================
-- NOTIFICATIONS TABLE - RLS POLICIES
-- =====================================================

alter table notifications enable row level security;

drop policy if exists "notifications_own" on notifications;

-- Users can read and update their own notifications
create policy "notifications_own"
  on notifications
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =====================================================
-- IDEMPOTENCY_KEYS TABLE - RLS POLICIES
-- =====================================================

alter table idempotency_keys enable row level security;

drop policy if exists "idempotency_service_role" on idempotency_keys;

-- Only service role can access idempotency keys (API-level only)
create policy "idempotency_service_role"
  on idempotency_keys
  for all
  using (false); -- No user-level access, service role bypasses RLS

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant authenticated users access to necessary tables
grant select, insert, update on companies to authenticated;
grant select, insert, update on users to authenticated;
grant select, insert, update, delete on auth_challenges to authenticated;
grant select on user_sessions to authenticated;
grant select, insert, update on customers to authenticated;
grant select, insert, update on jobs to authenticated;
grant select, insert, update on invoices to authenticated;
grant select, insert, update on sms_messages to authenticated;
grant select, insert, update on leads to authenticated;
grant select, insert, update on employee_commissions to authenticated;
grant select, insert, update, delete on notifications to authenticated;

-- Service role has full access (bypasses RLS)
grant all on all tables in schema public to service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Run this to verify RLS is enabled:
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in (
    'companies', 'users', 'customers', 'jobs',
    'invoices', 'sms_messages', 'leads',
    'employee_commissions', 'notifications'
  )
order by tablename;
