---
name: supabase-query-builder
description: Generate type-safe Supabase queries with RLS filtering, error handling, and proper TypeScript types. Ensures company_id filtering for multi-tenancy.
argument-hint: "Query description (e.g., 'Query all jobs for technician with status pending')"
user-invocable: true
allowed-tools:
  - Read
  - Write
model: claude-sonnet-4-5-20250929
context: fork
agent: database-architect
hooks:
  - type: PostToolUse
    tool: Write
    condition: content.includes('supabase.from')
    script: !`.claude/hooks/validate-supabase-query.sh`
---

# supabase-query-builder Skill
## Generate Supabase database queries

## When to use
Writing database queries in API routes or server components

## Example
`/supabase-query-builder Get all active jobs for today with customer info, ordered by scheduled time`

## What it does
1. Generates Supabase client initialization
2. Adds company_id filter automatically
3. Uses proper query methods (.single(), .maybeSingle(), .select())
4. Includes error handling
5. Returns TypeScript types

## Quality checks
- ALWAYS filter by company_id for multi-tenancy
- Use createUserClient() for RLS-enforced queries
- Prefer specific columns over SELECT *
- Use .single() when expecting exactly 1 row
- Use .maybeSingle() when row might not exist
- Use .select() for arrays
- Handle errors with user-friendly messages

## Example output
```typescript
// Initialize client with RLS
const client = createUserClient(getAccessTokenFromRequest(request) ?? "");

// Query with company_id filter
const { data: jobs, error } = await client
  .from("jobs")
  .select(`
    job_id,
    scheduled_date,
    scheduled_start_time,
    status,
    customers (
      customer_id,
      first_name,
      last_name,
      phone
    )
  `)
  .eq("company_id", profile.company_id)
  .eq("status", "active")
  .gte("scheduled_date", new Date().toISOString().split("T")[0])
  .order("scheduled_start_time", { ascending: true });

if (error) {
  console.error("Failed to fetch jobs:", error);
  return NextResponse.json(
    { error: "Failed to load jobs" },
    { status: 500 }
  );
}

return NextResponse.json({ data: jobs });
```

## Query patterns

**Get single row (must exist):**
```typescript
const { data, error } = await client
  .from("jobs")
  .select("*")
  .eq("job_id", jobId)
  .single();  // Throws if 0 or >1 rows
```

**Get single row (might not exist):**
```typescript
const { data, error } = await client
  .from("customers")
  .select("*")
  .eq("email", email)
  .maybeSingle();  // Returns null if not found
```

**Get list with pagination:**
```typescript
const { data, count, error } = await client
  .from("jobs")
  .select("*", { count: "exact" })
  .eq("company_id", profile.company_id)
  .range(offset, offset + limit - 1);
```

**Join tables:**
```typescript
const { data, error } = await client
  .from("jobs")
  .select(`
    job_id,
    status,
    customers!inner (
      first_name,
      last_name
    )
  `)
  .eq("company_id", profile.company_id);
```
