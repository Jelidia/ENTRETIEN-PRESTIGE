# RLS Quick Reference

Quick guide for developers working with Row Level Security in this project.

## How It Works (30-Second Version)

1. User logs in → JWT token includes `company_id` and `user_role`
2. Database policies read these claims → No table queries needed
3. Result: Company isolation + Role-based access + Zero recursion

## Helper Functions

Use these in your SQL queries:

```sql
-- Get current user's company
public.jwt_company_id() → uuid

-- Get current user's role
public.jwt_role() → text ('admin', 'manager', 'sales_rep', 'technician')

-- Check if admin
public.jwt_is_admin() → boolean

-- Check if manager or admin
public.jwt_is_manager_or_admin() → boolean

-- Check if technician
public.jwt_is_technician() → boolean
```

## Common Query Patterns

### Filter by Company

```sql
-- Correct (uses RLS automatically)
SELECT * FROM customers WHERE deleted_at IS NULL;

-- Also works (explicit filter)
SELECT * FROM customers
WHERE company_id = public.jwt_company_id()
  AND deleted_at IS NULL;
```

### Check User's Role

```sql
-- Get user's role
SELECT public.jwt_role();

-- Conditional logic
SELECT CASE
  WHEN public.jwt_is_admin() THEN 'Full access'
  WHEN public.jwt_is_technician() THEN 'Limited access'
  ELSE 'Standard access'
END;
```

### Bypass RLS (Admin Operations Only)

```typescript
// Use service role client (bypasses RLS)
import { createAdminClient } from "@/lib/supabaseServer";

const admin = createAdminClient();
// This can see ALL data across ALL companies
```

## What Each Role Can See

### Admin
- ✅ All company data
- ✅ All users in their company
- ✅ All customers
- ✅ All jobs (including unassigned)
- ✅ All leads
- ✅ All commissions
- ✅ Company settings

### Manager
- ✅ All company data
- ✅ All users in their company
- ✅ All customers
- ✅ All jobs
- ✅ All leads
- ✅ All commissions
- ❌ Cannot update company settings

### Sales Rep
- ✅ Company customers
- ✅ Their own leads only
- ✅ Jobs they created
- ✅ Their own commissions
- ❌ Cannot see other reps' leads
- ❌ Cannot see all users

### Technician
- ✅ Jobs assigned to them only
- ✅ Their own commissions
- ✅ Their own availability
- ❌ Cannot see other technicians' jobs
- ❌ Cannot see company settings
- ❌ Cannot see all customers

## Debugging RLS Issues

### Issue: Query returns no results

```sql
-- Check JWT claims
SELECT
  public.jwt_company_id() as my_company,
  public.jwt_role() as my_role,
  auth.uid() as my_user_id;

-- Check if user exists in users table
SELECT user_id, company_id, role, deleted_at
FROM users
WHERE user_id = auth.uid();
```

### Issue: "Permission denied" error

```typescript
// Use service role to bypass RLS and debug
const admin = createAdminClient();
const { data, error } = await admin
  .from('table_name')
  .select('*')
  .eq('some_id', id);

console.log('Without RLS:', data);
```

### Issue: JWT claims not set

```typescript
// Check JWT token
const client = createUserClient(token);
const { data: { user } } = await client.auth.getUser();

console.log('JWT Claims:', user?.app_metadata);
// Should show: { company_id: "...", user_role: "..." }

// If empty, user needs to re-login
```

## Testing RLS Locally

### Set JWT claims manually

```sql
-- Simulate being an admin
SET request.jwt.claims = '{
  "sub": "user-uuid-here",
  "company_id": "company-uuid-here",
  "user_role": "admin"
}';

-- Now run queries
SELECT * FROM customers;

-- Reset
RESET request.jwt.claims;
```

### Run test script

```bash
psql -h localhost -U postgres -d postgres -f supabase/test_rls_policies.sql
```

## Performance Tips

### Use Indexes

RLS policies use these indexes:

```sql
-- Already created in migration
idx_users_company_role     -- users(company_id, role)
idx_customers_company      -- customers(company_id)
idx_jobs_company          -- jobs(company_id)
idx_jobs_technician       -- jobs(technician_id)
```

### Check Query Performance

```sql
-- See execution plan
EXPLAIN ANALYZE
SELECT * FROM jobs
WHERE company_id = public.jwt_company_id();

-- Should show "Index Scan" not "Seq Scan"
```

### Avoid N+1 Queries

```typescript
// BAD - N+1 queries
const jobs = await supabase.from('jobs').select('*');
for (const job of jobs.data) {
  const customer = await supabase.from('customers')
    .select('*')
    .eq('customer_id', job.customer_id)
    .single();
}

// GOOD - Single query with join
const { data } = await supabase
  .from('jobs')
  .select('*, customer:customers(*)');
```

## Common Mistakes

### ❌ Don't do this

```typescript
// Don't manually filter by company_id everywhere
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('company_id', user.company_id); // ← Redundant, RLS does this
```

### ✅ Do this instead

```typescript
// RLS handles company filtering automatically
const { data } = await supabase
  .from('customers')
  .select('*');
```

### ❌ Don't query users table in policies

```sql
-- WRONG - causes recursion
CREATE POLICY "bad_policy" ON customers
  USING (
    company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    --            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ← RECURSION!
  );
```

### ✅ Use JWT helper functions

```sql
-- CORRECT - no recursion
CREATE POLICY "good_policy" ON customers
  USING (
    company_id = public.jwt_company_id()
    --           ^^^^^^^^^^^^^^^^^^^^^^^ ← Reads from JWT, no query
  );
```

## When to Use Service Role

Use the service role client ONLY for:

1. **System operations** (cron jobs, background tasks)
2. **Admin operations** (user management by super-admin)
3. **Webhook handlers** (Stripe, Twilio - no user context)
4. **Debugging** (temporary, remove in production)

```typescript
// Service role bypasses RLS - use carefully!
import { createAdminClient } from "@/lib/supabaseServer";

const admin = createAdminClient();
// This client sees ALL data from ALL companies
```

## Security Reminders

1. **JWT claims are immutable** - Signed by Supabase, cannot be forged
2. **Re-login required** - If user's role/company changes, they must re-login
3. **Service role is powerful** - Only use in server-side code, never expose
4. **Public policies** - Customer ratings allow anon access, validate tokens in app
5. **Soft deletes** - RLS filters `deleted_at IS NULL`, but service role sees all

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No results returned | Check JWT claims with `SELECT public.jwt_company_id()` |
| Permission denied | Verify user has correct role in `users` table |
| Infinite recursion | Use `public.jwt_*()` functions, not table queries |
| Slow queries | Check `EXPLAIN ANALYZE`, ensure indexes are used |
| Cross-company access | RLS blocks this automatically, check JWT claims |
| JWT claims empty | User needs to re-login, or auth hook not configured |

## Further Reading

- Full guide: `RLS_IMPLEMENTATION_GUIDE.md`
- Migration summary: `RLS_MIGRATION_SUMMARY.md`
- Test script: `supabase/test_rls_policies.sql`
- Migration file: `supabase/migrations/20260131200000_enable_rls_with_jwt_claims.sql`

## Emergency Rollback

If RLS causes critical issues:

```sql
-- Disable RLS on all tables (emergency only)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE 'ALTER TABLE ' || r.tablename || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END$$;
```

Then rely on application-layer filtering while you debug.
