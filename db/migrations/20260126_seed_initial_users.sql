-- ===================================================================
-- SEED SCRIPT: Initial Users for Entretien Prestige
-- ===================================================================
-- This script:
-- 1. Creates users in auth.users (Supabase authentication)
-- 2. Links them to public.users (application data)
-- 3. Ensures proper foreign key relationships
-- 4. Sets up company association
-- ===================================================================
-- WARNING: This will DELETE all existing users. Only run on fresh databases!
-- ===================================================================

begin;

-- ===================================================================
-- STEP 1: Safety Check - Confirm this is intentional
-- ===================================================================
-- Uncomment the following line to enable this script:
-- set local force_seed = 'yes';

do $$
begin
  if current_setting('force_seed', true) is distinct from 'yes' then
    raise exception 'SAFETY CHECK: This script will DELETE ALL USERS. To proceed, uncomment the "set local force_seed" line at the top of this file.';
  end if;
end;
$$;

-- ===================================================================
-- STEP 2: Wipe Existing Data (CASCADE deletes will clean up)
-- ===================================================================
-- Order matters: delete auth.users first, FK cascade handles public.users

do $$
begin
  raise notice 'Deleting all existing authentication data...';
  delete from auth.identities;
  delete from auth.users;
  raise notice 'Authentication data deleted';

  raise notice 'Truncating users table...';
  truncate table users restart identity cascade;
  raise notice 'Users table truncated';
end;
$$;

-- ===================================================================
-- STEP 3: Ensure Company Exists
-- ===================================================================

insert into companies (name, legal_name, status, timezone, country)
values ('Entretien Prestige', 'Entretien Prestige Inc.', 'active', 'America/Montreal', 'CA')
on conflict do nothing;

-- ===================================================================
-- STEP 4: Create Users in auth.users + public.users
-- ===================================================================

with company_ref as (
  -- Get the company ID (either just created or existing)
  select company_id
  from companies
  where name = 'Entretien Prestige'
  limit 1
),
seed_data as (
  -- Define all users to be created
  select * from (values
    (
      'jelidadam12@gmail.com',
      'Adam Jelidi',
      '+15147587963',
      'admin',
      true,
      'sms'
    ),
    (
      'youssef.takhi@hotmail.com',
      'Youssef Takhi',
      '+14383652445',
      'manager',
      false,
      'authenticator'
    ),
    (
      'amine.bouchard@entretienprestige.ca',
      'Amine Bouchard',
      '+15145550131',
      'technician',
      false,
      'authenticator'
    ),
    (
      'nadia.tremblay@entretienprestige.ca',
      'Nadia Tremblay',
      '+15145550162',
      'sales_rep',
      false,
      'authenticator'
    ),
    (
      'olivier.roy@entretienprestige.ca',
      'Olivier Roy',
      '+15145550194',
      'dispatcher',
      false,
      'authenticator'
    )
  ) as t(email, full_name, phone, role, two_factor_enabled, two_factor_method)
),
new_auth_users as (
  -- Insert into auth.users (Supabase authentication table)
  insert into auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  select
    gen_random_uuid() as id,
    'authenticated' as aud,
    'authenticated' as role,
    email,
    crypt(email, gen_salt('bf')) as encrypted_password, -- Password = email (change on first login)
    now() as email_confirmed_at,
    phone,
    now() as phone_confirmed_at,
    jsonb_build_object(
      'full_name', full_name,
      'phone', phone
    ) as raw_user_meta_data,
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email')
    ) as raw_app_meta_data,
    now() as created_at,
    now() as updated_at,
    '' as confirmation_token,
    '' as recovery_token,
    '' as email_change_token_new,
    '' as email_change
  from seed_data
  returning id, email
),
new_identities as (
  -- Insert into auth.identities (required for Supabase auth)
  insert into auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at
  )
  select
    gen_random_uuid() as id,
    new_auth_users.id as user_id,
    'email' as provider,
    new_auth_users.id::text as provider_id,
    jsonb_build_object(
      'sub', new_auth_users.id::text,
      'email', new_auth_users.email,
      'email_verified', true,
      'phone_verified', true
    ) as identity_data,
    now() as created_at,
    now() as updated_at
  from new_auth_users
  returning user_id
)
-- Insert into public.users (application data table)
insert into users (
  user_id,
  company_id,
  email,
  email_verified,
  phone,
  phone_verified,
  full_name,
  role,
  status,
  two_factor_enabled,
  two_factor_method,
  created_at,
  updated_at
)
select
  new_auth_users.id as user_id,
  company_ref.company_id,
  seed_data.email,
  true as email_verified,
  seed_data.phone,
  true as phone_verified,
  seed_data.full_name,
  seed_data.role::text,
  'active' as status,
  seed_data.two_factor_enabled,
  seed_data.two_factor_method::text,
  now() as created_at,
  now() as updated_at
from seed_data
join new_auth_users on new_auth_users.email = seed_data.email
cross join company_ref;

-- ===================================================================
-- STEP 5: Verification
-- ===================================================================

do $$
declare
  auth_count int;
  public_count int;
  orphan_count int;
begin
  -- Count users in auth.users
  select count(*) into auth_count from auth.users;

  -- Count users in public.users
  select count(*) into public_count from users;

  -- Check for orphans
  select count(*) into orphan_count
  from users
  where not exists (
    select 1 from auth.users where auth.users.id = users.user_id
  );

  raise notice '=== Seed Complete ===';
  raise notice 'Created % auth.users entries', auth_count;
  raise notice 'Created % public.users entries', public_count;

  if auth_count != public_count then
    raise exception 'Mismatch: % auth.users vs % public.users', auth_count, public_count;
  end if;

  if orphan_count > 0 then
    raise exception 'Found % orphaned public.users without auth.users', orphan_count;
  end if;

  raise notice 'All users properly linked - no orphans detected';
  raise notice '====================';
end;
$$;

-- ===================================================================
-- STEP 6: Display Created Users
-- ===================================================================

select
  u.user_id,
  u.email,
  u.full_name,
  u.phone,
  u.role,
  u.two_factor_enabled,
  u.two_factor_method,
  c.name as company_name,
  'Password is same as email - user should change on first login' as note
from users u
join companies c on c.company_id = u.company_id
order by
  case u.role
    when 'admin' then 1
    when 'manager' then 2
    when 'dispatcher' then 3
    when 'sales_rep' then 4
    when 'technician' then 5
    else 6
  end,
  u.full_name;

commit;

-- ===================================================================
-- POST-SEED INSTRUCTIONS
-- ===================================================================
-- 1. All users can log in with:
--    Email: [their email]
--    Password: [their email]
--
-- 2. Users should change passwords on first login
--
-- 3. Admin user (jelidadam12@gmail.com) has full access
--
-- 4. 2FA is enabled for admin via SMS (+15147587963)
--
-- 5. To test the fixes:
--    - Try soft deleting a user: UPDATE users SET deleted_at = NOW() WHERE email = 'test@example.com'
--    - Try creating new user with same email (should work now)
--    - RLS policies should work without infinite loops
--
-- ===================================================================
