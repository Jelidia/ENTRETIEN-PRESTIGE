# Field Service Management Platform

**Mobile-First Multi-Tenant Operations Platform for Field Service Companies**

Full-stack operations platform for field service businesses of all types (cleaning, HVAC, plumbing, landscaping, electrical, pest control, etc.) with dispatch, CRM, billing, SMS automation, sales pipeline, and commission tracking. Each company configures its own service types, pricing rules, tax rates, templates, and branding.

**Status:** In progress; see `docs/tasks/DOCS_TASK_LIST.md` for the full task backlog and priorities.

**AI tooling:** See `docs/ai/codex/AGENTS.md` for the current agent workflow and repo rules.

---

## 🚀 Quick Start

### AI Tooling (OpenCode/Codex)

See `docs/ai/codex/AGENTS.md` for the current agent workflow, available skills, and repo rules. Legacy Claude Code docs were removed; see git history if needed.

### Standard Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure required variables (see `.env.example` for the full list):

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # Keep secret!

# Encryption (REQUIRED - Generate with command below)
APP_ENCRYPTION_KEY=

# Base URL (REQUIRED for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Feature flags (optional; defaults to enabled in production)
FEATURE_SMS=true|false
FEATURE_PAYMENTS=true|false
FEATURE_EMAIL=true|false

# Optional company contact email used in templates
NEXT_PUBLIC_COMPANY_EMAIL=
```

**Generate encryption key:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Optional integrations** (configure when ready):

```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Stripe payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=

# Error tracking
ERROR_TRACKING_ENDPOINT=
```

### 3. Database Setup

**Source of truth:** `supabase/migrations/*.sql` (apply in timestamp order)

Run migrations in **Supabase SQL Editor** in this exact order:

1. `supabase/migrations/20260129080548_remote_schema.sql`
2. `supabase/migrations/20260129100000_add_missing_tables.sql`
3. `supabase/migrations/20260129120000_add_customer_rating_tokens.sql`
4. `supabase/migrations/20260129120001_enable_rls_core_tables.sql`
5. `supabase/migrations/20260129120002_fix_sms_job_assignment_rls.sql`
6. `supabase/migrations/20260129120003_fix_tenancy_policies.sql`
7. `supabase/migrations/20260129120004_add_idempotency_keys.sql`

`supabase/schema.sql` is a generated snapshot of the final schema.

**CLI (local Supabase):** `supabase db reset` should apply the same migration order.

**Verify setup:**

```sql
-- Should return 20+ tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- All tables should have RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

**Troubleshooting:** See `docs/ops/TROUBLESHOOTING.md` if errors occur.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Default credentials:** You'll need to create a user via Supabase dashboard or seed script.

---

## 📋 Commands

### Development

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing

```bash
npm test             # Run all tests with coverage
npm run test:watch   # Watch mode for development
```

Prefer targeted tests first (e.g., `npx vitest run <file>`); run the full suite only when changes are broad or explicitly requested.

**Run specific tests:**

```bash
npx vitest run auth                      # Tests matching "auth"
npx vitest run --grep "pricing"          # Pattern matching
npx vitest run tests/dashboardMetrics.test.ts # Specific file
npx vitest run --coverage               # Coverage report
```

**Coverage requirement:** 100% (statements, branches, functions, lines)

### Type Checking

```bash
npm run typecheck    # Type check without building
```

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - App Router, React Server Components
- **React 18** - UI library
- **TypeScript** - Strict mode enabled
- **Tailwind CSS** - Utility-first styling
- **Headless UI** - Accessible components (planned)

### Backend
- **Next.js API Routes** - RESTful endpoints
- **Supabase** - PostgreSQL database + authentication + storage
- **Row Level Security** - Database-level access control
- **Zod** - Runtime validation (33+ schemas)

### Integrations
- **Twilio** - SMS automation (French templates)
- **Stripe** - Payment processing + subscriptions
- **Resend** - Transactional email
- **Google Maps** - Geocoding + territory mapping
- **PDF-lib** - Quebec-compliant receipts

### Testing
- **Vitest** - Unit + integration tests
- **React Testing Library** - Component tests
- **jsdom** - DOM environment
- **MSW** - API mocking (planned)

---

## 📁 Project Structure

```
field-service-platform/
├── app/
│   ├── (app)/                   # Authenticated app routes
│   ├── (auth)/                  # Auth routes
│   ├── (public)/                # Public pages (e.g., ratings)
│   ├── api/                     # Route handlers
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/                  # Shared UI components
├── lib/                         # Business logic & utilities
├── supabase/
│   ├── schema.sql               # Base schema snapshot
│   └── migrations/              # Incremental SQL migrations
├── tests/                       # Vitest test files
├── public/                      # Static assets
├── middleware.ts                # Auth + rate limiting middleware
├── .env.example                 # Environment variables template
├── vitest.config.ts             # Test configuration
└── tsconfig.json                # TypeScript configuration
```

---

## 🎯 Key Features

### Mobile-First Design

- **Bottom navigation** on ALL devices (no sidebar, ever)
- **640px max width** (centered on desktop)
- **5 tabs per role** (enforced in `BottomNavMobile.tsx`)
- **No horizontal scroll** anywhere
- **Pagination** instead of infinite scroll (5 items per page)

### Role-Based Access

**Four roles with different permissions:**

| Role | Access | Navigation |
|------|--------|------------|
| **Admin** | Full system access | Home, Schedule, Customers, Team, Settings |
| **Manager** | Operations management | Home, Schedule, Customers, Team, Settings |
| **Sales Rep** | Personal pipeline | Home, Leads, Schedule, Earnings, Settings |
| **Technician** | Field operations | Today, Schedule, Equipment, Earnings, Profile |
| **Customer** | SMS-only (no login) | N/A |

**Permission system:**
- 13 permissions: dashboard, dispatch, jobs, customers, invoices, sales, operations, reports, team, notifications, settings, technician
- Three-tier resolution: User override → Company role override → Default role
- Configured via `companies.role_permissions` (JSONB) and `users.access_permissions` (JSONB)

### SMS Automation (Twilio)

**Auto-triggers:**
- Job scheduled → Confirmation SMS
- 24h before job → Reminder
- 1h before job → Technician en route
- Job completed → Payment link
- No-show → Reschedule SMS

**Two-way inbox:**
- Thread view grouped by customer phone
- Role-based filtering (Manager sees all, Tech/Sales see assigned)
- Unread badge tracking
- Reply functionality

**All messages in French** with variable interpolation:
```
Bonjour {customerName}, votre service est prévu le {date} à {time}...
```

### Dynamic Pricing

Pricing is configurable per company via the `pricing_profiles` and `service_types` tables. Each company defines its own:
- **Service types** with custom names, base prices, and units
- **Surcharge rules** (evening/weekend, holiday, rush, etc.)
- **Discount rules** (volume, subscription, loyalty, etc.)
- **Tax rates** per region (GST, QST, HST, PST, VAT, etc.)

The `lib/pricing.ts` module provides a default pricing engine with configurable parameters.
Companies customize these rules through the Settings > Pricing page.

### Quality Control

**Configurable per company:**
- Photo requirements (before/after, number of angles) — set via company settings
- Customer rating system (SMS-based, no login required)
- Rating thresholds and follow-up rules configurable per company
- Re-work tracking with configurable commission adjustments
- Manager approval workflows

### Commission Tracking

**Fully configurable per company via `commission_profiles` table:**
- Sales rep: % of job value (configurable per service type)
- Technician: $ per job OR % (configurable)
- Multi-tech jobs: configurable split percentages
- Review bonuses: configurable amount and criteria
- Rework deductions: manager-configurable penalty rules

**Visibility:**
- Pending earnings (job completed, not paid)
- Confirmed earnings (paid out)
- Monthly payroll statements
- Leaderboard (rank only, earnings hidden from other reps)

---

## 🔐 Security

### Authentication

- **Supabase Auth** with session management
- **httpOnly cookies** (`ep_access_token`)
- **Three client types:**
  - `createAnonClient()` - Public access (rare)
  - `createUserClient(token)` - RLS enforced (most common)
  - `createAdminClient()` - Service role (admin operations only)

### Authorization

**Three auth helper patterns:**

```typescript
// Pattern 1: Require authenticated user
const auth = await requireUser(request);
if ("response" in auth) return auth.response;

// Pattern 2: Require specific role
const auth = await requireRole(request, ["admin", "manager"]);
if ("response" in auth) return auth.response;

// Pattern 3: Require permission
const auth = await requirePermission(request, ["jobs", "customers"]);
if ("response" in auth) return auth.response;
```

### Database Security

- **RLS enabled** on ALL tables
- **Multi-company isolation** via `company_id` filtering
- **Role-based policies** using `auth.uid()` and role checks
- **No ORM** - Direct SQL via Supabase (parameterized queries prevent SQL injection)

**Example RLS policy:**

```sql
CREATE POLICY "Users see own company jobs" ON jobs
  FOR SELECT USING (
    company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  );
```

### Rate Limiting

**Configured in `middleware.ts` (in-memory, resets on restart):**

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 20 requests | 15 minutes |
| `/api/gps/hourly-ping` | 60 requests | 1 minute |
| `/api/uploads` | 30 requests | 10 minutes |
| **Default** | 300 requests | 1 minute |

**Headers returned:**
- `X-RateLimit-Limit` - Total allowed
- `X-RateLimit-Remaining` - Requests left
- `X-RateLimit-Reset` - Unix timestamp
- `Retry-After` - Seconds until retry (on 429)

### Input Validation

**All API routes validate with Zod:**

```typescript
import { jobCreateSchema } from "@/lib/validators";

const result = jobCreateSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: "Invalid input", details: result.error.format() },
    { status: 400 }
  );
}
```

**33+ validators** in `lib/validators.ts` for all external data.

---

## 🧪 Testing

### Run Tests

```bash
npm test                 # All tests with coverage
npm run test:watch       # Watch mode
npx vitest run pricing   # Specific pattern
```

Prefer targeted runs while iterating; reserve full-suite runs for broad changes or pre-deploy verification.

### Coverage Requirements

**100% required** for statements, branches, functions, and lines.

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
  },
}
```

### Test Structure

```
tests/
├── authLoginRoute.test.ts       # Auth route tests
├── dashboardMetrics.test.ts     # Metrics logic
├── rateLimit.test.ts            # Rate limiting
├── technicianDashboard.test.tsx # UI coverage
├── coverage.test.tsx             # Coverage guard
├── pagesCoverage.test.tsx        # App route coverage
└── e2e/
    └── smoke.spec.ts            # Playwright smoke
```

### Example Test

```typescript
import { describe, it, expect } from "vitest";
import { calculatePrice } from "@/lib/pricing";

describe("calculatePrice", () => {
  it("applies evening surcharge correctly", () => {
    const price = calculatePrice({
      sqft: 1000,
      serviceType: "premium",
      datetime: new Date("2026-01-30T18:00:00"),  // 6pm
    });

    const basePrice = 1000 * 0.15;  // $150
    const expected = basePrice * 1.20;  // +20%
    expect(price).toBe(expected);
  });
});
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard (see `.env.example`)
3. **Deploy** - Automatic on push to `main` branch

### Production Deployment Checklist

#### Environment Variables

**Required (core):**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_ENCRYPTION_KEY=
NEXT_PUBLIC_BASE_URL=
```

**Feature flags (optional; default to enabled in production):**
```bash
FEATURE_SMS=true|false
FEATURE_PAYMENTS=true|false
FEATURE_EMAIL=true|false
```

**Required when features are enabled:**
```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

Generate APP_ENCRYPTION_KEY:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Optional (integrations and extras):**
```bash
RESEND_FROM_EMAIL=
NEXT_PUBLIC_COMPANY_EMAIL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=
ERROR_TRACKING_ENDPOINT=
```

#### Supabase Setup

- Create a Supabase project and database.
- Apply migrations in order from `supabase/migrations/*.sql` (see `.env.example` and setup above).
- Confirm RLS is enabled on all tenant tables and policies align with `docs/rls/*`.
- Verify helper functions exist: `get_user_role`, `get_user_company_id`.
- Create private storage buckets: `documents`, `user-documents`.

#### Integrations and Webhooks

**Stripe**
- Webhook endpoint: `https://<domain>/api/payments/callback`
- Subscribe to: `payment_intent.succeeded`

**Twilio**
- Inbound webhook: `https://<domain>/api/sms/webhook` (POST)

**Resend**
- Enable email sending via `POST /api/email/send` when `FEATURE_EMAIL=true`

#### Scheduler / Cron

- Choose a scheduler platform (Supabase scheduled jobs, GitHub Actions, or cloud cron).
- Add jobs for invoice reminders and daily summaries once endpoints are implemented.
- Record job names and trigger URLs in your deployment runbook.

#### Monitoring and Backups

- Set `ERROR_TRACKING_ENDPOINT` for production error collection.
- Enable platform logs and alerting for 4xx/5xx spikes.
- Enable Supabase automated backups and test restore quarterly.

#### Pre-Deploy Checklist

- [ ] Run database migrations in Supabase
- [ ] Set all environment variables in Vercel
- [ ] Verify build succeeds: `npm run build`
- [ ] Run tests: `npm test`
- [ ] Type check: `npm run typecheck`
- [ ] Lint: `npm run lint`

#### Post-Deploy Verification

- [ ] Test login with each role
- [ ] Verify 5-tab navigation per role
- [ ] Verify `/api/health` returns 200
- [ ] Test SMS sending (if enabled)
- [ ] Test email sending (if enabled)
- [ ] Trigger a Stripe test payment (if enabled)
- [ ] Verify mobile layout (640px max width)
- [ ] Check browser console for errors

See `docs/tasks/DOCS_TASK_LIST.md` for deployment status and remaining work.

---

## 📚 Documentation

### For Developers

- **docs/ai/codex/AGENTS.md** - Primary agent guidance and repo rules (read this first)
- **README.md** - Setup and overview
- **docs/tasks/DOCS_TASK_LIST.md** - Full task backlog and priorities

### For Deployment

- **docs/tasks/DOCS_TASK_LIST.md** - Production deployment checklist (at the bottom)
- **docs/ops/TROUBLESHOOTING.md** - Database migration troubleshooting

### API Documentation

**Authentication endpoints:**
- `POST /api/auth/login` - Email + password login
- `POST /api/auth/logout` - Clear session
- `POST /api/auth/register` - Create company + admin user

**Job management:**
- `GET /api/jobs` - List jobs (filtered by company + role)
- `POST /api/jobs` - Create job
- `PATCH /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job

**SMS automation:**
- `POST /api/sms/send` - Send SMS manually
- `POST /api/sms/triggers` - Trigger auto-SMS (job_scheduled, reminder_24h, etc.)
- `GET /api/sms/inbox` - Fetch inbox threads
- `POST /api/sms/inbox/[threadId]/read` - Mark conversation as read

**See `docs/ai/codex/AGENTS.md` for API patterns and repo rules.**

---

## 🛠️ Development Guidelines

### Code Style

- **TypeScript strict mode** - No `any` types
- **Named exports** preferred over default exports
- **Path aliases** - Use `@/` for all imports
- **Validation** - Zod for all external data

### Database Queries

```typescript
// ✅ Always filter by company_id
const { data } = await client
  .from("jobs")
  .select("job_id, status")  // Prefer specific columns
  .eq("company_id", profile.company_id)
  .eq("status", "pending");

// ✅ Use .single() when expecting one row
const { data } = await client
  .from("jobs")
  .select("*")
  .eq("job_id", jobId)
  .single();  // Throws if 0 or >1 rows

// ✅ Use .maybeSingle() when row might not exist
const { data } = await client
  .from("customers")
  .select("*")
  .eq("email", email)
  .maybeSingle();  // Returns null if not found
```

### Error Handling

```typescript
// ✅ Log with context
console.error("Failed to create job:", error, {
  jobId,
  userId: profile.user_id,
  companyId: profile.company_id
});

// ✅ User-friendly messages
return NextResponse.json(
  { error: "Impossible de créer le travail" },  // French for customers
  { status: 500 }
);

// ❌ Never expose internals
return NextResponse.json({ error: error.message });
```

### Component Patterns

```typescript
// Use existing components
import BottomNavMobile from "@/components/BottomNavMobile";
import Pagination from "@/components/Pagination";
import BottomSheet from "@/components/BottomSheet";

// Pagination example
<Pagination
  currentPage={page}
  totalPages={Math.ceil(count / 5)}
  onPageChange={setPage}
/>
```

---

## ❓ Troubleshooting

### Build Errors

**"Cannot find module '@/lib/auth'"**
- Check `tsconfig.json` has `"@/*": ["./*"]` in `paths`

**"Type 'any' is not assignable"**
- Strict mode enabled - use `unknown` + type guards instead

### Database Errors

**"RLS policy violation"**
```sql
-- Check user's company_id matches resource
SELECT company_id FROM users WHERE user_id = 'xxx';
SELECT company_id FROM jobs WHERE job_id = 'yyy';
```

**"Column access_permissions does not exist"**
- Apply `supabase/migrations/*.sql` in order (starting with `20260129080548_remote_schema.sql`).
- See `docs/ops/TROUBLESHOOTING.md` for details.

### Rate Limit Errors in Development

- In-memory rate limiting resets on server restart
- Restart dev server: `npm run dev`
- Production: Consider Redis-backed rate limiting

### SMS Not Sending

- Check Twilio credentials in `.env.local`
- Verify phone numbers are E.164 format (`+1XXXXXXXXXX`)
- Check Twilio console for delivery status
- Test manually: `curl -X POST http://localhost:3000/api/sms/send -d '{"to":"+15555555555","message":"Test"}'`

---

## 📞 Support

**Project:** Field Service Management Platform
**Version:** 1.0 (In Development)
**Status:** NOT READY FOR PRODUCTION — see `docs/tasks/DOCS_TASK_LIST.md` for remaining work

**For technical questions:**
- See `docs/ai/codex/AGENTS.md` - Primary agent guidance
- See `docs/ops/TROUBLESHOOTING.md` - Debugging playbook

**For deployment:**
- See `docs/tasks/DOCS_TASK_LIST.md` - Full task backlog and deployment checklist

---

## 📝 License

Proprietary - All rights reserved

---

**Last Updated:** 2026-01-27
