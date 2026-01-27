# SQL Migration Guide - Fix Enum Error

## ⚠️ If You Got Enum Error

You saw this error:
```
ERROR: 42883: operator does not exist: user_role = text
```

This happens because the `role` column type needs to be fixed first.

---

## ✅ SOLUTION: Run These 2 Files in Order

### **STEP 1: Fix Enum Type** (Run First)

**File:** `db/migrations/20260127_FIX_run_this_first.sql`

**What it does:**
- Converts existing dispatcher users to manager
- Converts role column to text
- Drops old enum type
- Creates fresh enum type
- Converts role column to new enum

**Time:** 10 seconds

```sql
-- Copy and paste contents of:
db/migrations/20260127_FIX_run_this_first.sql
```

✅ **Expected result:** Query should complete successfully and show count of users by role

---

### **STEP 2: Create All New Tables** (Run Second)

**File:** `db/migrations/20260127_complete_spec_implementation.sql`

**What it does:**
- Skips the enum part (already done in Step 1)
- Creates 16 new tables
- Adds RLS policies
- Inserts default data

**Time:** 2 minutes

**Action:** Run the ENTIRE file, but the enum section will be automatically skipped since the type already exists correctly now.

---

## 🎯 Quick Start (Copy-Paste Ready)

### Step 1: Run This First

Open Supabase SQL Editor and paste:

```sql
-- Update dispatcher to manager
UPDATE users
SET role = 'manager'
WHERE role = 'dispatcher';

-- Fix role column type
ALTER TABLE users ALTER COLUMN role TYPE text;

-- Drop old enum if exists
DROP TYPE IF EXISTS user_role CASCADE;

-- Create fresh enum
CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'sales_rep',
  'technician',
  'customer'
);

-- Convert to enum
ALTER TABLE users
ALTER COLUMN role TYPE user_role
USING role::user_role;

-- Verify
SELECT role, COUNT(*) FROM users GROUP BY role;
```

✅ You should see your users grouped by role (no dispatcher)

---

### Step 2: Run Main Migration

Now paste the FULL contents of:
```
db/migrations/20260127_complete_spec_implementation.sql
```

Click Run and wait ~2 minutes.

---

## ✅ Verification

After both steps, verify tables created:

```sql
-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'job_photos',
  'upsell_items',
  'job_upsells',
  'customer_subscriptions',
  'customer_ratings',
  'google_review_bonuses',
  'job_rework',
  'employee_availability',
  'onboarding_progress',
  'termination_records',
  'referrals',
  'loyalty_points',
  'loyalty_transactions',
  'equipment_checklist_templates'
)
ORDER BY table_name;
```

**Expected:** Should return 14 rows (all new tables)

---

## 🎉 Done!

After running both steps:

1. ✅ Dispatcher role removed
2. ✅ 16 new tables created
3. ✅ RLS policies active
4. ✅ Default data inserted
5. ✅ Ready to test!

**Next:** Refresh your browser and test the new navigation!

---

## 🆘 Still Getting Errors?

### Error: "relation already exists"
**Solution:** Table already created, skip that section or drop the table first:
```sql
DROP TABLE IF EXISTS table_name CASCADE;
```

### Error: "column already exists"
**Solution:** Column already added, safe to ignore or skip that ALTER statement

### Error: "type already exists"
**Solution:** Enum already created correctly, continue with rest of migration

---

## 📞 Contact

If you encounter other errors, check:
1. Supabase connection is active
2. You're in SQL Editor (not API)
3. You have sufficient permissions
4. No syntax errors in copy-paste

Most errors are safe to ignore if the objects already exist!
