---
name: migration-builder
description: Generate SQL migration files with RLS policies, triggers, and indexes. Creates Quebec-compliant database schemas for Supabase PostgreSQL.
argument-hint: "Migration description (e.g., 'Add loyalty_rewards table with points tracking')"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
model: claude-sonnet-4-5-20250929
context: fork
agent: database-architect
hooks:
  - type: PreToolUse
    tool: Write
    condition: path.includes('db/migrations/')
    message: "Ensure: company_id column, RLS policies, indexes, timestamps"
  - type: PostToolUse
    tool: Write
    condition: path.includes('db/migrations/')
    script: !`.claude/hooks/validate-migration-syntax.sh`
  - type: PostToolUse
    tool: Write
    condition: path.includes('db/migrations/')
    script: !`.claude/hooks/check-rls-policies.sh`
---

# migration-builder Skill
## Generate SQL migration files for Supabase

## When to use
Adding/modifying database tables, columns, RLS policies, or indexes

## Example
`/migration-builder Add contract_url, contract_status, id_photo_url, profile_photo_url to users table`

## What it does
1. Reads db/schema.sql and existing migrations
2. Generates timestamped migration file (YYYYMMDD_description.sql)
3. Includes:
   - ALTER TABLE statements
   - RLS policies (company_id filtering)
   - Indexes for performance
   - Comments explaining each change
4. Follows Supabase naming conventions
5. Includes rollback statements

## Quality checks
- RLS policies filter by company_id for multi-tenancy
- Enum types for status fields
- NOT NULL constraints where appropriate
- Foreign keys with ON DELETE CASCADE/SET NULL
- Indexes on frequently queried columns
- Timestamps (created_at, updated_at) with defaults

## Example output
```sql
-- Migration: Add document URLs to users table
-- Date: 2026-01-28

-- Add columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS contract_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contract_status TEXT CHECK (contract_status IN ('approved', 'pending', 'rejected'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Create RLS policy for document access
CREATE POLICY "Users can view own documents" ON users
  FOR SELECT USING (user_id = auth.uid());

-- Rollback (comment out to apply)
-- ALTER TABLE users DROP COLUMN contract_url;
-- ALTER TABLE users DROP COLUMN contract_status;
-- ALTER TABLE users DROP COLUMN id_photo_url;
-- ALTER TABLE users DROP COLUMN profile_photo_url;
```
