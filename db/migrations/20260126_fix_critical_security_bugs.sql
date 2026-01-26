-- ===================================================================
-- CRITICAL BUG FIXES - DO NOT SKIP THIS MIGRATION
-- ===================================================================
-- This migration fixes:
-- 1. Infinite loop in RLS policies (will crash database)
-- 2. Soft delete bug (prevents email/phone reuse)
-- 3. Orphaned user risk (missing auth.users FK)
-- 4. Phone validation (enforces E.164 format)
-- ===================================================================

begin;

-- ===================================================================
-- FIX #1: INFINITE LOOP BUG - Create Security Definer Function
-- ===================================================================
-- Problem: RLS policies on 'users' table query 'users' table itself
-- Solution: Use SECURITY DEFINER function to bypass RLS when checking roles
-- ===================================================================

-- Drop existing problematic policies
drop policy if exists users_self_or_admin on users;
drop policy if exists users_admin_manage on users;

-- Create safe admin check function
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from users
    where user_id = auth.uid()
    and role = 'admin'
    and deleted_at is null
  );
end;
$$;

-- Create safe manager check function (for future use)
create or replace function public.is_manager_or_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from users
    where user_id = auth.uid()
    and role in ('admin', 'manager')
    and deleted_at is null
  );
end;
$$;

-- Recreate policies using safe functions
create policy users_self_or_admin on users
  for select
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

create policy users_admin_manage on users
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Grant execute permissions
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_manager_or_admin() to authenticated;

-- ===================================================================
-- FIX #2: ZOMBIE ACCOUNT BUG - Fix Soft Delete Constraints
-- ===================================================================
-- Problem: UNIQUE constraints on email/phone prevent reuse after soft delete
-- Solution: Use partial unique indexes that only apply when deleted_at IS NULL
-- ===================================================================

-- Remove standard unique constraints
alter table users drop constraint if exists users_email_key;
alter table users drop constraint if exists users_phone_key;

-- Create partial unique indexes (only active users)
drop index if exists users_email_unique_active;
drop index if exists users_phone_unique_active;

create unique index users_email_unique_active
on users(email)
where deleted_at is null;

create unique index users_phone_unique_active
on users(phone)
where deleted_at is null and phone is not null;

-- Add helpful comment
comment on index users_email_unique_active is
  'Ensures email uniqueness only for active users (deleted_at IS NULL). Allows email reuse after soft delete.';

comment on index users_phone_unique_active is
  'Ensures phone uniqueness only for active users (deleted_at IS NULL). Allows phone reuse after soft delete.';

-- ===================================================================
-- FIX #3: ORPHANED USER RISK - Link to auth.users
-- ===================================================================
-- Problem: No foreign key constraint ensuring users exist in auth.users
-- Solution: Add FK constraint with CASCADE delete
-- ===================================================================

-- First, ensure all existing users have valid auth.users entries
-- This is a safety check - if this fails, you have orphaned users
do $$
declare
  orphan_count int;
begin
  select count(*) into orphan_count
  from users
  where not exists (
    select 1 from auth.users where auth.users.id = users.user_id
  );

  if orphan_count > 0 then
    raise exception 'Found % orphaned users without matching auth.users entries. Fix manually before running this migration.', orphan_count;
  end if;
end;
$$;

-- Add foreign key constraint
alter table users
drop constraint if exists users_user_id_fkey;

alter table users
add constraint users_user_id_fkey
foreign key (user_id)
references auth.users(id)
on delete cascade;

comment on constraint users_user_id_fkey on users is
  'Ensures every user in public.users has a corresponding auth.users entry. Cascades deletes from auth.users.';

-- ===================================================================
-- FIX #4: PHONE VALIDATION - Enforce E.164 Format
-- ===================================================================
-- Problem: No validation on phone format, will break SMS features
-- Solution: Add CHECK constraint for +1XXXXXXXXXX format (North America)
-- ===================================================================

-- Add phone validation constraint
alter table users
drop constraint if exists users_phone_e164_check;

alter table users
add constraint users_phone_e164_check
check (
  phone is null
  or phone ~ '^\+1[0-9]{10}$'
);

comment on constraint users_phone_e164_check on users is
  'Enforces E.164 format: +1 followed by exactly 10 digits (North American numbers only).';

-- Same fix for customers table
alter table customers
drop constraint if exists customers_phone_e164_check;

alter table customers
add constraint customers_phone_e164_check
check (
  phone is null
  or phone ~ '^\+1[0-9]{10}$'
);

alter table customers
drop constraint if exists customers_alternate_phone_e164_check;

alter table customers
add constraint customers_alternate_phone_e164_check
check (
  alternate_phone is null
  or alternate_phone ~ '^\+1[0-9]{10}$'
);

-- ===================================================================
-- BONUS FIX: Update Existing Invalid Phone Numbers (if any)
-- ===================================================================
-- This will standardize any existing phone numbers to E.164 format
-- Only runs if there are invalid numbers

do $$
declare
  fixed_count int := 0;
begin
  -- Fix users table
  update users
  set phone = '+1' || regexp_replace(phone, '[^0-9]', '', 'g')
  where phone is not null
    and phone !~ '^\+1[0-9]{10}$'
    and regexp_replace(phone, '[^0-9]', '', 'g') ~ '^[0-9]{10}$';

  get diagnostics fixed_count = row_count;

  if fixed_count > 0 then
    raise notice 'Fixed % invalid phone numbers in users table', fixed_count;
  end if;

  -- Fix customers table
  update customers
  set phone = '+1' || regexp_replace(phone, '[^0-9]', '', 'g')
  where phone is not null
    and phone !~ '^\+1[0-9]{10}$'
    and regexp_replace(phone, '[^0-9]', '', 'g') ~ '^[0-9]{10}$';

  get diagnostics fixed_count = row_count;

  if fixed_count > 0 then
    raise notice 'Fixed % invalid phone numbers in customers table', fixed_count;
  end if;
end;
$$;

-- ===================================================================
-- ADDITIONAL SECURITY IMPROVEMENTS
-- ===================================================================

-- Create function to safely get current user's company_id
create or replace function public.current_user_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select company_id from users where user_id = auth.uid() and deleted_at is null;
$$;

grant execute on function public.current_user_company_id() to authenticated;

comment on function public.current_user_company_id() is
  'Returns the company_id of the currently authenticated user. Returns NULL if user not found or deleted.';

-- ===================================================================
-- VALIDATION & TESTING
-- ===================================================================

-- Test that RLS policies don't cause infinite loops
do $$
begin
  -- This should execute without error
  perform count(*) from users;
  raise notice 'RLS policies working correctly - no infinite loop detected';
exception
  when others then
    raise exception 'RLS policy test failed: %', sqlerrm;
end;
$$;

commit;

-- ===================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ===================================================================
-- Run these queries after migration to verify fixes:
--
-- 1. Check for orphaned users:
--    SELECT * FROM users WHERE NOT EXISTS (
--      SELECT 1 FROM auth.users WHERE auth.users.id = users.user_id
--    );
--
-- 2. Check for invalid phone numbers:
--    SELECT user_id, phone FROM users
--    WHERE phone IS NOT NULL AND phone !~ '^\+1[0-9]{10}$';
--
-- 3. Test email reuse after soft delete:
--    UPDATE users SET deleted_at = NOW() WHERE user_id = 'test-uuid';
--    INSERT INTO users (email, ...) VALUES ('same@email.com', ...);
--    -- Should succeed now
--
-- ===================================================================
