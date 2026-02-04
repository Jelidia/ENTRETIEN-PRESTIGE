# ENTRETIEN PRESTIGE — Master Production Readiness Remediation & Missing Features Backlog

**Scan date:** 2026-01-30
**Last updated:** 2026-01-31

---

## Recent Implementation (2026-01-31)

### Phase 1: Core Settings & Team Management - ✅ COMPLETE

**Implemented Features:**
1. ✅ **Internationalization (i18n) System**
   - Created `lib/i18n.ts` with French/English translations
   - Created `contexts/LanguageContext.tsx` with React context
   - Added language toggle in user settings
   - 150+ translation keys covering all UI elements

2. ✅ **User Settings Page Rebuild** (`/settings`)
   - Profile tab: name, email, phone, avatar management
   - Security tab: password change with strength indicator
   - Language tab: French/English toggle
   - All features fully functional with French labels

3. ✅ **Admin Management Page** (`/admin/manage`)
   - Moved complex admin features from settings
   - 2FA setup, role permissions, user overrides
   - Notification settings

4. ✅ **Enhanced Team Page** (`/team`)
   - Added permission editing modal
   - Custom permissions with visual badges
   - Reset to role defaults functionality

5. ✅ **Profile API Extension** (`/api/settings/profile`)
   - Added email and phone update support
   - Extended validator with optional fields
   - Audit logging for all changes

6. ✅ **CSS Enhancements**
   - Modal overlay and dialog styles
   - Tab navigation styles
   - Pill and tag badge styles

**Build Status:** ✅ TypeScript passes, Production build succeeds

**Next Phase:** French localization audit + non-functional button fixes

---

This document is a **single, end‑to‑end backlog** of *everything that must be fixed, completed, hardened, or added* to make the `ENTRETIEN-PRESTIGE-main` codebase **production‑ready to deploy**.

It merges:
- the provided `Updated Production Backlog` items (security, CI, env validation, etc.)
- findings from prior code scans / deep analysis
- **a fresh codebase re-scan** (API routes, Supabase schema, migrations, UI fetch contracts, and critical flows)

> Guiding rule for implementation: **no “demo”, “mock fallback”, or “fail-open” behavior in production**. If a dependency (Stripe/Twilio/Resend/Supabase secrets) is missing, the system must either (a) hard‑fail at boot in production, or (b) disable the feature explicitly and visibly (admin UI + logs), never silently.

---

## Executive summary — What blocks production today

### Biggest release blockers (P0)

1. **Database/schema drift:** code references tables that are **not in `supabase/schema.sql`** (and the `remote_schema` dumps in `supabase/migrations` are not safe as real migrations). Result: key features *cannot work on a clean deploy*.
   - Missing tables used by code: `customer_ratings, employee_availability, google_review_bonuses, job_photos`
   - Tables present but unused (either implement or remove): `customer_communication, job_history, technician_location_daily`

2. **Authorization gaps and permission model problems:** current permission flags allow roles (notably **technician**) to hit endpoints they should never have access to (company settings, broad reports, deleting jobs, etc.), and RLS is not aligned to expected role capabilities.

3. **Broken or incomplete core flows:**
   - **Leads:** UI calls `/api/leads…` but the API does not exist.
   - **Job photo upload:** UI expects `uploadUrl` but `/api/uploads` returns a different shape, and technicians are blocked by role requirements.
   - **Customer ratings/reviews:** token validation exists, but **token generation + ratings persistence tables are missing**, and token table RLS is dangerously permissive.
   - **Invoice PDF:** `/api/invoices/[id]/pdf` selects columns (`invoice_date`, `gst_amount`, `qst_amount`) that do not exist, so PDF generation fails.

4. **Security hardening still required:** encryption fails open without `APP_ENCRYPTION_KEY`, rate limiting is in‑memory, webhook signature verification is missing/partial, and several endpoints are not safely idempotent with external side-effects.
- ⚠️ **CURRENT STATUS:** Rate limiting is **TEMPORARILY DISABLED** in `lib/rateLimit.ts` for testing. Must be re-enabled before production.

5. **Production engineering missing:** CI with `npm run typecheck`, standardized API error responses, request IDs, structured logging, and E2E tests.

---

## Quick reference — Verified contract mismatches & missing endpoints

### Missing API endpoints (frontend calls → 404 today)
- **`/api/leads`** (GET/POST) and **`/api/leads/[id]`** (GET/PATCH/DELETE) and **`/api/leads/[id]/activity`** (GET/POST).

### Broken flows due to response/field mismatch
- **Job photos:** `components/JobPhotoUpload.tsx` expects `/api/uploads` to return `uploadUrl`; it currently returns `{ path, field }` (no `uploadUrl`).
- **Invoice PDF:** `/api/invoices/[id]/pdf` selects missing columns → runtime error.
- **Logout:** `app/(app)/profile/page.tsx` tries to clear HttpOnly cookie client-side → cookie remains; must call `/api/auth/logout`.

### Schema drift — code uses tables missing from `supabase/schema.sql`

These are referenced by API routes but missing from the local schema:
- `customer_ratings`
- `employee_availability`
- `google_review_bonuses`
- `job_photos`

---

## Master backlog (prioritized) — everything to fix & add for production

### Priority legend
- **P0 — Release blocker:** do not deploy before completion.
- **P1 — High:** deployable without it only if risk accepted; generally required for first real customers.
- **P2 — Medium:** important quality/scale/UX improvements.
- **P3 — Product expansion:** not required for “MVP production”, but likely needed to match the spec/business.

---

## P0 — Database, schema drift, and RLS must be fixed first

### - [x] EP-P0-DB-01 — Make Supabase schema & migrations reproducible from scratch (remove drift)
**Priority:** P0

**Why it matters**
- Right now, a clean deploy cannot be trusted because `supabase/schema.sql`, the `remote_schema` dumps, and the code disagree on which tables/columns exist. Production requires that **one command** can rebuild the DB reliably.

**Where**
- `supabase/schema.sql`
- `supabase/migrations/20260129080548_remote_schema.sql`
- `README / deployment docs`

**What to change**
- Decide the **single source of truth**: either (A) `schema.sql` + proper incremental migrations, or (B) migrations only generated by `supabase db diff`.
- Convert the `remote_schema` dumps into **real migrations** that are safe on an empty DB (avoid `ALTER TABLE ...` on tables that may not exist; prefer `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE IF EXISTS`, or split into ordered migrations).
- Add a CI job: `supabase db reset` (or equivalent) must succeed on a fresh DB, then `npm run build` must succeed.
- Document the exact migration command sequence for prod (Supabase CLI vs dashboard).

**Acceptance criteria**
- A fresh DB can be created locally with Supabase CLI without manual steps.
- All migrations apply cleanly in order with no missing-table errors.
- App boots and core API routes function with that fresh schema.

### - [x] EP-P0-DB-02 — Create the missing tables referenced by the API routes
**Priority:** P0

**Why it matters**
- Several API routes write/read tables that do not exist in `supabase/schema.sql`, so those routes will crash in production unless the DB is manually patched.

**Where**
- `app/api/ratings/submit/route.ts (customer_ratings, google_review_bonuses)`
- `app/api/jobs/[id]/photos/route.ts (job_photos)`
- `app/api/users/[id]/availability/route.ts (employee_availability)`
- `supabase/schema.sql`

**What to change**
- Add migrations to create the following tables (with FKs + indexes + timestamps + RLS):
-   - `customer_ratings, employee_availability, google_review_bonuses, job_photos`
- Minimum expected columns (based on code usage):
-   - `job_photos`: photo_id (uuid pk), job_id (fk), uploaded_by, photo_type, side, photo_url, created_at, company_id (recommended) or derive via job
-   - `employee_availability`: availability_id (uuid pk), employee_id (fk), start_date, end_date, availability_type, notes, created_at, company_id (recommended)
-   - `customer_ratings`: rating_id (uuid pk), job_id, customer_id, technician_id, rating, review_text, nps_score, contacted_for_review, google_review_intent, created_at, company_id (recommended)
-   - `google_review_bonuses`: bonus_id (uuid pk), technician_id, job_id, amount, status, created_at, company_id (recommended)
- Add RLS so users can only access rows in their company, and restrict writes to allowed roles (admin/manager/system).

**Acceptance criteria**
- Those tables exist in the DB after migrations.
- All referenced API routes run without “relation does not exist” errors.
- RLS is enabled and tested for each new table.

### - [x] EP-P0-DB-03 — Fix invoice tax/date fields so PDF + accounting works
**Priority:** P0

**Why it matters**
- The invoice PDF endpoint queries non-existent columns (`invoice_date`, `gst_amount`, `qst_amount`). This blocks invoice PDF generation and creates accounting ambiguity (QC invoices typically require GST/QST breakdown).

**Where**
- `app/api/invoices/[id]/[action]/route.ts (pdf action)`
- `lib/pdf.ts`
- `supabase/schema.sql (invoices table)`

**What to change**
- Choose one approach and apply consistently:
-   1) **Add columns** to `invoices`: `gst_amount`, `qst_amount`, and optionally rename/alias `issued_date` ↔ `invoice_date` (or update code).
-   2) **Or compute** GST/QST in code from `subtotal` and known rates, and stop selecting missing columns.
- Update the PDF route to select the real column names that exist.
- Add regression tests for PDF generation on a sample invoice.

**Acceptance criteria**
- `/api/invoices/:id/pdf` returns a valid PDF for a real invoice.
- PDF displays correct totals and GST/QST (or explicit tax breakdown per chosen model).

### EP-P0-DB-04 — Enforce soft-delete semantics everywhere (API + RLS)
**Priority:** P0

**Why it matters**
- Tables include `deleted_at` but most queries do not filter it; deleted records can leak into the UI and reports, and can still be modified.

**Where**
- `supabase/schema.sql (customers, jobs, etc.)`
- `app/api/* (customers, jobs, invoices, leads, reports)`

**What to change**
- Define a consistent rule: soft-deleted rows must be invisible to non-admins by default.
- Option A (recommended): enforce in **RLS policies** (e.g., `deleted_at is null`) so even direct client queries can’t see them.
- Option B: enforce via **views** (e.g., `active_customers`) and have the app only query views.
- Update every list/detail query to exclude `deleted_at` unless explicitly requested by an admin “include deleted” toggle.

**Acceptance criteria**
- Soft-deleted customers/jobs never appear in normal lists, dashboards, exports, or reports.
- Attempts to update soft-deleted rows are rejected unless explicitly allowed for admin restore flows.

### EP-P0-DB-05 — RLS audit + role alignment (company isolation is not enough)
**Priority:** P0

**Why it matters**
- Current policies largely gate by `company_id` only. That prevents cross-company leaks, but it does **not** enforce business rules like “technicians can’t delete jobs” or “technicians shouldn’t see all customers & reports”.

**Where**
- `supabase/schema.sql (RLS policies for jobs, customers, companies, user_audit_log, sms_messages, etc.)`
- `lib/permissions.ts`
- `lib/auth.ts`
- `app/api/jobs/[id]/route.ts (DELETE/PATCH)`
- `app/api/company/route.ts (company update)`

**What to change**
- Write a **permissions matrix** (see later section) that defines row-level access per role.
- Update RLS policies to enforce role-based access where the DB is directly queried by user tokens, OR switch server routes to use service role + explicit server authorization (but do not mix haphazardly).
- Critical fixes to include:
-   - Companies update: only admin/manager can update company row (including role_permissions).
-   - Users select/manage: managers likely need read access to team; if so, extend policies accordingly.
-   - Jobs: technicians should only update allowed fields (status/check-in/out/notes), never delete or change pricing/schedule.
- Add automated tests that assert RLS behavior for each role.

**Acceptance criteria**
- No role can access or mutate data outside its allowed scope even if calling Supabase directly.
- All role-specific constraints are enforced server-side and/or via RLS (not just UI).

## P0 — Security & authentication hardening (must be correct before real users)

### - [x] EP-P0-SEC-01 — Enforce encryption key and stop crypto from failing open
**Priority:** P0

**Why it matters**
- `lib/crypto.ts` returns plaintext when `APP_ENCRYPTION_KEY` is missing. That can store MFA secrets and session payloads unencrypted (or make decryption silently wrong).

**Where**
- `lib/crypto.ts`
- `lib/security.ts (2FA secret + challenge payload encryption)`
- `.env.example`
- `deployment configuration`

**What to change**
- In production (`NODE_ENV=production`), **crash the app at boot** if `APP_ENCRYPTION_KEY` is missing or invalid.
- Validate key format and length (32 bytes for AES-256-GCM after base64 decode).
- Add a one-time migration/command to re-encrypt existing secrets if they were stored unencrypted in earlier environments.
- Add unit tests for encrypt/decrypt with valid key, invalid key, missing key.

**Acceptance criteria**
- App cannot start in production without a valid `APP_ENCRYPTION_KEY`.
- 2FA secrets and challenge session payloads are stored encrypted at rest.

### EP-P0-SEC-02 — Replace in-memory rate limiting with a shared production store
**Priority:** P0

**Why it matters**
- Current rate limiting uses a process-local Map. In serverless/multi-instance production it is ineffective and can be bypassed by hitting different instances; it can also leak memory over time.

**Where**
- `lib/rateLimit.ts`
- `middleware.ts`
- `auth routes (login, verify-2fa, forgot/reset password)`

**What to change**
- Move rate limiting to a shared store (Upstash Redis, Supabase, or another managed Redis).
- Implement per-route quotas: e.g., login attempts, OTP verify attempts, password reset requests, webhook endpoints, SMS send.
- Store and enforce challenge-specific attempt counts (OTP brute force) in DB (e.g., `auth_challenges.attempt_count`).
- Add observability: log when limits are hit + include request ID.

**Acceptance criteria**
- Rate limits hold across multiple instances.
- OTP brute force is prevented with a strict attempt limit and lockout per challenge + per account/IP.

### - [x] EP-P0-SEC-03 — Lock down customer rating token RLS (currently dangerously permissive)
**Priority:** P0

**Why it matters**
- The `customer_rating_tokens` policies allow broad public access; attackers could enumerate tokens, view job/customer relationships, or submit fraudulent reviews.

**Where**
- `supabase/migrations/20260129120000_add_customer_rating_tokens.sql`
- `app/api/ratings/validate/route.ts`
- `app/api/ratings/submit/route.ts`
- `app/(public)/rate/[token]/page.tsx`

**What to change**
- Remove public SELECT/UPDATE policies on `customer_rating_tokens`.
- Keep token validation & submission strictly through server endpoints using the service role.
- Store only **hashed tokens** in DB (never raw), and compare using constant-time checks.
- Add an expiry + single-use enforcement (`used_at` must be NULL when redeeming).

**Acceptance criteria**
- Anonymous clients cannot read/update `customer_rating_tokens` directly via Supabase.
- Tokens cannot be reused; expired tokens are rejected.
- Only the server can validate/consume tokens.

### - [x] EP-P0-SEC-04 — Fix open redirect risks in auth UI
**Priority:** P0

**Why it matters**
- Login and 2FA verification accept a `redirect` query param and push to it without strict validation.

**Where**
- `components/auth/LoginForm.tsx`
- `components/auth/VerifyTwoFactorForm.tsx`
- `middleware.ts (login redirect param generation)`

**What to change**
- Allow redirects **only** to relative paths starting with `/` and disallow `//`, `http:`, `https:` and other schemes.
- Optionally maintain an allowlist of known safe routes (`/dashboard`, `/dispatch`, etc.).
- Add unit tests for redirect sanitizer.

**Acceptance criteria**
- Passing `redirect=https://evil.com` does not redirect off-site.
- Legitimate internal redirects still work.

### - [x] EP-P0-SEC-05 — Fix idempotency and ordering for external side-effects (SMS/email/payments)
**Priority:** P0

**Why it matters**
- Some endpoints perform an external action (e.g., send SMS) before writing an idempotency record. Retries can duplicate real-world actions.

**Where**
- `app/api/sms/[action]/route.ts (send action sends before beginIdempotency)`
- `app/api/email/[action]/route.ts`
- `app/api/payments/[action]/route.ts (stripe callback idempotency)`
- `lib/idempotency.ts`

**What to change**
- For any route that calls Twilio/Resend/Stripe:
-   - Persist an idempotency key **before** the external call, or
-   - Persist the outgoing message/payment intent first, then process asynchronously, or
-   - Use the provider’s idempotency primitives and store provider IDs in DB.
- Implement provider-specific dedupe keys:
-   - Twilio inbound: store `MessageSid` (unique) to dedupe.
-   - Stripe webhook: store `event.id` to dedupe.

**Acceptance criteria**
- Retrying the same request does not send duplicate SMS/emails or double-process payments.
- Webhook processing is idempotent.

### - [x] EP-P0-SEC-06 — Require and verify webhook signatures (Twilio at minimum)
**Priority:** P0

**Why it matters**
- Inbound webhooks are a common attack vector. Twilio signature verification is not implemented.

**Where**
- `app/api/sms/[action]/route.ts (webhook)`
- `Twilio configuration docs`

**What to change**
- Validate Twilio signatures for inbound webhooks (use the official algorithm and the auth token).
- Reject requests with invalid/missing signatures (401).
- Add tests with known Twilio signature fixtures.

**Acceptance criteria**
- Only legitimate Twilio webhooks are accepted.
- Invalid signature requests are rejected and logged with request ID.

### EP-P0-SEC-07 — Decide and enforce the registration model (self-signup vs invite-only)
**Priority:** P0

**Why it matters**
- An unauthenticated `/api/auth/register` endpoint exists. If production is invite-only / admin-managed, this is an attack surface.

**Where**
- `app/api/auth/register/route.ts`
- `public site routes`

**What to change**
- If self-signup is NOT intended: disable the endpoint in production or require an admin invite code.
- If self-signup IS intended: add email verification, CAPTCHA, stricter rate limiting, and anti-abuse monitoring.

**Acceptance criteria**
- Registration behavior matches the business model and cannot be abused to create unlimited companies/users.

### - [x] EP-P0-SEC-08 — Stop using “cookie presence” as authentication in middleware (validate session)
**Priority:** P0

**Why it matters**
- Middleware currently gates UI routes by checking if a cookie exists, not whether it is valid. Combined with mock fallbacks, this can leak UI state and create confusing behavior.

**Where**
- `middleware.ts`
- `lib/queries.ts (mock fallback behavior)`
- `app/(app)/layout.tsx`

**What to change**
- Implement server-side auth gating in `app/(app)/layout.tsx` (or a shared server utility) that validates the Supabase session and redirects to login if invalid.
- In middleware, only do lightweight routing; rely on server auth checks for correctness.
- Remove any mock fallback that displays data when auth is missing/invalid.

**Acceptance criteria**
- If a session is expired/invalid, the user is redirected to `/login` (no partially-rendered app pages).
- No dashboard data is shown without verified auth.

### - [x] EP-P0-SEC-09 — Fix idempotency storage for unauthenticated endpoints (RLS currently blocks it)
**Priority:** P0

**Why it matters**
- Several unauthenticated endpoints call `beginIdempotency` with an anon client and `scope=ip:…`. Current RLS only allows `scope=user:${auth.uid()}`, so idempotency silently fails and retries can duplicate actions (SMS/email/password flows).

**Where**
- `lib/idempotency.ts`
- `supabase/schema.sql (idempotency_keys RLS policies)`
- `app/api/auth/login/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/api/auth/refresh-token/route.ts`

**What to change**
- Pick one solution (recommended):
-   - Use the **service-role client** for idempotency records on unauthenticated routes (scope by `ip:` or `session:`).
-   - OR move idempotency for unauth flows to Redis with TTL.
- Do **not** weaken RLS to allow arbitrary anon inserts into `idempotency_keys` unless you also add strong anti-abuse controls.
- Add tests that prove duplicate POSTs do not duplicate side effects.

**Acceptance criteria**
- Unauth endpoints correctly enforce idempotency across retries.
- No RLS errors are swallowed for idempotency writes in production logs.

### - [x] EP-P0-SEC-10 — Fix 2FA challenge security (single SMS, non-reusable codes, attempt limits)
**Priority:** P0

**Why it matters**
- Current 2FA flow sends **two SMS** (one with the code, one generic) and challenges can be reused because `consumeChallenge()` does not check `consumed_at` and does not enforce attempt counts.

**Where**
- `lib/security.ts (createChallenge, sendTwoFactorCode, consumeChallenge)`
- `app/api/auth/login/route.ts (calls createChallenge + sendTwoFactorCode)`
- `app/api/auth/verify-2fa/route.ts`
- `supabase/schema.sql (auth_challenges table)`

**What to change**
- Send only **one** SMS per challenge, and that SMS must contain the code.
- Refactor so either:
-   - `createChallenge()` generates + stores hash and returns plaintext code to the server caller, and `sendTwoFactorCode()` sends that code, OR
-   - `createChallenge()` both creates and sends, and `sendTwoFactorCode()` is removed from login flow.
- Enforce single-use challenges:
-   - `consumeChallenge()` must require `consumed_at is null` and set it atomically.
- Add brute-force protection:
-   - add `attempt_count` column (if missing) and increment per failed verify; lock challenge after N attempts.
- Add per-account + per-IP rate limits for verify.

**Acceptance criteria**
- Login 2FA sends exactly one SMS containing the verification code.
- A consumed challenge cannot be used again.
- After N failed attempts, the challenge is locked and further attempts are rejected.

### - [x] EP-P0-UI-01 — Allow Supabase Storage images through Next/Image and CSP (avatars, job photos)
**Priority:** P0

**Why it matters**
- Next.js image optimization and CSP currently block images served from Supabase Storage, breaking avatars and any uploaded photos/doc previews.

**Where**
- `next.config.js (images.domains / remotePatterns, CSP `img-src`)`
- `app/(app)/profile/page.tsx (uses next/image for avatar)`
- `job photo/doc preview components`

**What to change**
- Parse the hostname from `NEXT_PUBLIC_SUPABASE_URL` at build time and add it to `images.remotePatterns` (or `images.domains`).
- Update CSP `img-src` to allow that Supabase storage host.
- Add regression test or manual QA checklist that confirms avatars render in production build.

**Acceptance criteria**
- Avatars and Supabase-hosted images render correctly in production with CSP enabled.
- No CSP violations for legitimate image loads.

## P0 — Fix broken user journeys (must work end-to-end)

### - [x] EP-P0-FLOW-01 — Implement proper logout everywhere (server clears HttpOnly cookies)
**Priority:** P0

**Why it matters**
- Client-side logout cannot clear HttpOnly cookies; current profile logout leaves the session active, creating security and UX problems.

**Where**
- `app/(app)/profile/page.tsx`
- `app/api/auth/logout/route.ts`
- `components/TopBar.tsx (if it has logout)`

**What to change**
- Replace client-side cookie clearing with a call to `/api/auth/logout`.
- Ensure logout clears both access + refresh cookies and invalidates any server-side session records if used.
- After logout, redirect to `/login` and clear any local UI caches.

**Acceptance criteria**
- After logout, protected routes redirect to login.
- Access token cookie is not present and Supabase `getUser()` fails.

### EP-P0-FLOW-02 — Make job photo uploads work end-to-end (upload + DB record + viewing)
**Priority:** P0

**Why it matters**
- Job photo uploads are currently broken due to response contract mismatch and role restrictions; job QA and proof-of-work are core operations.

**Where**
- `components/JobPhotoUpload.tsx`
- `app/api/uploads/route.ts`
- `app/api/jobs/[id]/photos/route.ts`
- `supabase storage buckets/policies`
- `DB: job_photos table (missing in schema.sql)`

**What to change**
- Pick ONE upload approach and standardize:
-   - Option A: `/api/jobs/:id/photos` accepts multipart upload, stores file, creates DB row, returns signed URL.
-   - Option B: `/api/uploads` uploads file and returns `{ path, signedUrl }`, then client calls `/api/jobs/:id/photos` with the path.
- Ensure technicians can upload job photos (role allowance) but only for jobs assigned to them.
- Use private storage + signed URLs (never public URLs for internal photos).
- Update UI to show uploaded photos and allow delete (with audit).

**Acceptance criteria**
- Technician can upload photos for an assigned job and immediately see them in UI.
- Photos are stored privately and only authorized users can access via signed URLs.
- DB contains an accurate record (photo_type, side, uploader, timestamps).

### EP-P0-FLOW-03 — Implement Leads API to match the Sales Leads UI
**Priority:** P0

**Why it matters**
- Sales UI depends on `/api/leads` endpoints that do not exist, blocking lead intake and pipeline management.

**Where**
- `app/(app)/sales/leads/page.tsx (fetches /api/leads, /api/leads/:id, /api/leads/:id/activity)`
- `supabase/schema.sql (leads table exists)`

**What to change**
- Create routes:
-   - `GET /api/leads` (filter by company + role; pagination + search)
-   - `POST /api/leads` (create)
-   - `GET /api/leads/:id` (details)
-   - `PATCH /api/leads/:id` (update status, assignment, fields)
-   - `DELETE /api/leads/:id` (soft delete if required)
-   - `GET/POST /api/leads/:id/activity` (notes, calls, SMS, status changes)
- Add Zod schemas for lead create/update and activity entries.
- Add audit log entries for status changes and assignment.

**Acceptance criteria**
- Sales Leads page loads, creates leads, updates status, and displays activity.
- Role rules enforced (sales reps see their leads; managers/admin see all).

### EP-P0-FLOW-04 — Finish the customer rating/review workflow (tokens → rating → bonus)
**Priority:** P0

**Why it matters**
- Rating endpoints exist but the workflow is incomplete: token generation after jobs, missing persistence tables, and unsafe RLS.

**Where**
- `app/api/ratings/validate/route.ts`
- `app/api/ratings/submit/route.ts`
- `supabase/migrations/20260129120000_add_customer_rating_tokens.sql`
- `jobs complete flow: app/api/jobs/[id]/[action]/route.ts (complete)`

**What to change**
- After job completion (or invoice paid), generate a single-use rating token and store hashed token.
- Send the rating link to the customer via SMS/email (template + opt-out rules).
- Add `customer_ratings` and `google_review_bonuses` tables (see EP-P0-DB-02) OR adjust code to existing schema.
- Define bonus logic in one place (configurable amount, thresholds, manager approval).
- Make the public rating page robust: validation errors, expired token UX, accessibility, French copy.

**Acceptance criteria**
- Customer receives a working rating link for a completed job.
- Submitting a rating writes a DB record and marks token used.
- If rating qualifies, a bonus record is created and appears in technician earnings.

### - [x] EP-P0-FLOW-05 — Remove mock fallback data in production dashboards
**Priority:** P0

**Why it matters**
- `lib/queries.ts` returns fallback/mock data when auth fails or queries error. In production, this hides failures and can mislead operators.

**Where**
- `lib/queries.ts`
- `lib/data.ts`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/dispatch/page.tsx (if using query helpers)`

**What to change**
- Delete all “fallback/mock” returns for production paths.
- Replace with explicit error handling: show empty state + actionable error message; log with request ID.
- Make auth-required queries fail closed: redirect to login or show “Session expired”.

**Acceptance criteria**
- No route returns fake data in any environment except explicit dev-only storybooks/tests.
- Failures are visible and actionable (UI + logs).

## P0 — Payments, invoices, and financial integrity

### EP-P0-PAY-01 — Harden Stripe payment flow (intent creation, webhook, idempotency, persistence)
**Priority:** P0

**Why it matters**
- Payment processing must be tamper-proof and idempotent. Current Stripe integration contains “demo/fail-open” branches and lacks full ledgering.

**Where**
- `lib/stripe.ts`
- `app/api/payments/[action]/route.ts (init, callback, interac)`
- `supabase/schema.sql (invoices table)`

**What to change**
- In production, require `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (boot-time validation).
- Store Stripe IDs on the invoice: `stripe_payment_intent_id`, `stripe_charge_id` (if needed), `stripe_customer_id` (optional).
- Use Stripe idempotency keys when creating payment intents.
- In the webhook/callback:
-   - Verify signature
-   - Deduplicate by `event.id`
-   - Update invoice/payment status in a transaction-like RPC (or careful ordering)
-   - Record a payment event record (new `payments` ledger table recommended).

**Acceptance criteria**
- Stripe payments reliably mark invoices paid exactly once.
- Replay of webhook events does not double-process.
- Invoice shows traceable Stripe references for reconciliation/refunds.

### EP-P0-PAY-02 — Define and implement a real payment ledger (don’t use invoices table as the only source)
**Priority:** P0

**Why it matters**
- For partial payments, refunds, disputes, and auditability, you need a ledger table. Right now, payments are implied by invoice fields only.

**Where**
- `supabase/schema.sql (currently invoices only)`
- `app/api/payments/[action]/route.ts`

**What to change**
- Add `payments` table with at minimum: payment_id, invoice_id, company_id, amount, currency, method, provider (stripe/interac/manual), provider_ref, status, created_at.
- Every invoice payment update must also write a `payments` row.
- Update reports to use the ledger for revenue recognition and reconciliation.

**Acceptance criteria**
- All paid invoices have corresponding payment ledger rows.
- Partial payments and refunds can be represented without losing history.

### EP-P0-PAY-03 — Make manual 'Interac' marking safe and auditable
**Priority:** P0

**Why it matters**
- A manual 'mark paid' endpoint must not allow arbitrary users to mark any invoice paid without proof.

**Where**
- `app/api/payments/[action]/route.ts (interac action)`
- `permissions/RLS for invoices`

**What to change**
- Restrict manual payment marking to admin/manager only.
- Require payload: invoice_id, amount, date, reference/receipt number, optional attachment (photo/PDF).
- Write to `payments` ledger + audit log.
- Optionally require manager approval for large amounts or mismatches.

**Acceptance criteria**
- Only authorized roles can mark invoices paid manually.
- Every manual payment is traceable in audit logs and the payments ledger.

## P1 — Production engineering (CI/CD, env safety, logging, API consistency, tests)

### EP-P1-ENG-01 — Validate ALL required environment variables at boot (fail fast)
**Priority:** P1

**Why it matters**
- Missing env vars currently cause runtime 'demo' behavior or silent failures. Production needs explicit config validation.

**Where**
- `lib/env.ts`
- `.env.example`
- `lib/stripe.ts, lib/twilio.ts, lib/resend.ts, lib/maps.ts`

**What to change**
- Replace `validatedEnvKeys` with a Zod schema that validates:
-   - Supabase URL/keys
-   - `APP_ENCRYPTION_KEY` (prod required)
-   - Stripe keys (required if payments enabled)
-   - Twilio keys (required if SMS enabled)
-   - Resend key (required if email enabled)
-   - Google Maps key (if maps enabled)
- Make feature flags explicit (e.g., `FEATURE_SMS=true`).
- On boot, log a config summary (without secrets) showing which features are enabled.

**Acceptance criteria**
- App fails fast with a clear error if required env vars are missing in production.
- No silent demo paths in production.

### EP-P1-ENG-02 — Structured logging + request IDs everywhere (replace console.*)
**Priority:** P1

**Why it matters**
- Console logs are inconsistent and not correlated per request; debugging production incidents becomes extremely hard.

**Where**
- `All app/api routes`
- `middleware.ts`
- `lib/*`

**What to change**
- Add `lib/logger.ts` (pino or similar) with JSON logs and levels.
- Add request ID generation in middleware (or server util) and attach to:
-   - response headers (`x-request-id`)
-   - logs
-   - audit logs (optional)
- Replace console.error/warn/log with logger calls.

**Acceptance criteria**
- Every API response includes `x-request-id`.
- All server logs contain request_id and consistent fields (route, user_id, company_id when available).

### EP-P1-ENG-03 — Standardize API response format and error handling
**Priority:** P1

**Why it matters**
- Routes return inconsistent shapes (`{success,data}`, `{ok:true}`, raw arrays). This makes clients fragile and complicates debugging.

**Where**
- `app/api/**`
- `lib/api.ts (create if missing)`

**What to change**
- Create a shared response helper: `ok(data)`, `badRequest(code, message, details)`, `unauthorized()`, `forbidden()`, `notFound()`, `serverError()`.
- Use consistent error codes (machine readable) + user-safe messages.
- Ensure Zod validation errors return structured field errors.

**Acceptance criteria**
- All API routes return a consistent envelope and consistent HTTP status codes.
- Frontend error handling becomes uniform.

### EP-P1-ENG-04 — CI pipeline: typecheck + lint + tests + migration sanity
**Priority:** P1

**Why it matters**
- Without CI gatekeeping, regressions will ship (especially schema drift, type errors, and security holes).

**Where**
- `.github/workflows/* (new)`
- `package.json scripts`
- `supabase migrations`

**What to change**
- Add GitHub Actions workflow steps:
-   - `npm ci`
-   - `npm run lint`
-   - `npm run typecheck`
-   - `npm test`
-   - Supabase migration check (spin up local supabase + apply migrations or run `supabase db reset` if available)
- Fail the build on any error.

**Acceptance criteria**
- PRs cannot merge if typecheck/tests/migrations fail.
- A clean DB can be created in CI and the app builds successfully.

### EP-P1-ENG-05 — Remove unsafe `any` usage and tighten validators
**Priority:** P1

**Why it matters**
- Loose typing hides bugs (e.g., wrong payload shapes, wrong DB field names) and causes runtime failures.

**Where**
- `lib/validators.ts`
- `components/forms/*`
- `app/api/*`

**What to change**
- Eliminate `any` in validators and components; replace with explicit types.
- Use `z.coerce.number()` for numeric fields coming from forms (prices, amounts).
- Use enums for statuses (job status, invoice status, payment status).
- Validate UUIDs for all `:id` route params.

**Acceptance criteria**
- `npm run typecheck` passes with strict settings and minimal `any` usage.
- API rejects invalid payloads with clear validation errors.

### EP-P1-ENG-06 — Add E2E tests for critical flows (Playwright)
**Priority:** P1

**Why it matters**
- Unit tests alone won’t catch broken user journeys (login, dispatch, job completion, invoicing).

**Where**
- `tests/e2e/* (new)`
- `Playwright config`

**What to change**
- Cover at minimum:
-   - login + 2FA flow
-   - create customer + create job
-   - assign job to technician
-   - technician check-in/out + complete
-   - invoice send + payment mark paid (mock Stripe)
-   - rating token flow (validate + submit)
- Run E2E in CI against a seeded local DB.

**Acceptance criteria**
- E2E suite runs in CI and prevents regressions in core flows.

### EP-P1-ENG-07 — Remove stale agent docs / outdated claims and regenerate accurate documentation
**Priority:** P1

**Why it matters**
- Docs like `docs/ai/claude/CLAUDE.md`, `README.md`, and `.claude/*` contain outdated statements that no longer match the code; this causes wasted time and wrong fixes.

**Where**
- `docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md`
- `README.md`
- `docs/ai/claude/*`
- `.claude/*`
- `.claude-plugin/*`

**What to change**
- Archive or delete deprecated docs under `.claude/` that are not part of the product.
- Regenerate a single source of truth for deployment + architecture.
- Ensure docs are verified by CI (e.g., check that referenced routes exist).

**Acceptance criteria**
- No outdated docs remain that contradict the repo.
- Deployment doc matches real env vars, schema, and routes.

### EP-P1-ENG-08 — Create a production deployment checklist (repeatable + auditable)
**Priority:** P1

**Why it matters**
- Production deployments need a clear, repeatable checklist to prevent misconfigurations and outages.

**Where**
- `DEPLOYMENT.md (new)`
- `README.md`

**What to change**
- Include:
-   - required env vars and secrets (and how to generate them)
-   - Supabase project setup (RLS, buckets, policies)
-   - Stripe/Twilio/Resend setup + webhook URLs
-   - cron/scheduler setup (invoice reminders, daily summaries)
-   - monitoring setup (logs, error tracking)
-   - backup/restore plan

**Acceptance criteria**
- A new engineer can deploy to staging/prod using only the checklist.

## P1 — Authorization model & business rules enforcement

### EP-P1-AUTH-01 — Redesign permission keys so 'technician settings' ≠ 'company settings'
**Priority:** P1

**Why it matters**
- Using a single `settings` permission for both personal profile actions and company-wide admin actions creates privilege escalation risk.

**Where**
- `lib/permissions.ts`
- `app/api/company/route.ts`
- `app/api/settings/*`
- `UI: app/(app)/settings/page.tsx`

**What to change**
- Split permissions into at least:
-   - `profile_settings` (self only)
-   - `company_settings` (admin/manager only)
-   - `team_management` (admin/manager)
- Update all routes to require the correct permission (or `requireRole`).
- Update defaultRolePermissions accordingly (technicians should not have `company_settings`).

**Acceptance criteria**
- Technicians can update their own profile but cannot change company settings or role permissions.
- Company settings endpoints return 403 for unauthorized roles.

### EP-P1-AUTH-02 — Field-level authorization for Jobs and Customers (prevent dangerous edits)
**Priority:** P1

**Why it matters**
- Even if a role can update a job, it should not be able to update *all fields*. Field-level restrictions are required for correctness and fraud prevention.

**Where**
- `app/api/jobs/[id]/route.ts (PATCH/DELETE)`
- `app/api/customers/[id]/route.ts (PATCH/DELETE)`
- `lib/validators.ts`

**What to change**
- Create role-specific update schemas:
-   - Technician: allowed fields (status transitions, technician_notes, check-in/out timestamps, maybe photo/checklist references).
-   - Sales rep: allowed fields (customer_notes, scheduling requests, lead conversion).
-   - Manager/admin: full edit rights.
- Reject updates that attempt to modify forbidden fields (400/403).
- Prevent technicians from deleting jobs.

**Acceptance criteria**
- Technicians cannot change job pricing/schedule/customer assignment via PATCH.
- Technicians cannot delete jobs.
- Sales reps cannot alter technician pay fields or internal QA fields.

### EP-P1-AUTH-03 — Define and enforce a job status state machine (server-side)
**Priority:** P1

**Why it matters**
- Job status transitions must be consistent; otherwise, dispatch and reporting become unreliable.

**Where**
- `supabase/schema.sql (jobs.status check constraint)`
- `app/api/jobs/[id]/[action]/route.ts`
- `app/(app)/dispatch/page.tsx`

**What to change**
- Write a job state machine spec: allowed statuses + transitions + which roles can trigger them.
- Enforce transitions server-side (reject invalid transitions).
- Update DB constraint if new statuses are needed (e.g., `pending_review`, `rescheduled`).
- Log transitions in `job_history` (implement if unused).

**Acceptance criteria**
- Invalid transitions return 400 with a clear error.
- All status changes are logged and auditable.

### EP-P1-AUTH-04 — Permission and data-scope rules for Reports (prevent company-wide leakage to technicians)
**Priority:** P1

**Why it matters**
- Technicians currently can access report endpoints if permissions allow, potentially seeing payroll/commission data for others.

**Where**
- `app/api/reports/[type]/route.ts`
- `lib/permissions.ts (technician reports permission)`
- `app/(app)/technician/earnings/page.tsx`
- `app/(app)/sales/earnings/page.tsx`

**What to change**
- Split report endpoints into:
-   - 'my' endpoints (`/api/me/commission`, `/api/me/payroll`) for employees
-   - admin endpoints for company-wide reports
- Or implement server-side filtering in existing report routes based on role.
- Update permissions so technicians cannot access company-wide payroll by default.

**Acceptance criteria**
- Technician can only view their own earnings/commissions.
- Manager/admin can view company-wide reports.

### EP-P1-AUTH-05 — Align role definitions across DB, permissions code, and UI (dispatcher/customer roles)
**Priority:** P1

**Why it matters**
- The DB allows roles like `dispatcher`, but `lib/permissions.ts` does not define permissions for it (falls back to none). This creates broken access and inconsistent assumptions.

**Where**
- `supabase/schema.sql (users.role constraint)`
- `lib/permissions.ts`
- `routes requiring dispatcher role (SMS inbox, dispatch features)`

**What to change**
- Decide final supported roles (admin, manager, sales_rep, technician, dispatcher?, customer?).
- Update DB constraint/enum accordingly and migrate existing users safely.
- Update `defaultRolePermissions()` to include the final roles.
- Update nav visibility + route guards to match.

**Acceptance criteria**
- All roles present in DB have explicit permissions and working UI access paths.
- No 'orphan' role exists that cannot use the app.

## P1 — Dispatch, scheduling, and technician operations (make it real, not placeholders)

### EP-P1-DISP-01 — Implement real conflict detection and scheduling rules
**Priority:** P1

**Why it matters**
- Dispatch conflict detection currently does not compute overlaps or violations (travel time, technician capacity, blocked availability).

**Where**
- `app/api/dispatch/[action]/route.ts (conflicts)`
- `app/(app)/dispatch/page.tsx`
- `DB: employee_availability (needs to exist), jobs`

**What to change**
- Define scheduling rules (duration, travel buffer, max jobs/day, skills, service types).
- Compute conflicts: overlapping jobs per technician, jobs outside availability windows, insufficient travel time.
- Return structured conflict objects to UI (job_id(s), technician_id, conflict_type, message, severity).

**Acceptance criteria**
- Dispatch UI highlights real conflicts with actionable details.
- Conflicts endpoint returns consistent, test-covered output.

### EP-P1-DISP-02 — Replace naive auto-assign with an explainable assignment algorithm
**Priority:** P1

**Why it matters**
- Current auto-assign just picks the first technicians/jobs; this will fail in real operations.

**Where**
- `app/api/dispatch/[action]/route.ts (auto-assign, reassign)`

**What to change**
- Implement scoring-based assignment considering:
-   - technician availability
-   - travel distance/time (requires Maps integration)
-   - skill/service_type matching
-   - workload balancing
- Return both assignments and explanation (why assigned) for operator trust.
- Log assignments in `job_assignments` and `job_history`.

**Acceptance criteria**
- Auto-assign produces sensible assignments and never assigns outside availability.
- Every assignment is traceable with an explanation.

### EP-P1-DISP-03 — Build employee availability management end-to-end
**Priority:** P1

**Why it matters**
- Availability APIs exist but the underlying table is missing and there is no complete UI workflow.

**Where**
- `app/api/users/[id]/availability/route.ts`
- `components/AvailabilityCalendar.tsx (currently unused)`
- `DB: employee_availability (missing)`

**What to change**
- Create the `employee_availability` table (EP-P0-DB-02).
- Add a dispatch/manager UI page to manage technician availability using `AvailabilityCalendar`.
- Enforce that only admin/manager (and optionally the employee themselves) can edit availability.

**Acceptance criteria**
- Managers can set technician PTO/unavailable windows and dispatch respects them.

### EP-P1-DISP-04 — Weather cancellation should be safe (don’t cancel completed/paid jobs)
**Priority:** P1

**Why it matters**
- Weather-cancel currently cancels all jobs in a date range without checking job status/payment/invoice state.

**Where**
- `app/api/dispatch/[action]/route.ts (weather-cancel)`

**What to change**
- Restrict which statuses can be bulk-cancelled (e.g., quoted/confirmed/dispatched only).
- Write cancellation reason and send customer notifications (SMS/email).
- Create audit logs and a restore flow.

**Acceptance criteria**
- Bulk cancel never touches completed/invoiced/paid jobs.
- Customers receive consistent notifications and jobs are auditable.

## P1 — SMS/Email messaging (deliverability, compliance, threading)

### EP-P1-MSG-01 — Fix SMS send idempotency and message persistence ordering
**Priority:** P1

**Why it matters**
- SMS sending occurs before idempotency and before a durable DB record is created; retries can duplicate messages and you lose traceability if the process crashes mid-send.

**Where**
- `app/api/sms/[action]/route.ts (send)`
- `supabase/schema.sql (sms_messages table)`

**What to change**
- Persist an outgoing message row first with status `queued` + idempotency key.
- Send via Twilio in a second step; update status to `sent/failed` with Twilio SID.
- Return the message record in API response.

**Acceptance criteria**
- No duplicate SMS is sent on retries.
- Every sent SMS has a corresponding DB record and provider SID.

### EP-P1-MSG-02 — Inbound SMS webhook: verify signature, dedupe, and map messages to the correct company
**Priority:** P1

**Why it matters**
- Inbound SMS currently cannot reliably assign company/thread and is vulnerable without signature verification.

**Where**
- `app/api/sms/[action]/route.ts (webhook)`
- `sms_messages schema`

**What to change**
- Verify Twilio signature (EP-P0-SEC-06).
- Deduplicate by `MessageSid` (store and ignore repeats).
- Determine `company_id` by mapping Twilio 'To' number to a company (add company.twilio_number or a mapping table).
- Normalize phone numbers before matching to customers/leads.
- Create or attach to a thread deterministically.

**Acceptance criteria**
- Inbound messages always land in the right company inbox and thread.
- Duplicate webhooks do not create duplicate messages.

### EP-P1-MSG-03 — Opt-out/consent compliance for SMS (STOP handling, quiet hours)
**Priority:** P1

**Why it matters**
- Production SMS must respect opt-out and compliance rules to avoid carrier violations and legal risk.

**Where**
- `sms sending routes`
- `customers table (add sms_opt_out flags if missing)`

**What to change**
- Implement STOP/START keyword handling via inbound webhook.
- Store `sms_opt_out=true` on customer and block sends when opted out.
- Implement quiet hours and timezone-aware scheduling for automated messages.

**Acceptance criteria**
- Customers can opt out and no further automated SMS are sent.
- All automated messages respect quiet hours.

### EP-P1-MSG-04 — Email sending: make Resend required when email features enabled, and track delivery
**Priority:** P1

**Why it matters**
- Email sending currently can no-op if `RESEND_API_KEY` is missing; production needs explicit behavior and delivery tracking.

**Where**
- `lib/resend.ts`
- `app/api/email/[action]/route.ts`
- `invoice send flow`

**What to change**
- Validate `RESEND_API_KEY` at boot when email features enabled.
- Store email delivery attempts in DB (similar to SMS).
- Add bounce/complaint handling if possible.

**Acceptance criteria**
- Email sends are reliable and traceable; missing config is caught before deploy.

## P1 — File storage, privacy, and uploads (documents, photos, signatures)

### EP-P1-STOR-01 — Stop storing public URLs for sensitive documents (use private buckets + signed URLs)
**Priority:** P1

**Why it matters**
- Contracts and ID documents are sensitive PII. Storing public URLs (or using public buckets) creates a privacy breach risk.

**Where**
- `app/api/settings/upload/route.ts`
- `app/api/documents/route.ts`
- `supabase storage bucket config (user-documents, documents)`

**What to change**
- Make document buckets private.
- Store only the storage path in DB (not a public URL).
- Use `/api/documents` to generate short-lived signed URLs when the UI needs to display/download a document.
- Add per-doc access rules (self + admin/manager only).

**Acceptance criteria**
- ID/contract URLs are not publicly accessible.
- Authorized users can view docs via signed URLs only.

### EP-P1-STOR-02 — Add file validation (size/type) and malware scanning hook
**Priority:** P1

**Why it matters**
- Uploads currently accept any file type/size; this is risky for storage cost, security, and compliance.

**Where**
- `app/api/uploads/route.ts`
- `app/api/settings/upload/route.ts`

**What to change**
- Enforce max file size (e.g., 10MB) and allowed MIME types per doc type.
- Rename files safely and block path traversal attempts.
- Integrate malware scanning (e.g., Cloudflare, S3 AV pipeline) for PDFs/images.

**Acceptance criteria**
- Oversized or disallowed file types are rejected with clear errors.
- Uploaded file names are sanitized and predictable.

## P2 — Feature completeness & UX polish (important, but after P0/P1)

### EP-P2-PRICE-01 — Connect pricing engine to job creation + invoicing (stop manual revenue entry)
**Priority:** P2

**Why it matters**
- Right now, estimated/actual revenue can be typed manually, which is error-prone and can be manipulated. Pricing should be computed from job parameters and stored with a breakdown.

**Where**
- `lib/pricing.ts`
- `components/forms/JobForm.tsx`
- `app/api/jobs/route.ts (POST)`
- `app/api/jobs/[id]/[action]/route.ts (complete → invoice creation)`

**What to change**
- Define required pricing inputs (service type, size, addons, windows, frequency, rush fee, etc.).
- Extend jobs table to store pricing inputs + computed breakdown (JSONB).
- On job creation, compute `estimated_revenue` server-side and store breakdown.
- On completion/invoice, compute final totals server-side (including discounts, GST/QST).
- Allow manager override with audit log + reason.

**Acceptance criteria**
- Job creation no longer requires manual revenue entry.
- Invoices always match server-computed totals with stored breakdown.

### EP-P2-JOBS-01 — Implement job_history logging and use it everywhere
**Priority:** P2

**Why it matters**
- `job_history` exists in schema but isn’t used. Without it, you can’t audit what happened (assignments, reschedules, cancellations, approvals).

**Where**
- `supabase/schema.sql (job_history table)`
- `app/api/jobs/[id]/route.ts`
- `app/api/jobs/[id]/[action]/route.ts`
- `app/api/dispatch/[action]/route.ts`

**What to change**
- Write helper `logJobEvent(job_id, type, payload)` and call it on:
-   - create/assign/reassign
-   - status transitions (check-in/out/complete/no-show/cancel/reschedule)
-   - invoice creation/sent/paid
- Expose a job timeline UI (for managers/dispatch).

**Acceptance criteria**
- Every important job action creates a job_history record.
- Dispatch can view a job timeline for troubleshooting.

### EP-P2-CHECK-01 — Finish shift checklist workflow (structured items + optional photos)
**Priority:** P2

**Why it matters**
- Shift checklists are stored as `items jsonb` with little validation and no photo support, despite schema having photo URL fields.

**Where**
- `supabase/schema.sql (shift_checklists)`
- `app/api/reports/[type]/route.ts (checklists POST)`
- `app/(app)/operations/page.tsx`

**What to change**
- Define a strict checklist item schema (ids, labels, required, boolean/enum values).
- Validate `items` with Zod and store consistent structure.
- Add upload support for `start_checklist_photo_url` and `end_checklist_photo_url` (private storage + signed URLs).
- Add manager review UI if required by operations.

**Acceptance criteria**
- Checklist submissions are validated and consistent.
- Photos can be attached and viewed securely.

### EP-P2-CUST-01 — Implement customer communication timeline (SMS/email/calls) and connect it to jobs/leads
**Priority:** P2

**Why it matters**
- Schema includes `customer_communication` but it isn’t used; operators need one place to see contact attempts, reminders, complaints, and review outreach.

**Where**
- `supabase/schema.sql (customer_communication)`
- `SMS routes`
- `Email routes`
- `No-show flow`

**What to change**
- On every outbound SMS/email/call attempt, write a `customer_communication` row with channel, direction, content/template, status, related job/lead.
- Display a timeline on the customer detail page.
- Add filters: job, invoice, date range.

**Acceptance criteria**
- Customer page shows a complete, searchable communication history.

### EP-P2-SALES-01 — Add sales territory management UI (map polygon drawing + assignment)
**Priority:** P2

**Why it matters**
- Territory data exists in DB but there is no usable UI to draw/assign territories; current placeholder expects raw polygon JSON.

**Where**
- `supabase/schema.sql (sales_territories)`
- `app/api/reports/[type]/route.ts (territory POST)`

**What to change**
- Build a territories page for admin/manager/sales lead:
-   - draw polygons on a map (Google Maps) and store GeoJSON
-   - assign sales rep
-   - visualize leads/customers in territory
- Add server validation and indexing for geospatial queries (PostGIS if available).

**Acceptance criteria**
- Territories can be created/edited visually and used for lead assignment.

### EP-P2-GPS-01 — Make GPS tracking production-grade (privacy, battery, summaries)
**Priority:** P2

**Why it matters**
- GPS endpoints exist but there is no end-to-end mobile capture strategy or privacy controls.

**Where**
- `app/api/gps/[action]/route.ts`
- `app/api/jobs/[id]/[action]/route.ts (check-in/out)`
- `supabase/schema.sql (gps_locations, geofences, technician_location_daily)`

**What to change**
- Define when GPS is collected (shift only, job only) and get user consent.
- Implement mobile strategy (background updates, batching, offline queue).
- Write daily summary rows to `technician_location_daily` (distance, stops, hours).
- Add geofence breach alerts if required.

**Acceptance criteria**
- GPS tracking works reliably for technicians and does not drain battery excessively.
- Managers can view daily routes and summaries.

### EP-P2-UI-01 — Replace manual ID entry UX with searchable pickers + pagination
**Priority:** P2

**Why it matters**
- Many pages require manual copy/paste IDs (customerId, jobId, technicianId). That’s not usable in production.

**Where**
- `app/(app)/customers/page.tsx`
- `app/(app)/jobs/page.tsx`
- `app/(app)/operations/page.tsx`
- `app/(app)/dispatch/page.tsx`

**What to change**
- Add searchable dropdowns/autocomplete for customers, jobs, technicians.
- Add server-side pagination to list endpoints (`limit/offset` or cursor).
- Add common filter UI (status, date range, technician).

**Acceptance criteria**
- Operators can complete workflows without ever copying raw UUIDs.
- List endpoints return paginated results and UI supports page navigation.

### EP-P2-I18N-01 — French-first UX copy and formatting (Quebec)
**Priority:** P2

**Why it matters**
- The spec indicates French-first; the UI currently mixes English/French and uses generic date/number formatting.

**Where**
- `All UI pages/components`
- `SMS/email templates`

**What to change**
- Standardize UI strings to French (or add i18n framework).
- Use Quebec formatting for currency, phone numbers, addresses, dates/times.

**Acceptance criteria**
- UI is consistently French and formatted appropriately for Quebec users.

## P3 — Product expansion (likely required to fully match the spec, but not blocking first deploy)

### EP-P3-SUB-01 — Implement customer subscriptions (if recurring billing is part of the product)
**Priority:** P3

**Why it matters**
- The schema/spec mention subscription constructs, but there is no end-to-end UI or billing logic.

**Where**
- `DB: customer_subscriptions (exists only in remote schema dumps, not in schema.sql)`
- `pricing/billing modules`

**What to change**
- Decide subscription model: monthly/quarterly, included services, cancellation rules.
- Add `customer_subscriptions` table + UI to manage it.
- Integrate with Stripe subscriptions or internal billing schedule.

**Acceptance criteria**
- Subscriptions can be created, billed, paused, and cancelled with audit logs.

### EP-P3-COMM-01 — Automate commissions and payroll generation
**Priority:** P3

**Why it matters**
- Commissions/payroll exist but are largely manual. Production ops benefit from automatic calculation based on job completion, upsells, and quality deductions.

**Where**
- `supabase/schema.sql (employee_commissions, payroll_statements, incidents, job_quality_issues)`
- `app/api/jobs/[id]/[action]/route.ts (complete)`
- `reports pages`

**What to change**
- Define commission rules per role/service type (configurable).
- On job completion/invoice payment, automatically create or update commission rows.
- Apply deductions from incidents/quality issues with manager approval.
- Generate payroll statements for a pay period (weekly/biweekly) and lock them.

**Acceptance criteria**
- Commissions are generated automatically and match defined rules.
- Payroll statements can be generated reliably for a period and audited.

### EP-P3-OPS-01 — Manager approval workflows (invoices, upsells, discounts)
**Priority:** P3

**Why it matters**
- Spec implies approvals for certain actions (invoice send, discounts, upsells). Current flows are direct and lack approvals.

**Where**
- `jobs → invoice flow`
- `jobs upsell flow`
- `pricing overrides`

**What to change**
- Add approval states (e.g., `pending_approval`) and UI queues for managers.
- Require manager override for large discounts or upsells above threshold.
- Log all approvals in audit logs and job_history.

**Acceptance criteria**
- Restricted actions require manager approval and are auditable.

### EP-P3-SESS-01 — Implement session management (view/revoke active sessions)
**Priority:** P3

**Why it matters**
- `user_sessions` table exists but there is no UI or API to list/revoke sessions. This is important for security (lost device).

**Where**
- `DB: user_sessions`
- `auth/session cookies`

**What to change**
- Record sessions on login (device, IP, user agent, created_at, last_seen_at).
- Add settings UI: list active sessions and revoke one/all.
- On revoke, invalidate refresh tokens and clear cookies.

**Acceptance criteria**
- Users can see and revoke active sessions.

---

## Appendix A — Recommended role capabilities (baseline)

> Use this as the target when updating `lib/permissions.ts`, API route guards, and RLS.

### Admin
- Full access to all modules (company settings, team, dispatch, reports, billing).

### Manager
- Operational access similar to admin, except for a small set of super-admin actions (e.g., deleting company, rotating secrets).
- Can manage users, scheduling/dispatch, customers, jobs, invoices, and view company-wide reports.

### Dispatcher (if kept as a separate role)
- Can view and update scheduling/assignment only.
- No access to payroll/commissions, company settings, or deleting data.

### Sales Rep
- Can manage **their** leads and customers (create/update), create jobs/quotes for their customers.
- Can view invoices for their customers, but cannot change tax rules or mark payments paid without manager approval.
- No access to company settings, payroll, or other reps’ leads.

### Technician
- Can only see jobs assigned to them (plus the minimal customer details needed for those jobs).
- Can update job execution fields: check-in/out, status transitions, notes, photos, checklist submissions, incident reporting.
- Cannot create/delete jobs, edit pricing, edit customer master data, or view payroll for other employees.

---

## Appendix B — API route inventory (current)

These routes exist in `app/api` (dynamic segments shown as `${param}`):

```text
/api/access
/api/admin/reset-password
/api/admin/seed
/api/admin/seed-users
/api/admin/users
/api/admin/users/${user_id}
/api/admin/users/${user_id}/reset-password
/api/auth/change-password
/api/auth/disable-2fa
/api/auth/forgot-password
/api/auth/login
/api/auth/logout
/api/auth/refresh-token
/api/auth/register
/api/auth/reset-password
/api/auth/setup-2fa
/api/auth/verify-2fa
/api/company
/api/customers
/api/customers/${id}
/api/customers/${id}/${action}
/api/debug/session
/api/dispatch/${action}
/api/dispatch/calendar
/api/dispatch/technician/${id}
/api/documents
/api/email/${action}
/api/gps/${action}
/api/gps/geofence/${id}
/api/gps/technician/${id}
/api/health
/api/invoices
/api/invoices/${id}
/api/invoices/${id}/${action}
/api/jobs
/api/jobs/${id}
/api/jobs/${id}/${action}
/api/jobs/${id}/photos
/api/jobs/export
/api/maps/${action}
/api/notifications
/api/notifications/${id}/read
/api/notifications/settings
/api/payments/${action}
/api/ratings/submit
/api/ratings/validate
/api/reports/${type}
/api/sales/dashboard
/api/settings/document
/api/settings/password
/api/settings/profile
/api/settings/upload
/api/sms/${action}
/api/sms/inbox
/api/sms/inbox/${threadId}
/api/sms/inbox/${threadId}/read
/api/sms/triggers
/api/uploads
/api/users
/api/users/${id}
/api/users/${id}/availability
/api/users/me
```

---

## Appendix C — Schema drift snapshot

### Tables referenced by code but missing from `supabase/schema.sql`

```text
customer_ratings
employee_availability
google_review_bonuses
job_photos
```

### Tables present in `supabase/schema.sql` but not referenced by code

```text
customer_communication
job_history
technician_location_daily
```

---

## Appendix D — Minimum production checklist (quick)

- [ ] Supabase migrations apply cleanly on a fresh DB (CI enforced).
- [ ] RLS enabled and tested for every tenant table.
- [x] `APP_ENCRYPTION_KEY` present and validated in production.
- [x] Stripe keys + webhook secret configured (or payments feature disabled explicitly).
- [x] Twilio configured + webhook signature verification enabled (or SMS disabled explicitly).
- [x] Resend configured (or email disabled explicitly).
- [x] Storage buckets private and signed URLs used for documents/photos.
- [x] No demo/mock fallback data in production paths.
- [x] CI: lint + typecheck + unit + E2E tests passing.
- [x] Observability: structured logs + request IDs + error tracking configured.
