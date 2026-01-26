# 🚀 Deployment Checklist

## Critical Fixes Applied

This checklist covers the deployment of critical bug fixes that address:
- ✅ TypeScript type error in Vercel deployment
- ✅ SQL infinite loop bug (RLS policies)
- ✅ Soft delete email/phone reuse bug
- ✅ Missing foreign key constraint
- ✅ Phone validation

---

## ⚡ Quick Fix Summary

### 1. TypeScript Error (FIXED)
**File:** `app/api/documents/route.ts:44`

**Before:**
```typescript
const path = (user as Record<string, string | null>)[column];
```

**After:**
```typescript
const path = user[column as keyof typeof user] as string | null;
```

**Status:** ✅ Fixed - Vercel deployment should now succeed

---

### 2. Database Migrations (READY TO DEPLOY)

#### Migration 1: Critical Security Fixes
**File:** `db/migrations/20260126_fix_critical_security_bugs.sql`

**Fixes:**
- Infinite loop in RLS policies → Security definer functions
- Soft delete email/phone constraints → Partial unique indexes
- Missing auth.users foreign key → Added FK constraint
- Phone validation → E.164 format check

#### Migration 2: Seed Initial Users (OPTIONAL)
**File:** `db/migrations/20260126_seed_initial_users.sql`

**WARNING:** Deletes all existing users. Only use on fresh databases.

---

## 📋 Step-by-Step Deployment

### Step 1: Deploy Code to Vercel ✅

```bash
# The TypeScript fix is already committed
# Push to your main branch to trigger Vercel deployment

git add .
git commit -m "fix: resolve TypeScript error in documents API and apply critical database fixes"
git push origin main
```

**Expected Result:**
- Vercel build should complete successfully
- No TypeScript compilation errors

---

### Step 2: Apply Database Migration 🔄

**Choose Your Method:**

#### Option A: Supabase Dashboard (Recommended for beginners)

1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `db/migrations/20260126_fix_critical_security_bugs.sql`
5. Paste into the editor
6. Click **Run** (or press `Ctrl+Enter`)
7. Check for success messages in the output panel

#### Option B: Supabase CLI (Recommended for production)

```bash
# Ensure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push

# Or run the specific migration file
supabase db execute -f db/migrations/20260126_fix_critical_security_bugs.sql
```

#### Option C: Direct PostgreSQL Connection

```bash
# Replace with your actual database credentials
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f db/migrations/20260126_fix_critical_security_bugs.sql
```

---

### Step 3: Verify Migration Success ✅

Run these verification queries in your Supabase SQL Editor:

#### Test 1: Check for Security Definer Functions
```sql
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'is_manager_or_admin', 'current_user_company_id');

-- Expected: 3 rows with security_type = 'DEFINER'
```

#### Test 2: Verify Partial Indexes
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname IN ('users_email_unique_active', 'users_phone_unique_active');

-- Expected: 2 rows showing indexes with WHERE clause
```

#### Test 3: Check Foreign Key Constraint
```sql
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_user_id_fkey';

-- Expected: 1 row with contype = 'f' (foreign key)
```

#### Test 4: Test RLS Policies (No Infinite Loop)
```sql
-- This should execute without errors
SELECT COUNT(*) FROM users;

-- If you get "stack depth limit exceeded", the migration failed
```

---

### Step 4: (OPTIONAL) Seed Initial Users ⚠️

**⚠️ WARNING:** Only run this on a fresh database or if you want to DELETE ALL USERS.

1. Open `db/migrations/20260126_seed_initial_users.sql`
2. **Uncomment** line 19:
   ```sql
   set local force_seed = 'yes';
   ```
3. Run the entire file in Supabase SQL Editor
4. Verify 5 users were created (check output panel)

**Created Users:**
- jelidadam12@gmail.com (admin)
- youssef.takhi@hotmail.com (manager)
- amine.bouchard@entretienprestige.ca (technician)
- nadia.tremblay@entretienprestige.ca (sales_rep)
- olivier.roy@entretienprestige.ca (dispatcher)

**Default Passwords:** Same as email (e.g., password for jelidadam12@gmail.com is `jelidadam12@gmail.com`)

---

### Step 5: Test Your Application 🧪

1. **Test Login:**
   - Try logging in with admin account: jelidadam12@gmail.com
   - Password: jelidadam12@gmail.com
   - Should succeed and show admin dashboard

2. **Test Document Access:**
   - Navigate to a page that loads documents
   - Should no longer see TypeScript errors
   - Documents should load correctly

3. **Test Soft Delete (Admin only):**
   ```sql
   -- In SQL Editor
   UPDATE users SET deleted_at = NOW() WHERE email = 'test@example.com';

   -- Try creating new user with same email (should work)
   -- Previously would fail with "duplicate key" error
   ```

4. **Test Phone Numbers:**
   - Try creating a user with invalid phone: `(514) 758-7963`
   - Should get validation error
   - Try with valid format: `+15147587963`
   - Should succeed

---

## 🔍 Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:** Some objects might already exist. Run this to check:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'is_admin';
```

If it returns rows, you can skip that part of the migration.

---

### Issue: "stack depth limit exceeded" still occurs

**Solution:** RLS policies weren't updated properly. Drop and recreate:
```sql
DROP POLICY IF EXISTS users_self_or_admin ON users;
DROP POLICY IF EXISTS users_admin_manage ON users;

-- Then re-run the policy creation from the migration
```

---

### Issue: Vercel still shows TypeScript error

**Solution:**
1. Ensure you committed the changes: `git status`
2. Ensure you pushed: `git log origin/main`
3. Check Vercel dashboard for latest deployment
4. Trigger manual redeploy if needed

---

### Issue: Can't create user with previously deleted email

**Solution:** Check if partial index was created:
```sql
\d users  -- Shows indexes

-- Should see:
-- "users_email_unique_active" UNIQUE, btree (email) WHERE deleted_at IS NULL
```

If missing, re-run that part of the migration.

---

## 📊 Rollback Plan (Emergency Only)

If something goes catastrophically wrong:

```sql
BEGIN;

-- Restore old policies (loses security fixes)
DROP POLICY IF EXISTS users_self_or_admin ON users;
DROP POLICY IF EXISTS users_admin_manage ON users;

-- Recreate old policies (with infinite loop bug)
CREATE POLICY users_self_or_admin ON users
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.user_id = auth.uid()
        AND admin_user.role = 'admin'
        AND admin_user.company_id = users.company_id
    )
  );

-- ⚠️ This will bring back the infinite loop bug!
-- Only use as last resort

COMMIT;
```

**Note:** We don't recommend rollback. These fixes address critical issues.

---

## ✅ Success Criteria

Your deployment is successful when:

- ✅ Vercel build completes without TypeScript errors
- ✅ Migration runs without errors in Supabase
- ✅ `SELECT COUNT(*) FROM users;` executes without "stack depth" error
- ✅ You can log in as admin user
- ✅ Documents API endpoint works (`/api/documents?userId=...&docType=id_front`)
- ✅ Can create user with previously soft-deleted email
- ✅ Phone validation rejects invalid formats

---

## 📞 Next Steps After Deployment

1. **Change Admin Password:**
   ```
   Login as: jelidadam12@gmail.com
   Current password: jelidadam12@gmail.com
   → Change to a secure password
   ```

2. **Test 2FA:**
   - Admin account has SMS 2FA enabled
   - Test with phone: +15147587963

3. **Create Real Users:**
   - Use your app's signup flow
   - All new users will have proper auth.users linkage

4. **Monitor Logs:**
   - Check Supabase logs for any RLS-related errors
   - Monitor Vercel function logs for API errors

---

## 📚 Documentation

For detailed technical explanation of each fix, see:
- `db/CRITICAL_FIXES_README.md` - Full technical documentation
- `db/migrations/20260126_fix_critical_security_bugs.sql` - Commented migration
- `db/migrations/20260126_seed_initial_users.sql` - Seed script with examples

---

**Status:** ✅ All code changes committed and ready to deploy
**Risk Level:** 🟡 Medium (database schema changes)
**Estimated Time:** 10-15 minutes
**Rollback Available:** Yes (not recommended)
