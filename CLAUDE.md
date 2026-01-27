# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Entretien Prestige** - Full-stack ERP for a Quebec cleaning company. Mobile-first field service management platform with dispatch, CRM, billing, SMS automation, sales pipeline, and commission tracking.

**Stack:** Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL + RLS), Zod validation, Tailwind CSS

**Language:** French primary (UI text, SMS templates, customer-facing content), English for technical code/comments

**Target Users:** Admin, Manager, Sales Rep, Technician roles (customers use SMS-only, no login)

## Commands

### Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Testing
```bash
npm test                 # Run all tests with coverage
npm run test:watch       # Watch mode for development
```

**Test filtering:**
```bash
npx vitest run auth      # Run tests matching "auth"
npx vitest run --grep "login"  # Run tests matching pattern
npx vitest run lib/pricing.test.ts  # Run specific file
```

**Coverage:** 100% required (statements, branches, functions, lines)

**Framework:** Vitest + @testing-library/react + jsdom

**Coverage config:** See `vitest.config.ts` - includes `app/`, `components/`, `lib/`, excludes `.next/`, `tests/`

## Path Aliases

**Import pattern:** Use `@/` for absolute imports from project root

```typescript
import { requireRole } from "@/lib/auth";           // ✅ Correct
import { BottomNavMobile } from "@/components/BottomNavMobile";  // ✅ Correct
import { something } from "../../lib/utils";        // ❌ Avoid relative paths
```

Configured in `tsconfig.json`: `"@/*": ["./*"]`

## Architecture

### 1. File Organization

```
app/
  (app)/              # Authenticated pages (requires login)
    dashboard/        # Admin/Manager home
    sales/            # Sales rep section
    technician/       # Technician section
    customers/        # Customer management
    team/             # Employee management
    settings/         # Settings pages
  (auth)/             # Auth pages (login, etc.)
  api/                # API routes
    auth/             # Authentication endpoints
    jobs/             # Job management
    customers/        # Customer operations
    sms/              # SMS automation
    users/            # User management
  globals.css         # Tailwind + custom styles
  layout.tsx          # Root layout
  page.tsx            # Landing page

components/           # Reusable React components
  BottomNavMobile.tsx # Main navigation (5 tabs, role-based)
  Pagination.tsx      # No-scroll pagination
  BottomSheet.tsx     # Mobile modal pattern
  Accordion.tsx       # Collapsible sections
  NoShowDialog.tsx    # Call → SMS → Skip workflow
  StatusBadge.tsx     # Status chips

lib/                  # Business logic & utilities
  auth.ts             # Auth helpers (requireUser, requireRole, requirePermission)
  permissions.ts      # Permission resolution logic
  supabaseServer.ts   # Supabase client factories
  session.ts          # Session/cookie management
  pricing.ts          # Dynamic pricing calculator
  smsTemplates.ts     # French SMS templates
  validators.ts       # Zod schemas (33+ validators)
  twilio.ts           # SMS integration
  stripe.ts           # Payment integration
  rateLimit.ts        # Rate limiting logic
  crypto.ts           # Encryption helpers

db/
  schema.sql          # Base database schema
  migrations/         # Incremental SQL migrations

tests/                # Vitest test files
```

**Route groups:** Parentheses like `(app)` organize routes without affecting URL structure

### 2. Authentication & Authorization

**Three Supabase client types** (`lib/supabaseServer.ts`):

```typescript
import { createAnonClient, createUserClient, createAdminClient } from "@/lib/supabaseServer";

// 1. Anonymous client - Public access (rarely used)
const anon = createAnonClient();

// 2. User client - RLS-enforced (most common)
const client = createUserClient(accessToken);
await client.from("jobs").select("*");  // RLS filters by user's company

// 3. Admin client - Bypasses RLS (use with security definer functions only)
const admin = createAdminClient();
await admin.from("users").insert({ ... });  // Only in trusted server code
```

**Auth helpers** (`lib/auth.ts`):

```typescript
import { requireUser, requireRole, requirePermission } from "@/lib/auth";

// Pattern 1: Require authenticated user
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;  // Early return if unauthorized

  const { user, profile } = auth;  // user: Supabase User, profile: users table row
  // ... your logic
}

// Pattern 2: Require specific role(s)
export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"]);
  if ("response" in auth) return auth.response;

  const { user, profile } = auth;
  // Only admins/managers reach here
}

// Pattern 3: Require permissions
export async function DELETE(request: Request) {
  const auth = await requirePermission(request, ["jobs", "customers"]);
  if ("response" in auth) return auth.response;

  const { user, profile, permissions } = auth;
  // User has at least one of the specified permissions
}

// Pattern 4: Role + permission check combined
export async function PATCH(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], ["settings"]);
  if ("response" in auth) return auth.response;

  // Admin/manager WITH settings permission
}
```

**Permission system** (`lib/permissions.ts`):

```typescript
// Available permissions (13 total)
export type PermissionKey =
  | "dashboard" | "dispatch" | "jobs" | "customers" | "invoices"
  | "sales" | "operations" | "reports" | "team" | "notifications"
  | "settings" | "technician";

// Resolution priority: user override → company role override → default role
export function resolvePermissions(
  role: string,
  rolePermissions?: RolePermissions | null,    // From companies.role_permissions
  userPermissions?: Partial<PermissionMap> | null  // From users.access_permissions
): PermissionMap;
```

**Default permissions by role:**
- **Admin/Manager:** All permissions enabled
- **Sales Rep:** dashboard, jobs, customers, sales, reports, notifications, settings
- **Technician:** dashboard, jobs, customers, reports, technician, notifications, settings

**Session management:**
- Access token in `ep_access_token` cookie (httpOnly, secure)
- Extract with `getAccessTokenFromRequest(request)` from `lib/session.ts`

**Middleware** (`middleware.ts`):
- Protects all routes except `/login`, `/api/auth/login`, public pages
- Rate limiting on ALL API routes (IP-based, configurable)
- Redirects to `/login?redirect={pathname}` if unauthenticated

### 3. Database & RLS

**Supabase PostgreSQL** with Row Level Security enabled on ALL tables.

**Schema:** `db/schema.sql` (base), `db/migrations/` (incremental changes)

**Migration workflow:**
1. Write SQL in `db/migrations/YYYYMMDD_description.sql`
2. Copy-paste into Supabase SQL Editor
3. Execute and verify
4. See `SQL_MIGRATION_GUIDE.md` if errors occur

**Critical tables:**
- `users` - Employee profiles (role: admin|manager|sales_rep|technician, access_permissions JSONB)
- `companies` - Company settings (role_permissions JSONB for role overrides)
- `jobs` - Service jobs (assigned_technician_id, status, pricing, scheduling)
- `customers` - Customer records (addresses, subscriptions, loyalty points)
- `job_photos` - Mandatory before/after photos (4 sides: front, back, left, right)
- `customer_ratings` - 1-5 star ratings (4-5★ → Google redirect + $5 tech bonus)
- `employee_availability` - Hourly availability grid (Mon-Sun, 7am-10pm)
- `upsell_items` & `job_upsells` - Pre-approved upsell catalog with tracking
- `customer_subscriptions` - Auto-billing recurring services
- `loyalty_points` & `loyalty_transactions` - 100 points = $10 off
- `payroll_statements` - Monthly commission payouts

**RLS patterns:**

```sql
-- User context from auth.uid()
CREATE POLICY "Users see own company data" ON jobs
  FOR SELECT USING (
    company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  );

-- Role-based access
CREATE POLICY "Admins manage all jobs" ON jobs
  FOR ALL USING (
    (SELECT role FROM users WHERE user_id = auth.uid()) = 'admin'
  );

-- Technicians see only assigned jobs
CREATE POLICY "Techs see assigned jobs" ON jobs
  FOR SELECT USING (
    assigned_technician_id = auth.uid()
  );
```

**NO ORM** - Direct SQL queries via Supabase client:

```typescript
const client = createUserClient(token);

// Always filter by company_id for multi-tenancy
const { data, error } = await client
  .from("jobs")
  .select("job_id, customer_id, scheduled_date, status")  // Prefer specific columns
  .eq("company_id", profile.company_id)
  .eq("status", "pending")
  .order("scheduled_date", { ascending: true })
  .limit(10);

// Use .single() when expecting exactly one row
const { data: job } = await client
  .from("jobs")
  .select("*")
  .eq("job_id", jobId)
  .single();  // Throws if 0 or >1 rows

// Use .maybeSingle() when row might not exist
const { data: customer } = await client
  .from("customers")
  .select("*")
  .eq("email", email)
  .maybeSingle();  // Returns null if not found
```

### 4. Rate Limiting

**In-memory sliding window** (resets on server restart)

**Configuration** (`middleware.ts`):

```typescript
// Login endpoint: 20 requests per 15 minutes
{ match: (path) => path.startsWith("/api/auth/login"), limit: 20, windowMs: 15 * 60 * 1000 }

// GPS ping: 60 requests per minute
{ match: (path) => path.startsWith("/api/gps/hourly-ping"), limit: 60, windowMs: 60 * 1000 }

// File uploads: 30 requests per 10 minutes
{ match: (path) => path.startsWith("/api/uploads"), limit: 30, windowMs: 10 * 60 * 1000 }

// Default: 300 requests per minute
```

**Response headers:**
- `X-RateLimit-Limit`: Total allowed
- `X-RateLimit-Remaining`: Requests left
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until retry (on 429 error)

### 5. SMS System

**Provider:** Twilio (`lib/twilio.ts`)

**Templates** (`lib/smsTemplates.ts`) - All in French:

```typescript
// Auto-trigger templates
- job_scheduled: "Bonjour {customerName}, votre service est prévu le {date} à {time}..."
- reminder_24h: "Rappel: Votre nettoyage est prévu demain..."
- reminder_1h: "Votre technicien arrive dans 1 heure..."
- job_completed: "Service terminé! Payez en ligne: {paymentLink}"
- job_no_show: "Nous sommes passés mais personne n'était présent..."
- reschedule: "Pour reprogrammer, appelez-nous au..."
- custom: Manager-written message
```

**Auto-triggers API:**

```typescript
// POST /api/sms/triggers
{
  "event": "job_scheduled",  // or reminder_24h, reminder_1h, job_completed, job_no_show
  "jobId": "uuid"
}
// Automatically sends correct template with job/customer data
```

**Two-way inbox** (`/inbox` page, `app/api/sms/inbox/route.ts`):
- Thread view grouped by customer phone
- Role filtering: Manager/Admin see all, Tech/Sales see only assigned customers
- Unread badge tracking via `app/api/sms/mark-read`
- Manager can reply to any conversation

### 6. Pricing Engine

**Dynamic calculator** (`lib/pricing.ts`):

```typescript
import { calculatePrice } from "@/lib/pricing";

const price = calculatePrice({
  sqft: 2500,                    // Square footage
  windows: 12,                   // Number of windows
  serviceType: "premium",        // "basique" | "premium" | "prestige"
  datetime: new Date("2026-01-30T18:00:00"),  // Scheduled time
  isHoliday: false,              // Quebec statutory holiday
  customerJobCount: 7,           // For volume discount (optional)
});
```

**Pricing logic:**
1. **Base:** `max(minimumPrice, sqft × ratePerSqft) + (windows × windowRate)`
2. **Evening/weekend:** +20% (after 5pm or Sat/Sun)
3. **Holiday:** +15% (Quebec statutory holidays - see `QUEBEC_HOLIDAYS_2026`)
4. **Volume discount:** -10% (5+ completed jobs)
5. **Subscription:** -10% (permanent for active subscribers)
6. **Loyalty:** 100 points = $10 off (applied at checkout)

**Service rates:**
- Basique: $0.10/sqft, $8/window, $80 minimum
- Premium: $0.15/sqft, $12/window, $120 minimum
- Prestige: $0.20/sqft, $15/window, $150 minimum

### 7. Input Validation

**All API routes use Zod** (`lib/validators.ts` - 33+ schemas):

```typescript
import { z } from "zod";
import { jobCreateSchema, customerUpdateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();

  // Validate with Zod
  const result = jobCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.format() },
      { status: 400 }
    );
  }

  const validated = result.data;  // Type-safe validated data
  // ... use validated data
}
```

**Common schemas:**
- `loginSchema` - email + password (min 16 chars)
- `jobCreateSchema` - customerId, serviceType, servicePackage, scheduledDate
- `customerCreateSchema` - firstName, lastName, email/phone (at least one)
- `userCreateSchema` - fullName, email, role, password, optional permissions
- `smsSendSchema` - to (min 7 chars), message
- `gpsCheckinSchema` - jobId, latitude, longitude, accuracyMeters

### 8. UI Components & Navigation

**Mobile-first:** Bottom navigation on ALL devices (no sidebar ever)

**Layout constraints:**
- Max width: 640px (centered on desktop)
- Exactly 5 tabs per role (spec requirement)
- No horizontal scroll

**Role navigation** (`components/BottomNavMobile.tsx`):

```typescript
// Admin/Manager (5 tabs)
[📊 Home] [📅 Schedule] [👥 Customers] [🧑‍💼 Team] [⚙️ Settings]
  /dashboard  /dispatch    /customers     /team     /settings

// Sales Rep (5 tabs)
[📊 Home] [🎯 Leads] [📅 Schedule] [💰 Earnings] [⚙️ Settings]
  /sales/dashboard  /sales/leads  /sales/schedule  /sales/earnings  /sales/settings

// Technician (5 tabs)
[🏠 Today] [📅 Schedule] [📸 Equipment] [💰 Earnings] [⚙️ Profile]
  /technician  /technician/schedule  /technician/equipment  /technician/earnings  /technician/profile
```

**Navigation loads permissions dynamically:**

```typescript
// Fetches user permissions from /api/access
// Filters nav items by role AND permission
// Always renders exactly 5 tabs (slices if needed)
```

**Reusable components:**
- `BottomNavMobile.tsx` - Main nav, permission-aware, role-based filtering
- `Pagination.tsx` - No-scroll pagination (5 items per page default)
- `BottomSheet.tsx` - Modal from bottom (mobile UX pattern)
- `Accordion.tsx` - Collapsible sections
- `NoShowDialog.tsx` - Call → SMS → Skip workflow (tech feature)
- `StatusBadge.tsx` - Consistent status chips with color coding

### 9. API Route Patterns

**Standard structure:**

```typescript
// app/api/example/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { exampleSchema } from "@/lib/validators";

export async function POST(request: Request) {
  // 1. Authenticate
  const auth = await requireRole(request, ["admin", "manager"]);
  if ("response" in auth) return auth.response;

  const { user, profile } = auth;

  // 2. Validate input
  const body = await request.json();
  const result = exampleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // 3. Database operation with RLS
  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const { data, error } = await client
    .from("table_name")
    .insert({ ...result.data, company_id: profile.company_id })
    .select()
    .single();

  if (error) {
    console.error("DB error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // 4. Return success
  return NextResponse.json({ success: true, data });
}
```

**Error response format:**

```typescript
return NextResponse.json(
  { error: "User-friendly message", details: technicalDetails },
  { status: 400 | 401 | 403 | 404 | 429 | 500 }
);
```

**HTTP status codes:**
- `200` - Success
- `400` - Bad request (validation failed)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (wrong role/permission)
- `404` - Not found
- `429` - Rate limit exceeded
- `500` - Server error

## Key Business Rules

### Critical Constraints

- **Mobile-first ONLY:** Bottom navigation on ALL devices (no sidebar ever, 640px max width)
- **No scrolling:** Pagination + modals instead of long lists (5 items per page default)
- **Exactly 5 tabs per role:** Navigation must render exactly 5 tabs (enforced in BottomNavMobile.tsx)
- **French primary:** UI text, SMS templates, customer-facing content in French
- **No customer login:** SMS/email updates only, customers cannot cancel jobs
- **Commission-only:** No overtime calculation, technicians paid on commission only

### No-Show Protocol

1. Technician arrives at job site
2. Opens no-show dialog (only appears after scheduled time)
3. **Must call customer first** (dialog enforces this)
4. If no answer, sends SMS notification
5. Can skip job after 10 minutes (marks as `no_show`, notifies manager)
6. **No commission paid for no-shows**

### Photo Requirements

- **Mandatory:** Before AND after photos
- **4 sides required:** Front, back, left, right (8 photos minimum per job)
- Cannot mark job as completed without all photos
- Stored in `job_photos` table with `side` enum and `photo_type` (before/after)

### Commission Structure

- **Sales rep:** Percentage of job value (set per service type in settings)
- **Technician:** $ per job OR percentage (configurable)
- **Multi-tech jobs:** Split commissions (50/50, 30/70, or custom)
- **Rework jobs:** Deduct from original commission (0%, 50%, or 100% penalty)
- **Google review bonus:** $5 for 4-5★ rating with name mention
- **Payment:** Monthly via `payroll_statements`

### Customer Ratings

1. Job completed → Auto-send SMS with rating link
2. Link includes secure token (no login required)
3. Customer rates 1-5 stars
4. **1-3 stars:** Internal only, triggers manager follow-up
5. **4-5 stars:** Redirect to Google Maps review + $5 bonus to tech (if name mentioned)
6. Tracked in `customer_ratings` + `google_review_bonuses`

### Subscription System

- Auto-scheduled recurring jobs (weekly, bi-weekly, monthly, quarterly, yearly)
- **10% permanent discount** on all jobs
- Stripe subscription integration
- Jobs auto-created based on frequency
- Cancel anytime (no pro-rating)

## Development Guidelines

### Code Style

- **TypeScript strict mode:** No `any` types (use `unknown` + type guards)
- **Named exports:** Prefer `export function foo()` over `export default foo`
- **Imports:** Use `@/` path alias for all absolute imports
- **Validation:** Use Zod for all external data (API requests, env vars)

### Database Queries

- **Always filter by `company_id`** for multi-tenancy isolation
- **Prefer specific columns** over `SELECT *` for performance
- **Use `.single()`** when expecting exactly one row (throws on 0 or >1)
- **Use `.maybeSingle()`** when row might not exist (returns null)
- **Parameterized queries:** Supabase client handles this automatically

### Error Handling

```typescript
// Log errors with context
console.error("Failed to create job:", error, { jobId, userId: profile.user_id });

// Return user-friendly messages
return NextResponse.json(
  { error: "Could not create job. Please try again." },  // French for customer-facing
  { status: 500 }
);

// Never expose sensitive data
// ❌ return NextResponse.json({ error: error.message });  // Might leak DB details
// ✅ return NextResponse.json({ error: "An error occurred" });
```

### Testing Strategy

**Unit tests:** Business logic in `lib/` (pricing, permissions, crypto)

```typescript
// tests/lib/pricing.test.ts
import { describe, it, expect } from "vitest";
import { calculatePrice } from "@/lib/pricing";

describe("calculatePrice", () => {
  it("applies evening surcharge correctly", () => {
    const price = calculatePrice({
      sqft: 1000,
      serviceType: "premium",
      datetime: new Date("2026-01-30T18:00:00"),  // 6pm = evening
    });
    expect(price).toBeGreaterThan(150);  // Base 150 + 20% surcharge
  });
});
```

**Integration tests:** API routes with mocked Supabase

```typescript
import { vi } from "vitest";

vi.mock("@/lib/supabaseServer", () => ({
  createUserClient: vi.fn(() => mockSupabaseClient),
}));
```

**Component tests:** React components with Testing Library

```typescript
import { render, screen } from "@testing-library/react";

test("renders bottom nav with 5 tabs", () => {
  render(<BottomNavMobile />);
  const nav = screen.getByRole("navigation");
  expect(nav.children).toHaveLength(5);
});
```

## Integration Points

**Stripe** (`lib/stripe.ts`):
- Payment processing for jobs
- Subscription billing (recurring customers)
- Webhook: `POST /api/payments/webhook` (verify with `STRIPE_WEBHOOK_SECRET`)

**Twilio** (`lib/twilio.ts`):
- SMS sending (all templates in French)
- Two-way messaging (incoming webhook: `POST /api/sms/webhook`)
- Phone number format: E.164 (`+1XXXXXXXXXX`)

**Google Maps** (`lib/maps.ts`):
- Geocoding addresses
- Territory polygon drawing (planned)
- Distance calculations for routing

**Resend** (`lib/resend.ts`):
- Transactional emails (invoice delivery, password reset)
- Admin notifications
- Email templates in French

**PDF Generation** (`lib/pdf.ts`):
- Quebec-compliant receipts (GST/QST breakdown)
- Invoice PDFs
- Contract generation (planned)

## Environment Variables

**Required immediately:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Keep secret!
APP_ENCRYPTION_KEY=xxxxx==  # 32-byte base64 (generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # Production domain
```

**Configure as you obtain credentials:**

```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX

STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyxxxxx
```

See `.env.example` for template.

## Troubleshooting

### "Column access_permissions does not exist"

**Fix:** Run `db/migrations/20260126_add_permissions.sql` first

The `lib/auth.ts` has fallback logic that handles this gracefully, but you should run the migration.

### "Operator does not exist: user_role = text"

**Cause:** Enum type mismatch (old schema had `user_role` enum, new uses text)

**Fix:** See `SQL_MIGRATION_GUIDE.md` - drop old enum or cast values

### Rate limit errors in development

**Cause:** In-memory rate limit state resets on server restart

**Workaround:** Restart dev server (`npm run dev`) to clear limits

**Production:** Use Redis-backed rate limiting (not implemented yet)

### RLS policy denies access

**Check:**
1. User's `company_id` matches resource `company_id`
2. Role has correct permissions in `companies.role_permissions`
3. User doesn't have blocking override in `users.access_permissions`

**Debug:**
```sql
-- Check user's resolved permissions
SELECT role, company_id, access_permissions FROM users WHERE user_id = 'xxx';

-- Check company role overrides
SELECT role_permissions FROM companies WHERE company_id = 'xxx';
```

### SMS not sending

**Check:**
1. Twilio credentials in `.env.local` are correct
2. Phone numbers are E.164 format (`+1XXXXXXXXXX`)
3. Twilio account has sufficient balance
4. Check Twilio console logs for delivery status

**Test SMS:**
```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to": "+15555555555", "message": "Test"}'
```

### TypeScript build errors

**Common causes:**
1. Missing `@/` path alias (check `tsconfig.json`)
2. `any` type used (strict mode enabled)
3. Missing type imports from `@/lib/types`

**Fix:**
```bash
npm run build  # See detailed errors
npx tsc --noEmit  # Type-check without building
```

## Deployment Checklist

See `READY_TO_DEPLOY.md` for detailed status (~65% complete as of 2026-01-27).

### Pre-Deploy

1. **Run migrations** in Supabase SQL Editor:
   - `db/schema.sql`
   - `db/migrations/20260126_add_permissions.sql`
   - `db/migrations/20260127_complete_spec_implementation.sql`

2. **Set environment variables** in Vercel dashboard (all from `.env.example`)

3. **Verify build:**
   ```bash
   npm run build  # Must complete without errors
   npm run lint   # No ESLint errors
   npm test       # All tests pass with 100% coverage
   ```

### Post-Deploy

1. **Test login** with each role (admin, manager, sales_rep, technician)
2. **Verify RLS** is active (non-admins can't see other companies' data)
3. **Check rate limiting** (trigger 429 error by spamming endpoint)
4. **Test SMS** (if Twilio configured)
5. **Verify navigation** shows exactly 5 tabs per role
6. **Mobile test** (640px max width, bottom nav works)

## Current Status

**Foundation:** 100% complete (auth, database, navigation, rate limiting)

**Working features:**
- Mobile-first navigation (5 tabs per role)
- SMS auto-triggers and two-way inbox
- Sales pipeline management
- Dynamic pricing calculator
- No-show protocol
- Role-based permissions
- Database schema (16 new tables)

**In progress:**
- Photo upload UI (database ready)
- Public rating page (database ready)
- Availability calendar grid (database ready)
- Subscription management UI
- Equipment checklist customization

**Planned:**
- Territory drawing on maps
- Loyalty dashboard
- Referral tracking ($50 gift cards)
- Quebec receipt generator (GST/QST compliant)

See `READY_TO_DEPLOY.md` for full implementation status.

## Critical Files

- `middleware.ts` - Auth checks, rate limiting, protected routes
- `lib/auth.ts` - Authentication helpers (requireUser, requireRole, requirePermission)
- `lib/permissions.ts` - Permission resolution (user → company → default)
- `lib/supabaseServer.ts` - Three client factories (anon, user, admin)
- `lib/validators.ts` - 33+ Zod schemas for all API inputs
- `components/BottomNavMobile.tsx` - Main navigation (5-tab enforcer)
- `vitest.config.ts` - Test configuration (100% coverage required)
- `db/migrations/20260127_complete_spec_implementation.sql` - Latest schema

## Documentation

- **ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md** - Complete project specification (48+ requirements)
- **READY_TO_DEPLOY.md** - Current implementation status (~85% complete)
- **README.md** - Quick start guide for developers
- **AGENTS.md** - Quick reference for AI assistants (ChatGPT, Codex, Copilot)
- **SQL_MIGRATION_GUIDE.md** - Database migration troubleshooting (if exists)
