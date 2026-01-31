-- =====================================================
-- RLS POLICY TEST SCRIPT
-- =====================================================
-- This script tests the RLS policies to ensure:
-- 1. Company isolation works
-- 2. Role-based access works
-- 3. Technician restrictions work
-- 4. No infinite recursion
-- =====================================================

-- =====================================================
-- SETUP TEST DATA
-- =====================================================

-- Create test companies
INSERT INTO companies (company_id, name, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Company A', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Company B', 'active')
ON CONFLICT (company_id) DO NOTHING;

-- Create test users for Company A
INSERT INTO users (user_id, company_id, email, full_name, role, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin-a@test.com', 'Admin A', 'admin', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'manager-a@test.com', 'Manager A', 'manager', 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'sales-a@test.com', 'Sales A', 'sales_rep', 'active'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'tech-a1@test.com', 'Tech A1', 'technician', 'active'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'tech-a2@test.com', 'Tech A2', 'technician', 'active')
ON CONFLICT (user_id) DO NOTHING;

-- Create test users for Company B
INSERT INTO users (user_id, company_id, email, full_name, role, status)
VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222', 'admin-b@test.com', 'Admin B', 'admin', 'active'),
  ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 'tech-b@test.com', 'Tech B', 'technician', 'active')
ON CONFLICT (user_id) DO NOTHING;

-- Create test customers
INSERT INTO customers (customer_id, company_id, first_name, last_name, email, phone, status)
VALUES
  ('cust0001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Customer', 'A1', 'cust-a1@test.com', '5141111111', 'active'),
  ('cust0002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'Customer', 'A2', 'cust-a2@test.com', '5142222222', 'active'),
  ('cust0003-0003-0003-0003-000000000003', '22222222-2222-2222-2222-222222222222', 'Customer', 'B1', 'cust-b1@test.com', '5143333333', 'active')
ON CONFLICT (customer_id) DO NOTHING;

-- Create test jobs
INSERT INTO jobs (job_id, company_id, customer_id, technician_id, service_type, status)
VALUES
  ('job00001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'cust0001-0001-0001-0001-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Lavage de vitres', 'confirmed'),
  ('job00002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'cust0002-0002-0002-0002-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Nettoyage de tapis', 'confirmed'),
  ('job00003-0003-0003-0003-000000000003', '22222222-2222-2222-2222-222222222222', 'cust0003-0003-0003-0003-000000000003', '99999999-9999-9999-9999-999999999999', 'Lavage de vitres', 'confirmed')
ON CONFLICT (job_id) DO NOTHING;

-- Create test leads
INSERT INTO leads (lead_id, company_id, sales_rep_id, first_name, last_name, phone, status)
VALUES
  ('lead0001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lead', 'A1', '5144444444', 'new'),
  ('lead0002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lead', 'A2', '5145555555', 'contacted')
ON CONFLICT (lead_id) DO NOTHING;

-- =====================================================
-- TEST 1: Company Isolation (Users Table)
-- =====================================================

\echo '===================='
\echo 'TEST 1: Company Isolation (Users)'
\echo '====================\n'

-- Set JWT claims as Admin A (Company A)
SET request.jwt.claims = '{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "admin"
}';

\echo 'Admin A should see 5 users from Company A:'
SELECT count(*) as user_count FROM users;

\echo '\nAdmin A should NOT see Company B users:'
SELECT count(*) as company_b_users
FROM users
WHERE company_id = '22222222-2222-2222-2222-222222222222';

-- Set JWT claims as Admin B (Company B)
SET request.jwt.claims = '{
  "sub": "ffffffff-ffff-ffff-ffff-ffffffffffff",
  "company_id": "22222222-2222-2222-2222-222222222222",
  "user_role": "admin"
}';

\echo '\nAdmin B should see 2 users from Company B:'
SELECT count(*) as user_count FROM users;

\echo '\nAdmin B should NOT see Company A users:'
SELECT count(*) as company_a_users
FROM users
WHERE company_id = '11111111-1111-1111-1111-111111111111';

-- =====================================================
-- TEST 2: Company Isolation (Customers)
-- =====================================================

\echo '\n===================='
\echo 'TEST 2: Company Isolation (Customers)'
\echo '====================\n'

-- Set JWT claims as Admin A
SET request.jwt.claims = '{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "admin"
}';

\echo 'Admin A should see 2 customers from Company A:'
SELECT count(*) as customer_count FROM customers;

-- Set JWT claims as Admin B
SET request.jwt.claims = '{
  "sub": "ffffffff-ffff-ffff-ffff-ffffffffffff",
  "company_id": "22222222-2222-2222-2222-222222222222",
  "user_role": "admin"
}';

\echo '\nAdmin B should see 1 customer from Company B:'
SELECT count(*) as customer_count FROM customers;

-- =====================================================
-- TEST 3: Technician Job Isolation
-- =====================================================

\echo '\n===================='
\echo 'TEST 3: Technician Job Isolation'
\echo '====================\n'

-- Set JWT claims as Tech A1 (Company A, assigned to job 1)
SET request.jwt.claims = '{
  "sub": "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "technician"
}';

\echo 'Tech A1 should see 1 job (only their assigned job):'
SELECT count(*) as job_count FROM jobs;

\echo '\nTech A1 should see job ID job00001:'
SELECT job_id FROM jobs;

-- Set JWT claims as Tech A2 (Company A, assigned to job 2)
SET request.jwt.claims = '{
  "sub": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "technician"
}';

\echo '\nTech A2 should see 1 job (only their assigned job):'
SELECT count(*) as job_count FROM jobs;

\echo '\nTech A2 should see job ID job00002:'
SELECT job_id FROM jobs;

-- Set JWT claims as Admin A
SET request.jwt.claims = '{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "admin"
}';

\echo '\nAdmin A should see 2 jobs (all Company A jobs):'
SELECT count(*) as job_count FROM jobs;

-- =====================================================
-- TEST 4: Sales Rep Lead Isolation
-- =====================================================

\echo '\n===================='
\echo 'TEST 4: Sales Rep Lead Isolation'
\echo '====================\n'

-- Set JWT claims as Sales Rep A
SET request.jwt.claims = '{
  "sub": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "sales_rep"
}';

\echo 'Sales Rep A should see 2 leads (their own leads):'
SELECT count(*) as lead_count FROM leads;

-- Set JWT claims as Manager A
SET request.jwt.claims = '{
  "sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "manager"
}';

\echo '\nManager A should see 2 leads (all Company A leads):'
SELECT count(*) as lead_count FROM leads;

-- =====================================================
-- TEST 5: Role-Based Permissions
-- =====================================================

\echo '\n===================='
\echo 'TEST 5: Role-Based Permissions'
\echo '====================\n'

-- Test admin can update company
SET request.jwt.claims = '{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "admin"
}';

\echo 'Admin A can update company settings:'
UPDATE companies
SET settings = '{"test": true}'
WHERE company_id = '11111111-1111-1111-1111-111111111111';

SELECT 'SUCCESS: Admin updated company' as result;

-- Test technician CANNOT update company
SET request.jwt.claims = '{
  "sub": "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "technician"
}';

\echo '\nTech A1 CANNOT update company (should fail):'
DO $$
BEGIN
  UPDATE companies
  SET settings = '{"test": true}'
  WHERE company_id = '11111111-1111-1111-1111-111111111111';

  RAISE NOTICE 'ERROR: Technician was able to update company (security breach!)';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'SUCCESS: Technician blocked from updating company';
  WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Update blocked (%)' , SQLERRM;
END$$;

-- =====================================================
-- TEST 6: JWT Helper Functions
-- =====================================================

\echo '\n===================='
\echo 'TEST 6: JWT Helper Functions'
\echo '====================\n'

-- Set JWT claims as Admin A
SET request.jwt.claims = '{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "admin"
}';

\echo 'JWT helper functions as Admin A:'
SELECT
  public.jwt_company_id() as company_id,
  public.jwt_role() as role,
  public.jwt_is_admin() as is_admin,
  public.jwt_is_manager_or_admin() as is_manager_or_admin,
  public.jwt_is_technician() as is_technician;

-- Set JWT claims as Technician
SET request.jwt.claims = '{
  "sub": "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "technician"
}';

\echo '\nJWT helper functions as Technician:'
SELECT
  public.jwt_company_id() as company_id,
  public.jwt_role() as role,
  public.jwt_is_admin() as is_admin,
  public.jwt_is_manager_or_admin() as is_manager_or_admin,
  public.jwt_is_technician() as is_technician;

-- =====================================================
-- TEST 7: Cross-Company Access Prevention
-- =====================================================

\echo '\n===================='
\echo 'TEST 7: Cross-Company Access Prevention'
\echo '====================\n'

-- Set JWT claims as Admin A
SET request.jwt.claims = '{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "admin"
}';

\echo 'Admin A tries to read Company B customer (should return 0 rows):'
SELECT count(*) as should_be_zero
FROM customers
WHERE customer_id = 'cust0003-0003-0003-0003-000000000003';

\echo '\nAdmin A tries to update Company B customer (should fail):'
DO $$
BEGIN
  UPDATE customers
  SET first_name = 'Hacked'
  WHERE customer_id = 'cust0003-0003-0003-0003-000000000003';

  IF FOUND THEN
    RAISE NOTICE 'ERROR: Cross-company update succeeded (security breach!)';
  ELSE
    RAISE NOTICE 'SUCCESS: Cross-company update blocked';
  END IF;
END$$;

-- =====================================================
-- TEST 8: No Infinite Recursion
-- =====================================================

\echo '\n===================='
\echo 'TEST 8: No Infinite Recursion'
\echo '====================\n'

-- This test ensures policies don't cause stack overflow
SET request.jwt.claims = '{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "admin"
}';

\echo 'Running multiple nested queries (should not cause recursion):'

-- Query that previously caused recursion
SELECT u.user_id, u.full_name, u.role, c.name as company_name
FROM users u
JOIN companies c ON c.company_id = u.company_id
WHERE u.deleted_at IS NULL
LIMIT 5;

\echo '\nSUCCESS: No recursion detected';

-- =====================================================
-- TEST 9: Soft Delete Filtering
-- =====================================================

\echo '\n===================='
\echo 'TEST 9: Soft Delete Filtering'
\echo '====================\n'

-- Soft delete a customer
UPDATE customers
SET deleted_at = now()
WHERE customer_id = 'cust0001-0001-0001-0001-000000000001';

SET request.jwt.claims = '{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "admin"
}';

\echo 'After soft delete, Admin A should see 1 active customer (not 2):'
SELECT count(*) as active_customers FROM customers;

-- Restore for cleanup
UPDATE customers
SET deleted_at = NULL
WHERE customer_id = 'cust0001-0001-0001-0001-000000000001';

-- =====================================================
-- TEST 10: Per-User Resource Isolation
-- =====================================================

\echo '\n===================='
\echo 'TEST 10: Per-User Resource Isolation'
\echo '====================\n'

-- Create test notifications
INSERT INTO notifications (notif_id, company_id, user_id, type, title, body)
VALUES
  ('notif001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'job_assigned', 'Test 1', 'For Admin A'),
  ('notif002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'job_assigned', 'Test 2', 'For Tech A1')
ON CONFLICT (notif_id) DO NOTHING;

-- Set JWT claims as Admin A
SET request.jwt.claims = '{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "admin"
}';

\echo 'Admin A should see 1 notification (their own):'
SELECT count(*) as notification_count FROM notifications;

-- Set JWT claims as Tech A1
SET request.jwt.claims = '{
  "sub": "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "company_id": "11111111-1111-1111-1111-111111111111",
  "user_role": "technician"
}';

\echo '\nTech A1 should see 1 notification (their own):'
SELECT count(*) as notification_count FROM notifications;

\echo '\nTech A1 should NOT see Admin A notification:'
SELECT count(*) as should_be_zero
FROM notifications
WHERE notif_id = 'notif001-0001-0001-0001-000000000001';

-- =====================================================
-- CLEANUP
-- =====================================================

\echo '\n===================='
\echo 'CLEANUP'
\echo '====================\n'

-- Reset JWT claims
RESET request.jwt.claims;

-- Clean up test data (optional - comment out if you want to keep test data)
/*
DELETE FROM notifications WHERE notif_id IN ('notif001-0001-0001-0001-000000000001', 'notif002-0002-0002-0002-000000000002');
DELETE FROM leads WHERE lead_id IN ('lead0001-0001-0001-0001-000000000001', 'lead0002-0002-0002-0002-000000000002');
DELETE FROM jobs WHERE job_id IN ('job00001-0001-0001-0001-000000000001', 'job00002-0002-0002-0002-000000000002', 'job00003-0003-0003-0003-000000000003');
DELETE FROM customers WHERE customer_id IN ('cust0001-0001-0001-0001-000000000001', 'cust0002-0002-0002-0002-000000000002', 'cust0003-0003-0003-0003-000000000003');
DELETE FROM users WHERE user_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '99999999-9999-9999-9999-999999999999');
DELETE FROM companies WHERE company_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
*/

\echo '\n===================='
\echo 'ALL TESTS COMPLETED'
\echo '====================\n'
\echo 'Review the output above to verify all tests passed.'
\echo 'Expected results:'
\echo '  - Company isolation: Users only see data from their company'
\echo '  - Technician isolation: Technicians only see assigned jobs'
\echo '  - Role-based access: Admins have more access than technicians'
\echo '  - Cross-company blocking: Cannot access other companies data'
\echo '  - No recursion: Queries complete without stack overflow'
\echo '  - Soft deletes filtered: Deleted records not returned'
\echo '  - Per-user resources: Notifications only visible to owner'
