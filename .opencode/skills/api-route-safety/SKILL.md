---
name: api-route-safety
description: Enforce authentication, validation, idempotency, and multi-tenant scoping for app/api routes.
---

Checklist:
- Require auth (`requireUser`/`requireRole`/`requirePermission`) in `app/api/**/route.ts`.
- Scope DB queries by `company_id` (multi-tenant).
- Request validation schemas come from `lib/validators.ts` only.
- Retryable writes use `lib/idempotency.ts`.
- Sensitive actions log via `lib/auditLog.ts`.
