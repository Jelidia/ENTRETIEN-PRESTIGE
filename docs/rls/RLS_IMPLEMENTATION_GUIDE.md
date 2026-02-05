# RLS Implementation Guide

## Overview

This document explains the Row Level Security (RLS) implementation for the Field Service Management Platform, which uses JWT custom claims to avoid infinite recursion and ensure proper multi-tenancy isolation.

## Architecture

### The Problem We Solved

Previous RLS implementations had **infinite recursion** issues:
- RLS policies checked user's company by querying the `users` table
- The `users` table also has RLS policies
- Those policies also queried the `users` table
- Result: Stack overflow / infinite loop

### The Solution: JWT Custom Claims

Instead of querying the `users` table in RLS policies, we:

1. **Store context in JWT tokens**: When a user logs in, their `company_id` and `role` are stored in the JWT token's custom claims
2. **Read from JWT in policies**: RLS policies read `company_id` and `role` directly from `current_setting('request.jwt.claims')`
3. **Zero recursion**: No table queries needed, so no recursion possible

## Implementation Details

### 1. JWT Custom Claims Hook

Located in migration `20260131200000_enable_rls_with_jwt_claims.sql`:

```sql
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  company_uuid uuid;
  user_role text;
BEGIN
  -- Get company_id and role from users table
  SELECT company_id, role INTO company_uuid, user_role
  FROM public.users
  WHERE user_id = (event->>'user_id')::uuid
    AND deleted_at IS NULL;

  -- Add to JWT claims
  event := jsonb_set(event, '{claims,company_id}', to_jsonb(company_uuid::text));
  event := jsonb_set(event, '{claims,user_role}', to_jsonb(user_role));

  RETURN event;
END;
$$;
```

This function runs **once** when the JWT is created, not during every RLS check.

### 2. Helper Functions (Non-Recursive)

These functions extract values from the JWT token:

```sql
-- Get company_id from JWT
public.jwt_company_id() → uuid

-- Get role from JWT
public.jwt_role() → text

-- Check if user is admin
public.jwt_is_admin() → boolean

-- Check if user is manager or admin
public.jwt_is_manager_or_admin() → boolean

-- Check if user is technician
public.jwt_is_technician() → boolean
```

**Important**: These functions NEVER query tables, they only read from `current_setting('request.jwt.claims')`.

### 3. RLS Policy Patterns

#### Pattern 1: Direct Company Isolation

For tables with a `company_id` column:

```sql
CREATE POLICY "customers_read_company"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND deleted_at IS NULL
  );
```

#### Pattern 2: Role-Based Access

For restricted resources:

```sql
CREATE POLICY "leads_read_company"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND (
      public.jwt_role() IN ('admin', 'manager')
      OR (public.jwt_role() = 'sales_rep' AND sales_rep_id = auth.uid())
    )
  );
```

#### Pattern 3: Technician Assignment Filter

For jobs that technicians should only see if assigned:

```sql
CREATE POLICY "jobs_read_company"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND deleted_at IS NULL
    AND (
      -- Admin/Manager/Sales can see all company jobs
      public.jwt_role() IN ('admin', 'manager', 'sales_rep')
      -- Technicians can only see their assigned jobs
      OR (public.jwt_is_technician() AND technician_id = auth.uid())
    )
  );
```

#### Pattern 4: Indirect Company Isolation (via JOIN)

For tables without `company_id` but linked to a table that has it:

```sql
CREATE POLICY "communication_read_company"
  ON customer_communication
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.customer_id = customer_communication.customer_id
        AND customers.company_id = public.jwt_company_id()
    )
  );
```

#### Pattern 5: Per-User Resources

For resources owned by the user (not company-wide):

```sql
CREATE POLICY "notifications_read_own"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND user_id = auth.uid()
  );
```

#### Pattern 6: Public Access (Customers)

For customer-facing features (like ratings):

```sql
CREATE POLICY "rating_tokens_public_read"
  ON customer_rating_tokens
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "ratings_public_write"
  ON customer_ratings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

**Note**: Public policies should be paired with application-level token validation.

## Configuration Steps

### Step 1: Apply the Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually apply the migration file
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20260131200000_enable_rls_with_jwt_claims.sql
```

### Step 2: Configure Supabase Auth Hooks

You need to configure Supabase to call the `custom_access_token_hook`:

#### Option A: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database** > **Webhooks** or **Auth** > **Hooks**
3. Add a new hook:
   - **Hook Type**: Custom Access Token Hook
   - **Function**: `auth.custom_access_token_hook`

#### Option B: Via Supabase Config File

Add to `supabase/config.toml`:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/auth/custom_access_token_hook"
```

#### Option C: Via SQL (Local Development)

The migration already includes the function and grants. Just ensure your Supabase instance is configured to use hooks.

### Step 3: Verify JWT Claims

After logging in, decode the JWT token and verify it contains:

```json
{
  "claims": {
    "company_id": "uuid-here",
    "user_role": "admin"
  }
}
```

You can test this in your application:

```typescript
import { createUserClient } from "@/lib/supabaseServer";

const token = getAccessTokenFromRequest(request);
const client = createUserClient(token);
const { data: { user } } = await client.auth.getUser();

console.log("JWT Claims:", user?.app_metadata);
// Should show: { company_id: "...", user_role: "..." }
```

## Security Checklist

After deploying this migration, verify:

### Multi-Tenancy Isolation

- [ ] Users can only see data from their own company
- [ ] Changing company_id in JWT doesn't work (JWT is signed)
- [ ] Service role can bypass RLS (for admin operations)

### Role-Based Access

- [ ] Admins can see all company data
- [ ] Managers can see all company data
- [ ] Sales reps can see their own leads
- [ ] Technicians can only see assigned jobs
- [ ] Customers have no authenticated access

### Technician Restrictions

- [ ] Technicians can only read jobs assigned to them
- [ ] Technicians can update their own job statuses
- [ ] Technicians cannot see other technicians' jobs
- [ ] Technicians can see their own commissions
- [ ] Technicians can update their own availability

### Public Access

- [ ] Anonymous users can submit ratings (with valid token)
- [ ] Anonymous users cannot read sensitive data
- [ ] Token validation happens in application layer

### Performance

- [ ] All policies use indexed columns
- [ ] No N+1 query issues in JOIN-based policies
- [ ] `EXPLAIN ANALYZE` shows index usage

## Testing RLS Policies

### Test 1: Company Isolation

```sql
-- Login as user from company A
SET request.jwt.claims = '{"company_id": "company-a-uuid", "user_role": "admin"}';

-- Should only see company A customers
SELECT * FROM customers;

-- Try to access company B customer (should fail)
SELECT * FROM customers WHERE customer_id = 'company-b-customer-uuid';
```

### Test 2: Technician Assignment

```sql
-- Login as technician
SET request.jwt.claims = '{"company_id": "company-uuid", "user_role": "technician", "sub": "tech-uuid"}';

-- Should only see assigned jobs
SELECT * FROM jobs;

-- Should not see other technicians' jobs
SELECT * FROM jobs WHERE technician_id != 'tech-uuid';
```

### Test 3: Role Permissions

```sql
-- Login as sales rep
SET request.jwt.claims = '{"company_id": "company-uuid", "user_role": "sales_rep", "sub": "sales-uuid"}';

-- Should see own leads
SELECT * FROM leads WHERE sales_rep_id = 'sales-uuid';

-- Should not see other reps' leads
SELECT * FROM leads WHERE sales_rep_id != 'sales-uuid';
```

## Troubleshooting

### Issue: JWT claims not set

**Symptom**: `public.jwt_company_id()` returns `00000000-0000-0000-0000-000000000000`

**Solution**:
1. Verify the auth hook is configured
2. Check that `auth.custom_access_token_hook` function exists
3. Ensure the function has proper permissions
4. Re-login to get a new JWT with claims

### Issue: RLS policies too restrictive

**Symptom**: Legitimate queries return no results

**Solution**:
1. Check the JWT claims with `SELECT public.jwt_company_id(), public.jwt_role()`
2. Verify the user's `company_id` and `role` in the `users` table
3. Check if `deleted_at` is NULL
4. Use service role client for debugging (bypasses RLS)

### Issue: Performance degradation

**Symptom**: Queries are slow after enabling RLS

**Solution**:
1. Run `EXPLAIN ANALYZE` on slow queries
2. Ensure indexes exist on `company_id`, `technician_id`, etc.
3. Consider materialized views for complex JOIN-based policies
4. Monitor with `pg_stat_statements`

### Issue: Recursive policies error

**Symptom**: "stack depth limit exceeded" or infinite loop

**Solution**:
1. Verify you're using `public.jwt_*()` functions, NOT querying the `users` table
2. Check that helper functions only read from `current_setting()`
3. Ensure no circular dependencies between policies

## Performance Optimization

### Indexes

The migration creates these indexes:

```sql
CREATE INDEX idx_users_company_role ON users(company_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_company ON customers(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_company ON jobs(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_technician ON jobs(technician_id) WHERE deleted_at IS NULL;
```

### Query Patterns

**Good** (uses index):
```sql
SELECT * FROM customers WHERE company_id = public.jwt_company_id();
```

**Bad** (table scan):
```sql
SELECT * FROM customers WHERE deleted_at IS NULL;
```

**Better** (index on company_id + deleted_at):
```sql
SELECT * FROM customers
WHERE company_id = public.jwt_company_id()
  AND deleted_at IS NULL;
```

### Monitoring

Use these queries to monitor RLS performance:

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%company_id%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Migration Rollback

If you need to rollback this migration:

```sql
-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Drop all policies
DROP POLICY IF EXISTS "users_read_own_company" ON users;
-- ... (repeat for all policies)

-- Drop helper functions
DROP FUNCTION IF EXISTS public.jwt_company_id();
DROP FUNCTION IF EXISTS public.jwt_role();
DROP FUNCTION IF EXISTS public.jwt_is_admin();
DROP FUNCTION IF EXISTS public.jwt_is_manager_or_admin();
DROP FUNCTION IF EXISTS public.jwt_is_technician();

-- Drop JWT hook
DROP FUNCTION IF EXISTS auth.custom_access_token_hook();
```

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT Custom Claims in Supabase](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the migration SQL file for comments
3. Use the service role client to bypass RLS and debug
4. Check Supabase logs for policy violations
5. Run `EXPLAIN ANALYZE` on failing queries

## Change Log

- **2026-01-31**: Initial implementation with JWT custom claims
  - Replaced recursive policies with JWT-based approach
  - Added comprehensive role-based access control
  - Implemented technician job assignment filtering
  - Added indexes for performance
