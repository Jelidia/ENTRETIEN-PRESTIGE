---
description: Review current git diff for security/RLS/validation/spec issues (no edits).
agent: review
subtask: true
---

Current git diff:
!git diff

Please review:
- Security/auth on API routes
- RLS + company_id scoping
- Zod validation (from lib/validators.ts)
- Quebec French UI strings
- Repo conventions

Output:
- Findings grouped by severity
- Concrete file/line suggestions
- A short checklist of what to validate manually
