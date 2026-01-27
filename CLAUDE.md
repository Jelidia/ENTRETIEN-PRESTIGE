# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Entretien Prestige** - Full-stack ERP for a Quebec cleaning company. Mobile-first field service management platform with dispatch, CRM, billing, SMS automation, sales pipeline, and commission tracking.

**Stack:** Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL + RLS), Zod validation, Tailwind CSS

**Language:** French primary (UI text, SMS templates, customer-facing content), English fallback for technical code

**Target Users:** Admin, Manager, Sales Rep, Technician roles (no customer login - SMS-only communication)

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

**Coverage thresholds:** 100% (statements, branches, functions, lines)

**Test framework:** Vitest + @testing-library/react + jsdom

## Architecture

### 1. Authentication & Authorization

**Session Management** (`lib/session.ts`, `lib/auth.ts`):
- Access token stored in `ep_access_token` cookie (httpOnly)
- Three Supabase client types:
  - `createAnonClient()` - Public access
  - `createUserClient(token)` - RLS-enforced user context
  - `createAdminClient()` - Service role (security definer functions only)

**Auth Helpers** (`lib/auth.ts`):
- `requireUser(request)` - Validates token, fetches user profile
- `requireRole(request, roles, permissions?)` - Role-based guard
- `requirePermission(request, permissions)` - Permission-based guard
- Returns `{ response }` object on auth failure (early return pattern)

**Permissions System** (`lib/permissions.ts`):
- Default role permissions defined in `defaultRolePermissions`
- Company-level role overrides via `companies.role_permissions`
- User-level overrides via `users.access_permissions`
- Resolved in priority order: user → company role → default role
- Use `resolvePermissions(role, rolePermissions, userPermissions)` to compute final permissions

**Middleware** (`middleware.ts`):
- Protects all routes except `/login`, `/api/auth/login`, public pages
- Rate limiting on ALL API routes (IP-based, configurable per endpoint)
- Default: 300 req/min, auth: 20 req/15min, GPS: 60 req/min

### 2. Database & RLS

**Supabase PostgreSQL** with Row Level Security enabled on ALL tables.

**Schema location:** `db/schema.sql` (base schema), `db/migrations/` (incremental changes)

**Migration workflow:**
1. Write SQL in `db/migrations/YYYYMMDD_description.sql`
2. Open Supabase SQL Editor
3. Copy-paste and execute
4. Verify with test queries
5. See `SQL_MIGRATION_GUIDE.md` for troubleshooting

**Critical tables:**
- `users` - Employee profiles (role: admin|manager|sales_rep|technician|customer)
- `jobs` - Service jobs with scheduling, pricing, status tracking
- `customers` - Customer records with addresses, subscriptions, loyalty points
- `job_photos` - Mandatory before/after photos (4 sides: front, back, left, right)
- `customer_ratings` - Internal ratings (1-5 stars, 4-5★ → Google redirect + $5 bonus)
- `employee_availability` - Hourly grid (Mon-Sun, 7am-10pm)
- `upsell_items` & `job_upsells` - Pre-approved upsell catalog with tracking
- `customer_subscriptions` - Auto-billing recurring services
- `loyalty_points` & `loyalty_transactions` - 100 points = $10 off

**RLS Pattern:**
- All policies use `auth.uid()` for user context
- Role checks: `(SELECT role FROM users WHERE user_id = auth.uid())`
- Company isolation: `company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())`
- Technicians see only assigned jobs: `assigned_technician_id = auth.uid()`

**NO ORM** - Direct SQL queries via Supabase client.

### 3. SMS System

**Provider:** Twilio (`lib/twilio.ts`)

**Templates** (`lib/smsTemplates.ts`):
- All messages in French
- Dynamic variables: `{customerName}`, `{techName}`, `{date}`, `{time}`, `{paymentLink}`
- Types: job scheduled, 24h reminder, 1h reminder, completed (w/ payment link), no-show, reschedule, custom

**Auto-triggers** (`app/api/sms/triggers/route.ts`):
- `POST /api/sms/triggers` with `{ event, jobId }`
- Events: `job_scheduled`, `reminder_24h`, `reminder_1h`, `job_completed`, `job_no_show`
- Automatically sends correct template based on event

**Two-way inbox** (`app/api/sms/inbox/route.ts`, `/inbox` page):
- Thread view grouped by customer phone
- Role-based filtering:
  - **Manager/Admin:** See all conversations
  - **Technician/Sales Rep:** Only assigned customers
- Unread badge tracking
- Mark as read API: `POST /api/sms/mark-read`

### 4. Pricing Engine

**Dynamic calculator** (`lib/pricing.ts`):
```typescript
calculatePrice({
  sqft?: number,           // Square footage
  windows?: number,        // Number of windows
  serviceType: string,     // "basique" | "premium" | "prestige"
  datetime: Date,          // Scheduled time
  isHoliday?: boolean,     // Quebec holiday flag
  customerJobCount?: number // For volume discount
})
```

**Pricing logic:**
- Base price: max(minimum, sqft × rate) + (windows × window_rate)
- Evening/weekend surcharge: +20% (after 5pm or Sat/Sun)
- Holiday surcharge: +15% (Quebec statutory holidays)
- Volume discount: -10% (5+ jobs)
- Subscription discount: -10% (permanent for subscribers)
- Loyalty discount: 100 points = $10 off

**Quebec holidays:** Defined in `QUEBEC_HOLIDAYS_2026` array

### 5. UI Components & Design System

**Mobile-first approach:** Bottom navigation on ALL devices (no sidebar).

**Layout constraints:**
- Max width: 640px (centered on larger screens)
- Bottom nav: Exactly 5 tabs per role
- No horizontal scroll anywhere

**Reusable components** (`components/`):
- `BottomNavMobile.tsx` - Role-based 5-tab navigation
- `Pagination.tsx` - No-scroll pagination (5 items per page default)
- `BottomSheet.tsx` - Modal from bottom (mobile UX)
- `Accordion.tsx` - Collapsible sections
- `NoShowDialog.tsx` - Call → SMS → Skip workflow
- `StatusBadge.tsx` - Consistent status chips

**Role navigation mapping:**
```typescript
admin:       Home, Schedule, Customers, Team, Settings
manager:     Home, Schedule, Customers, Team, Settings
sales_rep:   Home, Leads, Schedule, Earnings, Settings
technician:  Today, Schedule, Equipment, Earnings, Profile
```

### 6. Security

**Encryption** (`lib/crypto.ts`):
- 2FA secrets encrypted with `APP_ENCRYPTION_KEY` (32-byte base64)
- Use `encrypt()` / `decrypt()` helpers
- Never store plaintext secrets

**Rate limiting** (`lib/rateLimit.ts`, `middleware.ts`):
- In-memory sliding window (resets on server restart)
- Configurable per endpoint
- Returns 429 with `Retry-After` header

**Security definer functions:**
- Admin operations that bypass RLS
- Must validate permissions in function body
- Example: User creation, bulk updates

**Input validation:**
- All API routes validate with Zod schemas
- Never trust client input
- Sanitize before SQL queries

### 7. Integration Points

**Stripe** (`lib/stripe.ts`):
- Payment processing for jobs
- Subscription billing
- Webhook handler: `POST /api/payments/webhook`

**Google Maps** (`lib/maps.ts`):
- Geocoding addresses
- Territory polygon drawing (planned)
- Distance calculations

**Resend** (`lib/resend.ts`):
- Transactional emails
- Invoice delivery
- Admin notifications

**PDF Generation** (`lib/pdf.ts`):
- Quebec-compliant receipts
- Invoice PDFs
- Termination documents (planned)

### 8. API Route Patterns

**Standard auth flow:**
```typescript
import { requireRole } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"]);
  if ("response" in auth) return auth.response; // Early return on auth failure

  const { user, profile } = auth;
  // ... route logic
}
```

**Permission checks:**
```typescript
const auth = await requirePermission(request, ["jobs", "customers"]);
if ("response" in auth) return auth.response;
```

**Supabase queries with RLS:**
```typescript
const client = createUserClient(token); // RLS enforced
const { data, error } = await client
  .from("jobs")
  .select("*")
  .eq("company_id", profile.company_id);
```

## Key Business Rules

### No-Show Protocol
1. Technician arrives at job site
2. Opens no-show dialog (appears after scheduled time)
3. Must call customer first
4. If no answer, sends SMS notification
5. Can skip job (marks as no-show, notifies manager)
6. No commission paid for no-shows

### Photo Requirements
- **Mandatory:** Before AND after photos
- **4 sides required:** Front, back, left, right
- Cannot complete job without all photos
- Stored in `job_photos` table

### Commission Structure
- Sales rep: % of job value (set per job type)
- Technician: $ per job or % (configurable)
- Split commissions for multi-tech jobs
- Rework jobs deduct from original commission
- Paid monthly via `payroll_statements`

### Customer Ratings
- Post-job SMS with rating link (tokenized, no login)
- 1-3 stars: Internal only, triggers follow-up
- 4-5 stars: Redirect to Google, $5 bonus to tech
- Tracked in `customer_ratings` + `google_review_bonuses`

### Subscription System
- Auto-scheduled recurring jobs
- 10% permanent discount
- Configurable frequency (weekly, bi-weekly, monthly)
- Stripe subscription integration

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- No `any` types (use `unknown` and type guards)
- Prefer named exports over default exports
- Use Zod for all external data validation

### API Design
- RESTful routes under `/api/[resource]/route.ts`
- POST for mutations, GET for queries
- Return JSON with consistent error format: `{ error: string, details?: any }`
- Use HTTP status codes correctly (401, 403, 404, 429, 500)

### Database Queries
- Use parameterized queries (Supabase handles this)
- Always filter by `company_id` for multi-tenancy
- Prefer `.select()` with specific columns over `*`
- Use `.single()` when expecting one row, `.maybeSingle()` when optional

### Error Handling
- Log errors to console with context (job ID, user ID, etc.)
- Return user-friendly messages (French for customer-facing, English for admin)
- Never expose sensitive data in error responses

### File Organization
```
app/
  (app)/              # Authenticated pages
    [role]/           # Role-specific routes
  (public)/           # Public pages (login, rating)
  api/                # API routes
components/           # Shared React components
lib/                  # Business logic, utilities, integrations
db/
  schema.sql          # Base schema
  migrations/         # Incremental changes
tests/                # Vitest tests
```

## Critical Files

- `middleware.ts` - Auth checks, rate limiting
- `lib/auth.ts` - Auth helpers for API routes
- `lib/permissions.ts` - Permission resolution logic
- `lib/supabaseServer.ts` - Supabase client factories
- `components/BottomNavMobile.tsx` - Main navigation component
- `db/migrations/20260127_complete_spec_implementation.sql` - Latest schema

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=         # Service role (keep secret!)
APP_ENCRYPTION_KEY=                # 32-byte base64 for 2FA encryption
NEXT_PUBLIC_BASE_URL=              # Production domain
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=   # Google Maps API
TWILIO_ACCOUNT_SID=                # Twilio credentials
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
STRIPE_SECRET_KEY=                 # Stripe credentials
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=                    # Email service
RESEND_FROM_EMAIL=
```

See `.env.example` for template.

## Deployment Checklist

See `READY_TO_DEPLOY.md` and `DEPLOYMENT_CHECKLIST.md` for full pre-deployment verification steps.

**Quick checks:**
1. Run SQL migrations in Supabase
2. Set all environment variables
3. Test login flow with each role
4. Verify RLS policies active
5. Test SMS sending (Twilio)
6. Verify payment flow (Stripe)
7. Check rate limiting works
8. Test on mobile device

## Troubleshooting

**"Column access_permissions does not exist"**
→ Run `db/migrations/20260126_add_permissions.sql` first

**"Operator does not exist: user_role = text"**
→ See `SQL_MIGRATION_GUIDE.md` for enum fix

**Rate limit errors in development**
→ Rate limit state resets on server restart (in-memory)

**RLS policy denies access**
→ Check user's `company_id` matches resource `company_id`
→ Verify role has correct permissions in `companies.role_permissions`

**SMS not sending**
→ Check Twilio credentials in `.env.local`
→ Verify phone numbers are E.164 format (+1XXXXXXXXXX)
→ Check Twilio console for delivery status

## Testing Strategy

- **Unit tests:** Business logic in `lib/` (pricing, permissions, crypto)
- **Integration tests:** API routes with mocked Supabase
- **Component tests:** UI components with React Testing Library
- **Coverage:** 100% required for CI/CD

Mock Supabase in tests:
```typescript
vi.mock("@/lib/supabaseServer", () => ({
  createUserClient: vi.fn(() => mockSupabaseClient),
}));
```

## Current Status

See `READY_TO_DEPLOY.md` for detailed implementation status (~70% complete).

**Working features:**
- Mobile-first navigation (5 tabs per role)
- SMS auto-triggers and two-way inbox
- Sales pipeline management
- Dynamic pricing calculator
- No-show protocol
- Role-based permissions
- Database schema (16 new tables)

**In progress:**
- Photo upload UI
- Public rating page
- Availability calendar
- Subscription management
- Equipment checklist UI

**Planned:**
- Territory drawing
- Loyalty dashboard
- Referral tracking
- Onboarding checklist
- Quebec receipt generator
