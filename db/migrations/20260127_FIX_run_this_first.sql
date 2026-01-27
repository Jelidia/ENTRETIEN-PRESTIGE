-- ============================================================================
-- QUICK FIX: Run this FIRST if you get enum errors
-- ============================================================================

-- Update existing dispatcher users to manager (if any exist)
UPDATE users
SET role = 'manager'
WHERE role = 'dispatcher';

-- Fix role column type - convert to text first
ALTER TABLE users ALTER COLUMN role TYPE text;

-- Drop old enum if exists
DROP TYPE IF EXISTS user_role CASCADE;

-- Create fresh enum type
CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'sales_rep',
  'technician',
  'customer'
);

-- Convert role column to use the enum
ALTER TABLE users
ALTER COLUMN role TYPE user_role
USING role::user_role;

-- Verify
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
