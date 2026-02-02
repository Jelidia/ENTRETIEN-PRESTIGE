# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

---

## ⚠️ CRITICAL: READ THIS FIRST ⚠️

### Token efficiency is mandatory (skills/agents first)

Before doing **any** work, follow these two decision trees:

#### Decision Tree 1 — Can a *skill* do this?

```
User asks for work
     ↓
Does a skill exist for this task?
     ↓
YES → INVOKE THE SKILL IMMEDIATELY ✅
     ↓
NO  → Continue to Decision Tree 2
```

**Skills available in this repo:** `api-builder`, `bug-fixer`, `spec-enforcer`, `test-generator`, `ui-builder`, `migration-builder`, `french-ui-helper`, `rls-policy-builder`, `supabase-query-builder`, `docs-updater`

#### Decision Tree 2 — Is this complex / multi-step?

```
Requires 2+ files OR API+UI+DB OR “production-ready” work?
     ↓
YES → DELEGATE TO AN AGENT IMMEDIATELY ✅
     ↓
NO  → Manual change is acceptable (but still prefer a skill)
```

**Agents available in this repo:** `prompt-director`, `feature-builder`, `database-architect`, `qa-engineer`, `bug-hunter`, `deploy-manager`, `code-reviewer`

---

## Reality check (status as of 2026-01-30)

This project is **not production-ready yet**. Several flows are incomplete or broken. Treat this section as the *starting checklist* before building new features.

### P0 production blockers (must fix before deploying)

**Security & auth**
- Public registration is enabled (`/api/auth/register`) without an allowlist / admin-only gate → **must disable in prod**.
- Open redirect risk on login/2FA: redirect targets must be validated (same-origin + allowlist paths).
- 2FA secrets stored in plaintext → must encrypt at rest; encryption must **fail closed** if `APP_ENCRYPTION_KEY` missing.
- 2FA/login rate limiting is **in-memory** (breaks on multi-instance deployments). Needs shared store (Redis/etc.).

**Webhooks / external integrations**
- Twilio inbound webhook endpoints must verify Twilio signatures (reject unsigned/invalid).
- Stripe webhook handling must verify signature and be idempotent (dedupe events; safe retries).
- Resend/Twilio/Maps/Stripe modules must fail explicitly by environment (no silent TODO no-ops).

**RLS / tenancy / soft delete**
- RLS policies are present but still require a full audit for all multi-tenant tables.
- Soft delete (`deleted_at`) exists but is not consistently filtered in queries; must standardize.

**Broken/incomplete product flows**
- Job photo upload flow has path/storage inconsistencies (client expects paths that API/storage don’t match).
- Some UI pages call APIs that don’t exist yet (404s) and some “stub” features show placeholder data.
- Invoice/receipt generation has missing edge cases (multi-page, totals/taxes correctness, line items, email send flow).

### Where the “source of truth” lives

1. **Specification:** `docs/spec/ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md`
2. **Deployment readiness:** `docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md`
3. **Master backlog (production-ready checklist):** `docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md`
4. **DB schema & migrations:** `supabase/schema.sql`, `supabase/migrations/*`
5. **API auth patterns:** `lib/auth.ts`, `lib/session.ts`, `middleware.ts`
6. **Validation:** `lib/validators.ts` (single source of truth)

If docs conflict with the code, run `spec-enforcer` and treat the **spec + code** as authoritative.

---

## Project overview

**Entretien Prestige** — mobile-first ERP for a Quebec cleaning company: dispatch, CRM, billing, SMS automation, sales pipeline, and commission tracking.

- **Stack:** Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL + RLS), Zod, Tailwind
- **Language:** French primary (UI/SMS/customer-facing); English for code/comments
- **Roles:** admin, manager, sales_rep, technician
- **Customer access:** no account; SMS/email links only

---

## Local commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run start
npm run lint
npm test           # vitest run --coverage
npm run test:watch
npm run typecheck
```

Prefer targeted tests first (e.g. `npx vitest run <file>`); run the full suite only when changes are broad or explicitly requested.

### Coverage note (important)
`vitest.config.ts` enforces **100% thresholds** but `coverage.all=false`, meaning untested files may not count. If you want “real” 100% repo coverage, set `coverage.all=true` and maintain explicit include/exclude lists.

---

## Architecture (actual repo layout)

```
app/                 # Next.js App Router pages + API routes
components/          # Shared UI components
lib/                 # Business logic & utilities
supabase/
  schema.sql         # Base schema snapshot
  migrations/        # Incremental SQL migrations
tests/               # Vitest tests
middleware.ts        # Auth protection + rate limiting
```

### Key entry points
- Auth + roles/permissions: `lib/auth.ts`, `lib/permissions.ts`
- Session/cookies: `lib/session.ts`
- Supabase clients: `lib/supabaseServer.ts`
- Zod schemas: `lib/validators.ts`
- Rate limiter: `lib/rateLimit.ts`
- Encryption: `lib/crypto.ts`
- Integrations: `lib/twilio.ts`, `lib/stripe.ts`, `lib/resend.ts`, `lib/maps.ts`

---

## Non-negotiable product constraints

- **Mobile-first only**: max width 640px; bottom navigation (no desktop sidebar).
- **Exactly 5 tabs per role** in `components/BottomNavMobile.tsx`.
- **French primary** for user/customer text.
- **No customer login** (SMS links + tokens).
- **No “TODO ships”**: if code is merged, it must be production-safe.

---

## Coding rules (must follow)

### 1) Authentication & authorization on every API route
All non-public API routes must call one of:
- `requireUser(request)`
- `requireRole(request, roles)`
- `requirePermission(request, permissions)`
- `requireRole(request, roles, permissions)`

Never rely on client-side discipline for role/tenant enforcement.

### 2) Validation must be centralized (Zod)
**Rule:** Do **not** create inline Zod schemas inside routes.

✅ Correct:
```ts
import { customerCreateSchema } from "@/lib/validators";
```

❌ Wrong:
```ts
const schema = z.object({ ... });
```

If a route needs new input validation, add/extend a schema in `lib/validators.ts`.

### 3) Multi-tenancy safety
- Prefer the **RLS-enforced client** (`createUserClient(accessToken)`).
- Every query should be RLS-safe. If you must use the service role client, do it only in tightly-scoped, server-only code and prefer security definer functions or RPCs.

### 4) Redirect safety
Never redirect to an arbitrary `redirect=` parameter. Only allow:
- same-origin relative paths
- allowlisted route prefixes (e.g. `/dashboard`, `/dispatch`, `/sales`, `/technician`)

### 5) External webhooks are hostile by default
- Verify signatures (Twilio/Stripe).
- Make handlers idempotent.
- Log request ids; don’t leak secrets/errors to clients.

---

## API route implementation pattern (canonical)

```ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getAccessTokenFromRequest } from "@/lib/session";
import { createUserClient } from "@/lib/supabaseServer";
import { someSchema } from "@/lib/validators";

export async function POST(request: Request) {
  // 1) Auth
  const auth = await requireRole(request, ["admin", "manager"]);
  if ("response" in auth) return auth.response;

  const token = getAccessTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2) Validate
  const body = await request.json();
  const parsed = someSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.format() },
      { status: 400 }
    );
  }

  // 3) DB (RLS client)
  const client = createUserClient(token);
  const { data, error } = await client.from("table").insert(parsed.data).select().single();

  if (error) {
    console.error("DB error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // 4) Respond
  return NextResponse.json({ success: true, data });
}
```

### Error response convention
Return consistent shapes:
```json
{ "error": "Human message", "details": { "optional": "debug info" } }
```

Use status codes: 200 / 400 / 401 / 403 / 404 / 429 / 500.

---

## Database & migrations

### Where schema lives
- Base: `supabase/schema.sql`
- Migrations: `supabase/migrations/*.sql`

**Do not** hand-edit old “remote_schema” snapshots unless you know why you’re doing it. Prefer forward-only migrations.

### RLS checklist (required before prod)
For each multi-tenant table:
- RLS enabled
- Policies cover SELECT/INSERT/UPDATE/DELETE appropriately
- `company_id` isolation is enforced
- “Technician only assigned jobs” is enforced where relevant
- Soft delete (`deleted_at`) is excluded by default

---

## Integrations (hard requirements)

### Twilio
- All inbound webhooks must verify Twilio signatures.
- Normalize phone numbers to E.164.
- Don’t store raw inbound payloads without redaction.
- Avoid duplicate sends (idempotency keys per event/job).

### Stripe
- Amounts must be handled in the correct unit (cents) consistently.
- Webhooks must verify `STRIPE_WEBHOOK_SECRET` and be idempotent.
- Store payment state transitions (pending → paid → refunded) and reconcile with Stripe events.
- Never trust client-provided amounts.

### Resend
- Use environment guards: in dev/test, either no-op with explicit response or use a sandbox email.
- Template all customer-facing emails in French.

### Google Maps
- Don’t call Maps APIs without explicit env var presence.
- Cache geocoding results; rate limit requests.

---

## Testing expectations

- Add tests for all new business logic in `lib/`.
- Add integration tests for API routes (mock Supabase client).
- Add component tests for key UI (BottomNav must always render 5 tabs).
- Prefer the smallest relevant test run; avoid full-suite runs unless required or requested.

When touching an area, add regression tests for any bug you fix.

---

## Known gaps (you should expect to implement/fix)

This is a *non-exhaustive* map; see the master backlog for the full list.

### Core platform gaps
- Full RLS audit + write policies across all tables.
- Standardized “soft delete filtered by default” query helpers.
- Production-grade logging (structured logs + request IDs).
- CI pipeline (lint + typecheck + tests) and “fail on TS errors”.

### Feature gaps (ERP completeness)
- Leads/sales pipeline: missing endpoints/flows and incomplete UI states.
- Dispatch: conflict detection, technician routing, real-time updates, and “schedule view” polish.
- Invoices/payments: line items, Quebec taxes, PDF correctness, email send, payment reconciliation.
- Photo requirements: enforce 8 photos (4 sides × before/after) and block completion until satisfied.
- Customer ratings: token-based public page, Google redirect flow, tech bonus accounting.
- Subscriptions & loyalty: schema exists/planned but not fully wired end-to-end.
- Notifications: unified center + preferences + delivery policies.
- Admin settings: company profile, commission settings, roles/permissions UI completeness.

### UX/DX gaps
- Remove placeholder/stub UI and fake data paths.
- Ensure consistent API error shapes consumed by the frontend.
- Replace `console.*` with structured logger for production.

---

## Skills & agents reference (how to invoke)

### Skills
Use these first when possible (they enforce repo patterns).

Examples (Claude Code slash commands):
```bash
/api-builder Create POST /api/customers/:id/blacklist with Zod + RLS
/bug-fixer Fix job photo upload 500 error and missing storage path validation
/test-generator Add tests for lib/crypto.ts (encrypt/decrypt) with 100% coverage
/ui-builder Build technician job checklist screen (mobile-first, French labels)
/migration-builder Add table job_checklists with RLS and indexes
/rls-policy-builder Add RLS for invoices with company_id isolation
/docs-updater Update docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md after implementing Stripe webhook idempotency
/spec-enforcer Verify current implementation vs spec sections 1–10
```

### Agents
Use these for multi-step features and production prep.

Examples:
- “Use the **feature-builder** agent to implement the full job photo workflow (API + UI + tests + docs).”
- “Use the **deploy-manager** agent to prepare the repo for production (CI, env validation, security checklist).”
- “Use the **bug-hunter** agent to find all auth bypass and redirect vulnerabilities.”

---

## Environment variables

Template lives in `.env.example`.

### Required for production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `APP_ENCRYPTION_KEY` (**required**, fail closed)
- `NEXT_PUBLIC_BASE_URL`

### Integrations
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Google Maps: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Important:** `lib/env.ts` currently only warns on missing vars and does not validate the full required set. Fix it so production boot fails when required vars are missing.

---

## Deployment notes

Follow `docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md` for readiness status and blockers.

Minimum production checks:
- `npm run build` succeeds
- `npm run lint` has zero errors (and consider removing `eslint.ignoreDuringBuilds`)
- `npm test` passes
- Webhook secrets set; signatures verified
- RLS audited and validated for every tenant table
- Rate limiting uses shared store
- Encryption keys enforced; 2FA secrets encrypted
- CSP reviewed (minimize `unsafe-inline`/`unsafe-eval` if possible)

---

## Documentation index

- `docs/spec/ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md` — requirements/spec
- `docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md` — production-readiness checklist
- `docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md` — full backlog to reach production
- `CRITICAL_FIXES_README.md` — immediate fixes overview
- `docs/ops/TROUBLESHOOTING.md` — known issues & debugging
- `.claude/AGENTS_GUIDE.md`, `.claude/SKILLS_GUIDE.md` — Claude Code configuration

---
