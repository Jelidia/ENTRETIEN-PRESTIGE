# Entretien Prestige

**Mobile-First ERP for Professional Cleaning Services**

Full-stack operations platform for Quebec cleaning company with dispatch, CRM, billing, SMS automation, sales pipeline, and commission tracking.

**Status:** ~70-75% complete, foundation solid, APIs working, UI has critical gaps (see READY_TO_DEPLOY.md)

**Claude Code Integration:** Full development environment with 6 agents, 10 skills, comprehensive hooks, and MCP integration

---

## 🚀 Quick Start

### Claude Code Setup (Recommended)

If you're using Claude Code for development:

```bash
# The plugin is already configured in this project
# Just start Claude Code and the session hook will guide you:
claude

# Or run setup manually:
.claude/hooks/project-setup.sh
```

You'll have access to:
- 🤖 6 Specialized Agents (feature-builder, database-architect, qa-engineer, bug-hunter, deploy-manager, code-reviewer)
- 🔧 10 Custom Skills (api-builder, ui-builder, test-generator, migration-builder, etc.)
- 🎨 3 Output Styles (quebec-french, production-ready, code-review)
- 🔗 Comprehensive Hooks (validation, formatting, testing)
- 📡 MCP Integration (Supabase, Git, Stripe, Twilio)

See `.claude/README.md` for complete Claude Code documentation.

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

Configure required variables:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # Keep secret!

# Encryption (REQUIRED - Generate with command below)
APP_ENCRYPTION_KEY=

# Base URL (REQUIRED for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
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
```

### 3. Database Setup

Run migrations in **Supabase SQL Editor** in this exact order:

1. **Base schema:** Copy from `db/schema.sql` and execute
2. **Permissions:** Copy from `db/migrations/20260126_add_permissions.sql` and execute
3. **Complete tables:** Copy from `db/migrations/20260127_complete_spec_implementation.sql` and execute

**Verify setup:**

```sql
-- Should return 20+ tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- All tables should have RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

**Troubleshooting:** See `SQL_MIGRATION_GUIDE.md` if errors occur.

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

**Run specific tests:**

```bash
npx vitest run auth                      # Tests matching "auth"
npx vitest run --grep "pricing"          # Pattern matching
npx vitest run tests/lib/pricing.test.ts # Specific file
npx vitest run --coverage               # Coverage report
```

**Coverage requirement:** 100% (statements, branches, functions, lines)

### Type Checking

```bash
npx tsc --noEmit     # Type check without building
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
entretien-prestige/
├── app/
│   ├── (app)/                   # Authenticated pages (requires login)
│   │   ├── dashboard/           # Admin/Manager home
│   │   ├── sales/               # Sales rep section
│   │   │   ├── dashboard/       # Sales dashboard with KPIs
│   │   │   ├── leads/           # Lead management
│   │   │   ├── schedule/        # Appointments (planned)
│   │   │   ├── earnings/        # Commission tracking (planned)
│   │   │   └── settings/        # Personal settings
│   │   ├── technician/          # Technician section
│   │   │   ├── page.tsx         # Today's jobs
│   │   │   ├── schedule/        # Calendar view
│   │   │   ├── equipment/       # Checklist (planned)
│   │   │   ├── earnings/        # Commission view (planned)
│   │   │   └── profile/         # Personal settings
│   │   ├── customers/           # Customer management
│   │   ├── team/                # Employee management
│   │   ├── dispatch/            # Schedule/dispatch view
│   │   ├── inbox/               # Two-way SMS inbox
│   │   ├── jobs/                # Job CRUD
│   │   └── settings/            # Company settings
│   ├── (auth)/                  # Public auth pages
│   │   └── login/               # Login page
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication endpoints
│   │   ├── jobs/                # Job CRUD operations
│   │   ├── customers/           # Customer operations
│   │   ├── sms/                 # SMS automation + inbox
│   │   ├── users/               # User management
│   │   ├── leads/               # Sales pipeline
│   │   ├── payments/            # Stripe integration
│   │   └── admin/               # Admin-only operations
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Tailwind + custom styles
│
├── components/
│   ├── BottomNavMobile.tsx      # Main navigation (5 tabs, role-based)
│   ├── Pagination.tsx           # No-scroll pagination
│   ├── BottomSheet.tsx          # Modal from bottom (mobile UX)
│   ├── Accordion.tsx            # Collapsible sections
│   ├── NoShowDialog.tsx         # Call → SMS → Skip workflow
│   └── StatusBadge.tsx          # Consistent status chips
│
├── lib/
│   ├── auth.ts                  # requireUser, requireRole, requirePermission
│   ├── permissions.ts           # Permission resolution logic
│   ├── supabaseServer.ts        # createAnonClient, createUserClient, createAdminClient
│   ├── session.ts               # Session/cookie management
│   ├── pricing.ts               # Dynamic pricing calculator
│   ├── smsTemplates.ts          # French SMS templates (10+)
│   ├── validators.ts            # 33+ Zod validation schemas
│   ├── twilio.ts                # SMS integration
│   ├── stripe.ts                # Payment processing
│   ├── resend.ts                # Email service
│   ├── rateLimit.ts             # In-memory rate limiting
│   ├── crypto.ts                # Encryption helpers
│   ├── types.ts                 # TypeScript types
│   └── queries.ts               # Common database queries
│
├── db/
│   ├── schema.sql               # Base database schema
│   └── migrations/              # Incremental SQL migrations
│       ├── 20260126_add_permissions.sql
│       └── 20260127_complete_spec_implementation.sql
│
├── tests/                       # Vitest test files
│   ├── lib/                     # Unit tests for business logic
│   ├── api/                     # API route tests
│   └── components/              # Component tests
│
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── .env.local                   # Local environment (gitignored)
├── vitest.config.ts             # Test configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── next.config.js               # Next.js configuration
├── middleware.ts                # Auth + rate limiting middleware
│
├── CLAUDE.md                    # Complete architecture guide (AI assistants)
├── AGENTS.md                    # Quick reference (ChatGPT/Codex/Copilot)
├── README.md                    # This file
├── READY_TO_DEPLOY.md           # Deployment status (70% complete)
└── SQL_MIGRATION_GUIDE.md       # Database troubleshooting
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

**Pricing factors:**
1. **Base:** Size (sq ft) + windows
2. **Evening/weekend:** +20% (after 5pm or Sat/Sun)
3. **Holiday:** +15% (Quebec statutory holidays)
4. **Volume discount:** -10% (5+ completed jobs)
5. **Subscription:** -10% (permanent)
6. **Loyalty:** 100 points = $10 off

**Service types:**
- **Basique:** $0.10/sq ft, $8/window, $80 minimum
- **Premium:** $0.15/sq ft, $12/window, $120 minimum
- **Prestige:** $0.20/sq ft, $15/window, $150 minimum

**Example:**
```typescript
import { calculatePrice } from "@/lib/pricing";

const price = calculatePrice({
  sqft: 2500,
  windows: 12,
  serviceType: "premium",
  datetime: new Date("2026-01-30T18:00:00"),  // Friday 6pm
  customerJobCount: 7,
});
// Returns: Base (375) + Evening (75) - Volume (37.5) = $412.50
```

### Quality Control

**Mandatory photos:**
- Before/after photos (2 sets)
- 4 sides per set: front, back, left, right
- 8 photos minimum total
- Cannot complete job without all photos

**Customer ratings:**
- SMS link sent after job completion (no login)
- 1-5 star rating system
- **1-3 stars:** Internal only, triggers manager follow-up
- **4-5 stars:** Redirect to Google Maps + $5 bonus to tech (if name mentioned)

**Re-work protocol:**
- Track rework jobs in separate table
- Commission adjustments (0%, 50%, or 100% deduction)
- Assign to original or different technician
- Manager approval required

### Commission Tracking

**Commission model:**
- Sales rep: % of job value (configurable per service type)
- Technician: $ per job OR % (configurable)
- Multi-tech jobs: Split percentages (50/50, 30/70, custom)
- Google review bonus: $5 for 4-5★ rating with name mention
- Rework deductions: Manager sets penalty amount

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
├── lib/
│   ├── pricing.test.ts          # Pricing calculator
│   ├── permissions.test.ts      # Permission resolution
│   └── crypto.test.ts           # Encryption helpers
├── api/
│   ├── auth/login.test.ts       # Login endpoint
│   └── jobs/create.test.ts      # Job creation
└── components/
    └── BottomNavMobile.test.tsx # Navigation
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

### Environment Variables

**Required:**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_ENCRYPTION_KEY=
NEXT_PUBLIC_BASE_URL=
```

**Optional (configure as needed):**
```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Pre-Deploy Checklist

- [ ] Run database migrations in Supabase
- [ ] Set all environment variables in Vercel
- [ ] Verify build succeeds: `npm run build`
- [ ] Run tests: `npm test`
- [ ] Type check: `npx tsc --noEmit`
- [ ] Lint: `npm run lint`

### Post-Deploy Verification

- [ ] Test login with each role
- [ ] Verify 5-tab navigation per role
- [ ] Check rate limiting (trigger 429 error)
- [ ] Test SMS sending (if configured)
- [ ] Verify mobile layout (640px max width)
- [ ] Check browser console for errors

See `READY_TO_DEPLOY.md` for detailed deployment status and checklist.

---

## 📚 Documentation

### For Developers

- **CLAUDE.md** - Complete architecture guide with code examples (read this first!)
- **AGENTS.md** - Quick reference for AI coding assistants (ChatGPT, Codex, Copilot)
- **README.md** - This file (setup and overview)

### For Deployment

- **READY_TO_DEPLOY.md** - Implementation status (~70% complete), deployment checklist
- **SQL_MIGRATION_GUIDE.md** - Database migration troubleshooting

### For Business

- **ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md** - Complete project specification (48+ requirements)

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
- `POST /api/sms/mark-read` - Mark conversation as read

**See `CLAUDE.md` for complete API patterns and examples.**

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
- Run `db/migrations/20260126_add_permissions.sql`
- See `SQL_MIGRATION_GUIDE.md` for details

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

**Project:** Entretien Prestige
**Location:** Grand Montréal, Quebec, Canada
**Version:** 1.0 (In Development - 70-75% Complete)
**Specification:** Version 2.0 - Final (January 27, 2026)
**Status:** NOT READY FOR PRODUCTION (critical bugs found - see READY_TO_DEPLOY.md)

**For technical questions:**
- See `CLAUDE.md` - Complete architecture
- See `AGENTS.md` - Quick reference
- See `SQL_MIGRATION_GUIDE.md` - Database issues

**For business requirements:**
- See `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md` - Full specification

**For deployment:**
- See `READY_TO_DEPLOY.md` - Status and checklist

---

## 📝 License

Proprietary - All rights reserved

---

**Last Updated:** 2026-01-27
