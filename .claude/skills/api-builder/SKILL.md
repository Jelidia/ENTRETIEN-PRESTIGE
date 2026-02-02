---
name: api-builder
description: Generate production-ready Next.js API routes with Zod validation, RLS filters, and error handling. Use when creating new API endpoints.
argument-hint: "Endpoint path and fields/requirements (e.g., 'Create /api/sales/dashboard with leads_count, revenue')"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
model: claude-sonnet-4-5-20250929
context: fork
agent: feature-builder
hooks:
  - type: PostToolUse
    tool: Write
    condition: path.includes('app/api/')
    script: !`.claude/hooks/validate-api-route.sh`
  - type: PostToolUse
    tool: Write
    condition: path.includes('app/api/')
    script: !`npm run lint -- --fix ${path}`
---

# api-builder Skill
## Generate production-ready Next.js API routes

## When to use
Creating new endpoints (/api/sales/dashboard, /api/ratings/*, etc)

## Example
`/api-builder Create /api/sales/dashboard with fields: leads_count, closed_this_month, revenue`

## What it does
1. Reads system-prompt.txt (knows your rules)
2. References docs/ai/claude/CLAUDE.md (knows your architecture)
3. Uses schemas from lib/validators.ts (no inline Zod)
4. Generates endpoint with Auth → Validate → RLS Query → Respond
5. Applies company_id filter (RLS)
6. Returns ONLY code, no explanation

## Quality checks
- Zod validation present
- Validation schema imported from lib/validators.ts
- company_id filter applied
- Error handling with status codes
- TypeScript strict mode
- Matches naming conventions
