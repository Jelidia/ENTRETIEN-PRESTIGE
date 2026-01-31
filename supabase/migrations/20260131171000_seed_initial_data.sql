-- =====================================================
-- ENTRETIEN PRESTIGE - Complete Database Seed
-- =====================================================
-- This seed file:
-- 1. Clears ALL existing data
-- 2. Creates company "Entretien Prestige"
-- 3. Creates 4 users with proper roles and hashed passwords
-- 4. Sets up proper relationships
-- =====================================================

-- Enable required extensions
create extension if not exists "pgcrypto" schema extensions;
create extension if not exists "pgcrypto";

-- =====================================================
-- STEP 1: CLEAR ALL DATA (DANGEROUS - Only for fresh start)
-- =====================================================

truncate table user_audit_log cascade;
truncate table user_sessions cascade;
truncate table auth_challenges cascade;
truncate table termination_records cascade;
truncate table payroll_statements cascade;
truncate table onboarding_progress cascade;
truncate table notifications cascade;
truncate table loyalty_transactions cascade;
truncate table loyalty_points cascade;
truncate table leaderboard cascade;
truncate table leads cascade;
truncate table job_upsells cascade;
truncate table upsell_items cascade;
truncate table job_rework cascade;
truncate table job_quality_issues cascade;
truncate table job_photos cascade;
truncate table job_history cascade;
truncate table job_assignments cascade;
truncate table invoices cascade;
truncate table incidents cascade;
truncate table idempotency_keys cascade;
truncate table gps_locations cascade;
truncate table google_review_bonuses cascade;
truncate table geofences cascade;
truncate table equipment_checklist_templates cascade;
truncate table employee_commissions cascade;
truncate table employee_availability cascade;
truncate table customer_rating_tokens cascade;
truncate table customer_ratings cascade;
truncate table customer_subscriptions cascade;
truncate table customer_communication cascade;
truncate table customer_blacklist cascade;
truncate table referrals cascade;
truncate table sms_messages cascade;
truncate table shift_checklists cascade;
truncate table sales_territories cascade;
truncate table technician_location_daily cascade;
truncate table jobs cascade;
truncate table customers cascade;
truncate table users cascade;
truncate table companies cascade;

-- =====================================================
-- STEP 2: CREATE COMPANY
-- =====================================================

insert into companies (
  company_id,
  name,
  legal_name,
  email,
  phone,
  address,
  city,
  province,
  postal_code,
  country,
  timezone,
  status,
  settings
) values (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Entretien Prestige',
  'Entretien Prestige Inc.',
  'info@entretien-prestige.ca',
  '514-555-0000',
  '123 Rue Principale',
  'Laval',
  'QC',
  'H7L 3N2',
  'CA',
  'America/Montreal',
  'active',
  jsonb_build_object(
    'business_hours', jsonb_build_object(
      'monday', jsonb_build_object('open', '08:00', 'close', '17:00'),
      'tuesday', jsonb_build_object('open', '08:00', 'close', '17:00'),
      'wednesday', jsonb_build_object('open', '08:00', 'close', '17:00'),
      'thursday', jsonb_build_object('open', '08:00', 'close', '17:00'),
      'friday', jsonb_build_object('open', '08:00', 'close', '17:00'),
      'saturday', jsonb_build_object('open', '09:00', 'close', '15:00'),
      'sunday', jsonb_build_object('open', null, 'close', null)
    ),
    'commission_rates', jsonb_build_object(
      'technician_base', 15,
      'sales_rep_base', 10,
      'google_review_bonus', 5
    ),
    'service_packages', jsonb_build_object(
      'basique', 150,
      'premium', 250,
      'prestige', 400
    )
  )
);

-- =====================================================
-- STEP 3: CREATE USERS WITH HASHED PASSWORDS
-- =====================================================
-- Password for all users: Prestige2026!
-- Hashed using: extensions.crypt('Prestige2026!', extensions.gen_salt('bf'))
-- =====================================================

-- User 1: Admin (Owner)
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
  department,
  password_hash,
  two_factor_enabled,
  two_factor_method,
  hire_date,
  created_at
) values (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'jelidiadam12@gmail.com',
  true,
  '5147587963', -- No dashes, E.164 format
  true,
  'Adam Jelidi',
  'admin',
  'active',
  'Executive',
  extensions.crypt('Prestige2026!', extensions.gen_salt('bf')),
  false, -- Disable 2FA for initial setup
  'sms',
  '2024-01-01',
  now()
);

-- User 2: Manager
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
  department,
  password_hash,
  manager_id,
  two_factor_enabled,
  two_factor_method,
  hire_date,
  created_at
) values (
  '33333333-3333-3333-3333-333333333333'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'youssef.takhi@hotmail.com',
  true,
  '5145550001', -- Unique fake number
  true,
  'Youssef Takhi',
  'manager',
  'active',
  'Operations',
  extensions.crypt('Prestige2026!', extensions.gen_salt('bf')),
  '22222222-2222-2222-2222-222222222222'::uuid, -- Reports to admin
  false, -- Disable 2FA for initial setup
  'sms',
  '2024-01-15',
  now()
);

-- User 3: Sales Rep
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
  department,
  password_hash,
  manager_id,
  two_factor_enabled,
  two_factor_method,
  hire_date,
  created_at
) values (
  '44444444-4444-4444-4444-444444444444'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'jelidiadam12+2@gmail.com',
  true,
  '5145550002', -- Unique fake number
  true,
  'Sales Rep Demo',
  'sales_rep',
  'active',
  'Sales',
  extensions.crypt('Prestige2026!', extensions.gen_salt('bf')),
  '33333333-3333-3333-3333-333333333333'::uuid, -- Reports to manager
  false, -- Disable 2FA for initial setup
  'sms',
  '2024-02-01',
  now()
);

-- User 4: Technician
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
  department,
  password_hash,
  manager_id,
  two_factor_enabled,
  two_factor_method,
  hire_date,
  created_at
) values (
  '55555555-5555-5555-5555-555555555555'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'jelidiadam12+1@gmail.com',
  true,
  '5145550003', -- Unique fake number
  true,
  'Technician Demo',
  'technician',
  'active',
  'Field Services',
  extensions.crypt('Prestige2026!', extensions.gen_salt('bf')),
  '33333333-3333-3333-3333-333333333333'::uuid, -- Reports to manager
  false, -- Disable 2FA for initial setup
  'sms',
  '2024-02-15',
  now()
);

-- =====================================================
-- SEED COMPLETE
-- =====================================================
-- All data has been seeded successfully.
-- Login with any of the created users using password: Prestige2026!
-- =====================================================
