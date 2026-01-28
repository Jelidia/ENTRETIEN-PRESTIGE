---
name: rls-policy-builder
description: Generate Row Level Security (RLS) policies for Supabase tables. Ensures multi-tenancy isolation by company_id and role-based access control.
---

# rls-policy-builder Skill
## Generate RLS policies for Supabase tables

## When to use
Creating new tables or adding access control to existing tables

## Example
`/rls-policy-builder Create RLS policies for invoices table: admins see all, managers see own company, techs see assigned jobs only`

## What it does
1. Analyzes table structure and relationships
2. Generates policies for SELECT, INSERT, UPDATE, DELETE
3. Filters by company_id for multi-tenancy
4. Adds role-based restrictions (admin, manager, sales_rep, technician)
5. Uses auth.uid() for user-specific policies
6. Includes policy descriptions

## Quality checks
- ALWAYS filter by company_id for multi-tenancy isolation
- Use auth.uid() to get current user
- Separate policies per operation (SELECT, INSERT, UPDATE, DELETE)
- Admin role can bypass some restrictions
- Technicians only see assigned jobs
- Sales reps only see own leads/customers
- Enable RLS with: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

## Example output
```sql
-- Enable RLS on table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Admins see all invoices in their company
CREATE POLICY "Admins manage all invoices" ON invoices
  FOR ALL USING (
    (SELECT role FROM users WHERE user_id = auth.uid()) = 'admin'
    AND company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  );

-- Policy: Managers see all invoices in their company
CREATE POLICY "Managers view company invoices" ON invoices
  FOR SELECT USING (
    (SELECT role FROM users WHERE user_id = auth.uid()) IN ('admin', 'manager')
    AND company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  );

-- Policy: Technicians see invoices for their assigned jobs
CREATE POLICY "Techs see own job invoices" ON invoices
  FOR SELECT USING (
    job_id IN (
      SELECT job_id FROM jobs
      WHERE assigned_technician_id = auth.uid()
    )
  );

-- Policy: Users can only insert invoices for their company
CREATE POLICY "Users create company invoices" ON invoices
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  );
```

## Multi-tenancy pattern
Every policy MUST include company_id filter:
```sql
AND company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
```
