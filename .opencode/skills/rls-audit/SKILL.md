---
name: rls-audit
description: Audit RLS usage and multi-tenant safety for server data access.
---

Checklist:
- Prefer `createUserClient(accessToken)` (RLS enforced).
- Use `createAdminClient()` only when required and still scope by `company_id`.
- Verify soft-delete patterns (e.g., `deleted_at`) where applicable.
- If access seems wrong, use RLS diagnostic scripts and summarize findings.
