# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL: READ THIS FIRST ⚠️

**TOKEN EFFICIENCY IS MANDATORY - SKILLS AND AGENTS ARE NOT OPTIONAL**

Before doing ANY work, check these decision trees:

### Decision Tree 1: Can a Skill Do This?

```
User asks for work
     ↓
Does a skill exist for this task?
     ↓
    YES → INVOKE THE SKILL IMMEDIATELY ✅
     ↓
    NO  → Continue to Decision Tree 2
```

**Available Skills:** api-builder, bug-fixer, spec-enforcer, test-generator, ui-builder, migration-builder, french-ui-helper, rls-policy-builder, supabase-query-builder, docs-updater

**Token Savings:** 70-90% compared to manual work

### Decision Tree 2: Is This Complex Multi-Step Work?

```
Task requires 2+ files or multiple steps?
     ↓
    YES → DELEGATE TO AGENT IMMEDIATELY ✅
     ↓
    NO  → Proceed with manual work (but double-check Decision Tree 1 first)
```

**Available Agents:** feature-builder, database-architect, qa-engineer, bug-hunter, deploy-manager, code-reviewer

**Token Savings:** 85-95% compared to manual multi-step work

### Examples

❌ **WRONG:**
- User: "Create API for customer ratings" → You manually write code
- User: "Build photo upload feature" → You manually implement API + UI
- User: "Fix navigation bug" → You manually debug

✅ **CORRECT:**
- User: "Create API for customer ratings" → Invoke **api-builder** skill
- User: "Build photo upload feature" → Delegate to **feature-builder** agent
- User: "Fix navigation bug" → Invoke **bug-fixer** skill

### Why This Matters

- **Manual work uses 10-20x more tokens** than using skills/agents
- **Skills enforce patterns automatically** (no copy-paste errors)
- **Agents don't forget steps** (tests, docs, edge cases)
- **Faster completion** (3-5x speed improvement)
- **Lower cost** (70-95% token reduction)

**DO NOT proceed to manual work without checking these decision trees first.**

See "Available Skills" and "Available Agents" sections below for full reference.

---

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

### Token Efficiency (CRITICAL - READ FIRST)

**Using skills and agents is NOT optional - it's REQUIRED for token efficiency.**

Skills and agents reduce token usage by 70-90% by using specialized context instead of the full codebase. They also enforce consistency and quality automatically.

#### When to Use Skills (Invoke IMMEDIATELY)

Skills are specialized tools for focused tasks. When a user asks for something a skill handles, invoke the skill FIRST before doing any manual work.

| Skill | Use When | Example Trigger |
|-------|----------|-----------------|
| **api-builder** | Creating ANY API endpoint | "Create an API for...", "Add endpoint to...", "Build route for..." |
| **bug-fixer** | Fixing ANY bug or error | "Fix the bug where...", "Debug the issue...", "The feature is broken..." |
| **spec-enforcer** | Verifying compliance | "Check if this meets spec", "Verify requirements", "Before deploying..." |
| **test-generator** | Writing ANY tests | "Generate tests for...", "Add test coverage...", "Need 100% coverage..." |
| **ui-builder** | Building ANY UI component | "Create a page for...", "Build component for...", "Design form for..." |
| **migration-builder** | Creating DB migrations | "Add table for...", "Modify schema...", "Create migration..." |
| **french-ui-helper** | Generating French text | "Need French labels...", "Translate UI...", "SMS template for..." |
| **rls-policy-builder** | Creating RLS policies | "Add RLS for...", "Secure table...", "Multi-tenancy policy..." |
| **supabase-query-builder** | Writing Supabase queries | "Query for...", "Fetch data from...", "Update records..." |
| **docs-updater** | Updating documentation | "Update docs after...", "Document this feature...", "Sync CLAUDE.md..." |

**Pattern:**
```
❌ WRONG: User asks "Create API for customer addresses" → You manually code it
✅ CORRECT: User asks "Create API for customer addresses" → Invoke api-builder skill IMMEDIATELY
```

#### When to Use Agents (Delegate Complex Work)

Agents are autonomous workers for multi-step tasks. When a user asks for complex work requiring multiple operations, delegate to an agent instead of doing it yourself.

| Agent | Use When | Example Trigger |
|-------|----------|-----------------|
| **feature-builder** | Building complete features | "Implement photo upload feature", "Add customer rating system", "Build subscription manager" |
| **database-architect** | Database design work | "Design schema for...", "Restructure tables...", "Add indexing strategy..." |
| **qa-engineer** | Testing & QA workflows | "Run full test suite", "Verify coverage", "Set up CI/CD testing" |
| **bug-hunter** | Complex bug investigation | "Investigate why...", "Root cause analysis for...", "Debug complex issue..." |
| **deploy-manager** | Deployment preparation | "Prepare for deployment", "Create deployment checklist", "Verify production readiness" |
| **code-reviewer** | Code review tasks | "Review this feature", "Check spec compliance", "Audit codebase for..." |

**Pattern:**
```
❌ WRONG: User asks "Build photo upload feature" → You manually code API + UI + tests + docs
✅ CORRECT: User asks "Build photo upload feature" → Delegate to feature-builder agent IMMEDIATELY
```

#### Why Token Efficiency Matters

1. **Cost reduction:** Skills use 10-30% of tokens compared to manual context
2. **Speed:** Pre-built workflows complete tasks 3-5x faster
3. **Consistency:** Automatic pattern enforcement (no copy-paste errors)
4. **Quality:** Built-in testing, validation, and error handling
5. **Maintainability:** Centralized patterns easier to update

#### Skills vs Manual Work: Token Comparison

| Task | Manual Approach | Using Skill | Token Savings |
|------|-----------------|-------------|---------------|
| Create API route | 15,000 tokens (full codebase context) | 2,000 tokens (api-builder context) | **87%** |
| Fix navigation bug | 20,000 tokens (investigate + fix) | 3,000 tokens (bug-fixer workflow) | **85%** |
| Build UI component | 12,000 tokens (patterns + implementation) | 2,500 tokens (ui-builder templates) | **79%** |
| Generate tests | 8,000 tokens (examples + implementation) | 1,500 tokens (test-generator patterns) | **81%** |

#### Enforcement Rules

1. **ALWAYS check if a skill exists before doing manual work** - If yes, use the skill
2. **ALWAYS check if work is complex multi-step** - If yes, delegate to agent
3. **NEVER manually code what a skill can generate** - This wastes tokens
4. **NEVER do multi-step work yourself when an agent exists** - Delegate it

### Code Philosophy: ZERO TOLERANCE FOR HALF-MEASURES

**Every line of code must be 100% production-ready from the start.** No exceptions.

- **NO shortcuts** - No "TODO", no "FIXME", no "we'll fix this later"
- **NO temporary solutions** - If you write it, it ships to production
- **NO inline duplication** - Always check lib/ for existing code before writing new code
- **NO workarounds** - If a rule exists, follow it. If it's wrong, change the rule properly
- **CHECK lib/ FIRST** - Before writing ANY new utility, schema, or helper, search lib/ to see if it exists

**Why this matters:** Technical debt compounds. A "quick fix" today becomes a production bug tomorrow. Write it right the first time.

### Code Style

- **TypeScript strict mode:** No `any` types (use `unknown` + type guards)
- **Named exports:** Prefer `export function foo()` over `export default foo`
- **Imports:** Use `@/` path alias for all absolute imports
- **Validation:** Use Zod for all external data (API requests, env vars)
- **Reusability:** Always prefer existing code over writing new code

### Input Validation (CRITICAL - ZERO TOLERANCE)

**ALL Zod schemas MUST be centralized in `lib/validators.ts` - NEVER define inline in route files.**

This is not a suggestion. This is a hard requirement with zero exceptions.

```typescript
// ❌ WRONG - Inline schema in API route
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// ❌ WRONG - Duplicate password schema
const passwordSchema = z.string().min(8).regex(/[A-Z]/)...

// ✅ CORRECT - Import from validators
import { userCreateSchema, passwordSchema, changePasswordSchema } from "@/lib/validators";
```

**Current status:** ✅ **ZERO violations** - All 38 schemas centralized in `lib/validators.ts`

**Password validation schemas:**
- `passwordSchema` - Base password complexity rules (8+ chars, uppercase, number, special char)
- `changePasswordSchema` - For logged-in users changing password: currentPassword + newPassword + confirmPassword with matching validation
- `resetPasswordSchema` - For forgot password flow: code + newPassword + confirmPassword with matching validation
- `adminResetPasswordSchema` - For admins resetting user passwords: newPassword + confirmPassword with matching validation

**Security requirements (ENFORCED):**
- Password changes MUST verify current password before allowing update (use Supabase signInWithPassword)
- Password resets MUST require password confirmation field
- Admin password resets MUST require password confirmation field
- All password schemas MUST enforce complexity rules: min 8 chars, uppercase, number, special char

**Recently migrated (2026-01-28):**
- `ratingSubmitSchema` - Customer rating submission validation
- `dispatchScheduleSchema` - Job scheduling validation
- `photoUploadSchema` - Job photo upload validation
- `availabilitySlotSchema`, `availabilityUpdateSchema` - Technician availability validation
- `profileUpdateSchema` - User profile update validation

**All schemas in lib/validators.ts (38 total):**
- Authentication: registerSchema, loginSchema, verify2faSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, adminResetPasswordSchema, adminResetByEmailSchema
- Jobs: jobCreateSchema, jobUpdateSchema, jobAssignSchema, jobCheckInSchema, jobCheckOutSchema, jobUpsellSchema
- Customers: customerCreateSchema, customerUpdateSchema, blacklistSchema, complaintSchema
- Invoices: invoiceCreateSchema, invoiceUpdateSchema, invoiceSendSchema, invoicePaymentSchema
- Payments: paymentInitSchema, paymentRefundSchema
- Communication: smsSendSchema, emailSendSchema
- GPS: gpsCheckinSchema, gpsPingSchema, geofenceCreateSchema
- Users: userCreateSchema, userUpdateSchema, companyUpdateSchema, notificationSettingsSchema, seedAccountsSchema
- Sales: leadCreateSchema, territoryCreateSchema, commissionCreateSchema, payrollCreateSchema
- Operations: checklistCreateSchema, incidentCreateSchema, qualityIssueCreateSchema
- Dispatch: dispatchReassignSchema, weatherCancelSchema, dispatchScheduleSchema
- Ratings: ratingSubmitSchema
- Photos: photoUploadSchema
- Availability: availabilitySlotSchema, availabilityUpdateSchema
- Profile: profileUpdateSchema

**Why this matters:**
- Single source of truth for validation rules
- Consistent error messages across all endpoints
- Easy to update validation logic in one place
- Type safety shared between routes
- Zero code duplication
- Production-ready security from day one

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
1. Twilio credentials in `.` are correct
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

## Current Status (2026-01-28)

**Overall Progress:** ~92% Complete ✅ (+2% from previous update)

**Foundation:** 100% complete ✅
- Authentication, database, RLS, rate limiting, permissions all working
- Security hardened: removed self-signup, admin-only user creation
- Password validation: 8 chars min with complexity requirements
- Mobile viewport locked (no zoom/pan, native app feel)
- **ZERO TOLERANCE policy enforced:** All 38 Zod schemas centralized in lib/validators.ts

**Code Quality & Architecture (2026-01-28):** ✅
- Migrated all 6 inline Zod schemas to lib/validators.ts (ratingSubmitSchema, dispatchScheduleSchema, photoUploadSchema, availabilitySlotSchema, availabilityUpdateSchema, profileUpdateSchema)
- Removed CLI scripts (10 npm scripts + bash wrapper) - not useful for solo development
- Optimized agent models for token efficiency: qa-engineer/deploy-manager use haiku (60-80% savings), others use sonnet (40-60% savings)
- Updated all documentation with ZERO TOLERANCE rules and token efficiency guidelines
- Verified zero inline schema violations with grep - production-ready validation system

**User Management & Auth (2026-01-28):** ✅
- Admin user management panel (`/admin/users`) - Full CRUD with French UI, pagination, modals
- User settings/profile page (`/profile`) - 3 tabs: Documents, Security, Profile
- File upload system - Contract, ID photo, profile photo to Supabase Storage
- Password change with strength indicator (Faible/Moyen/Fort) and auto-logout
- Logout button with confirmation modal
- Phone auto-login with localStorage caching ("Se souvenir de ce numéro")
- Fixed bottom navigation styling bug (only 1 tab active at a time)

**Working Features:** Most core functionality operational ✅
- Mobile-first navigation (5 tabs per role, permission-aware)
- SMS system (auto-triggers, two-way inbox, French templates)
- Technician workflow (GPS, check-in/out, job management)
- Job/Customer CRUD (dispatch, assign, status updates)
- Dynamic pricing calculator (all 5 factors working)
- No-show protocol (complete workflow)
- API routes functional with real Supabase integration

**Remaining Tasks:** ⚠️
- Job photo upload UI (database ready, need 4-sides photo component)
- Public rating page (database ready, need public route)
- Availability calendar UI (database ready, need calendar component)
- Supabase Storage bucket setup (`user-documents` bucket needs creation)
- Add `/profile` link to navigation for all roles

See `READY_TO_DEPLOY.md` for detailed analysis and deployment checklist.

## Critical Files

**Core:**
- `middleware.ts` - Auth checks, rate limiting, protected routes
- `lib/auth.ts` - Authentication helpers (requireUser, requireRole, requirePermission)
- `lib/permissions.ts` - Permission resolution (user → company → default)
- `lib/supabaseServer.ts` - Three client factories (anon, user, admin)
- `lib/validators.ts` - 38 Zod schemas for ALL API inputs (ZERO inline schemas - 100% centralized)
- `components/BottomNavMobile.tsx` - Main navigation (5-tab enforcer, fixed styling)
- `vitest.config.ts` - Test configuration (100% coverage required)

**New (2026-01-28):**
- `app/(app)/admin/users/page.tsx` - Admin user management UI
- `app/(app)/profile/page.tsx` - User settings/profile page
- `app/api/admin/users/route.ts` - User CRUD endpoints
- `app/api/admin/users/[user_id]/route.ts` - User update/delete
- `app/api/admin/users/[user_id]/reset-password/route.ts` - Password reset
- `app/api/settings/upload/route.ts` - File upload handler
- `app/api/settings/password/route.ts` - Password change
- `app/api/settings/profile/route.ts` - Profile update
- `app/api/settings/document/route.ts` - Document deletion
- `components/auth/LoginForm.tsx` - Updated with auto-login

## Documentation

- **ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md** - Complete project specification (48+ requirements)
- **READY_TO_DEPLOY.md** - Current implementation status (~90% complete, updated 2026-01-28)
- **README.md** - Quick start guide for developers
- **AGENTS.md** - Quick reference for AI assistants (ChatGPT, Codex, Copilot)
- **SQL_MIGRATION_GUIDE.md** - Database migration troubleshooting (if exists)

## Available Skills (MUST USE - Token Efficiency)

**CRITICAL: Skills are NOT optional. When a task matches a skill's purpose, you MUST use the skill instead of coding manually.**

### Skill Reference Table

| Skill Name | Purpose | When to Invoke | Typical Token Savings |
|------------|---------|----------------|----------------------|
| **api-builder** | Generate production-ready Next.js API routes with Zod validation, RLS filters, and error handling | Creating ANY new API endpoint or route | 85-90% |
| **bug-fixer** | Debug and fix bugs including 404 errors, fake data, broken features, and type errors. Finds root cause and makes minimal fixes. | ANY bug report, error, or broken functionality | 80-85% |
| **spec-enforcer** | Verify code matches ENTRETIEN_PRESTIGE_FINAL_SPEC-1.md requirements. Use before completing features or deploying. | Before deployment, after feature completion, when verifying compliance | 75-80% |
| **test-generator** | Generate Vitest tests with 100% coverage for API routes and components. Auto-runs tests and reports coverage. | Writing ANY tests or improving coverage | 80-85% |
| **ui-builder** | Generate mobile-first React components with 640px max width, Tailwind CSS, and French labels. Use for creating pages or components. | Building ANY UI component, page, or form | 75-85% |
| **migration-builder** | Generate SQL migration files with RLS policies, triggers, and indexes. Creates Quebec-compliant database schemas for Supabase PostgreSQL. | ANY database schema change or RLS policy | 80-90% |
| **french-ui-helper** | Generate French UI labels, validation messages, and SMS templates for Quebec. Converts English to proper Quebec French with correct grammar and idioms. | ANY French text needed (UI, validation, SMS) | 70-80% |
| **rls-policy-builder** | Generate Row Level Security (RLS) policies for Supabase tables. Ensures multi-tenancy isolation by company_id and role-based access control. | Creating/updating RLS policies for any table | 75-85% |
| **supabase-query-builder** | Generate type-safe Supabase queries with RLS filtering, error handling, and proper TypeScript types. Ensures company_id filtering for multi-tenancy. | Writing ANY Supabase database query | 70-80% |
| **docs-updater** | Update CLAUDE.md, README.md, and READY_TO_DEPLOY.md after completing features. Keeps documentation synchronized with codebase changes. | After ANY feature completion or significant change | 85-90% |

### Usage Pattern

**Invoke skills using the Skill tool:**
```typescript
Skill({ skill: "api-builder", args: "Create endpoint for customer address updates" })
Skill({ skill: "bug-fixer", args: "Navigation shows multiple active tabs" })
Skill({ skill: "ui-builder", args: "Build job photo upload component with 4-sides grid" })
```

### Example Decision Tree

**User Request:** "Create an API for submitting customer ratings"

```
Step 1: Does a skill exist for this? → YES (api-builder)
Step 2: Invoke skill IMMEDIATELY → Skill({ skill: "api-builder", args: "..." })
Step 3: DONE ✅
```

**DO NOT:**
```
Step 1: Read existing API patterns
Step 2: Read validators.ts
Step 3: Read auth.ts
Step 4: Manually write the code
❌ This wastes 15,000+ tokens when api-builder uses 2,000
```

## Available Agents (MUST USE - Complex Work)

**CRITICAL: Agents are NOT optional. When a task is complex or multi-step, you MUST delegate to an agent instead of doing it yourself.**

### Agent Reference Table

| Agent Name | Purpose | When to Delegate | Typical Work Scope |
|------------|---------|------------------|-------------------|
| **feature-builder** | End-to-end feature implementation (API + UI + tests + docs). Handles complete features from spec to deployment-ready code. | User requests a complete feature or major functionality | API routes + UI components + tests + docs (complete vertical slice) |
| **database-architect** | Database schema design, migrations, and RLS policies. Designs normalized schemas, creates migrations, and ensures proper indexing. | Database design, schema changes, performance optimization | Schema design + migrations + RLS policies + indexes + constraints |
| **qa-engineer** | Testing, quality assurance, and coverage verification. Generates comprehensive test suites and verifies 100% coverage. | Testing requirements, coverage improvements, QA workflows | Test generation + coverage verification + CI/CD setup + quality gates |
| **bug-hunter** | Bug investigation, root cause analysis, and fixing. Deep dives into complex issues and provides minimal, targeted fixes. | Complex bugs, mysterious errors, multi-file issues | Investigation + root cause + fix + verification + regression tests |
| **deploy-manager** | Deployment preparation, verification, and checklist management. Ensures production readiness and handles deployment workflows. | Pre-deployment checks, production setup, release prep | Environment setup + checklist verification + migration execution + rollback plans |
| **code-reviewer** | Code review against spec, patterns, and best practices. Audits codebase for compliance and suggests improvements. | Code review requests, quality audits, pattern enforcement | Spec compliance check + pattern adherence + security review + recommendations |

### Usage Pattern

**Delegate to agents using natural language:**
```
"Use the feature-builder agent to implement the photo upload feature"
"Use the bug-hunter agent to investigate the RLS policy error"
"Use the deploy-manager agent to prepare for production deployment"
```

### Agent vs Manual Work: Decision Matrix

| User Request Type | Manual Work? | Agent to Use | Why |
|-------------------|--------------|--------------|-----|
| "Build photo upload feature" | ❌ NO | feature-builder | Multi-step: API + UI + tests + docs |
| "Fix navigation bug" | ⚠️ MAYBE | Use bug-fixer skill first | Single bug = skill; complex issue = bug-hunter agent |
| "Add customer ratings" | ❌ NO | feature-builder | Complete feature requires API + UI + DB |
| "Review code for spec compliance" | ❌ NO | code-reviewer | Agent has spec + patterns context |
| "Prepare for deployment" | ❌ NO | deploy-manager | Multi-step verification workflow |
| "Design subscription schema" | ❌ NO | database-architect | Requires design + migrations + RLS |
| "Generate tests for API routes" | ⚠️ MAYBE | Use test-generator skill | Simple tests = skill; full suite = qa-engineer agent |

### Example Decision Tree

**User Request:** "Build the customer rating system with public rating page, SMS notifications, and Google review redirect"

```
Step 1: Is this a complete feature? → YES
Step 2: Does it require API + UI + tests? → YES
Step 3: Delegate to feature-builder agent IMMEDIATELY
Step 4: DONE ✅
```

**DO NOT:**
```
Step 1: Manually create API routes
Step 2: Manually build UI components
Step 3: Manually write tests
Step 4: Manually update docs
❌ This wastes 40,000+ tokens when feature-builder handles it in one workflow
```

### Why Agents Matter

1. **Token efficiency:** Agents use 5-10% of tokens compared to manual multi-step work
2. **Completeness:** Agents don't forget steps (tests, docs, edge cases)
3. **Consistency:** Agents enforce patterns across all work products
4. **Speed:** Parallel work streams complete faster than sequential manual work
5. **Quality:** Built-in verification and validation at each step

### Enforcement Rules

1. **IF task requires 2+ files/steps → MUST use agent**
2. **IF task includes "feature", "system", "complete" → MUST use feature-builder**
3. **IF task includes "deploy", "production", "release" → MUST use deploy-manager**
4. **IF task includes "database", "schema", "migration" → MUST use database-architect**
5. **IF task includes "test all", "coverage", "QA" → MUST use qa-engineer**
6. **IF task includes "investigate", "root cause", "complex bug" → MUST use bug-hunter**
7. **IF task includes "review", "audit", "verify spec" → MUST use code-reviewer**

## Claude Code Features

This project includes a complete Claude Code development environment with specialized tools, automation, and integrations.

### Available Features

#### 1. Specialized Agents (6 Total)
Located in `.claude/agents/` with full YAML frontmatter:
- **feature-builder** - End-to-end feature implementation
- **database-architect** - Schema design, migrations, RLS policies
- **qa-engineer** - Testing and 100% coverage verification
- **bug-hunter** - Bug investigation and minimal fixes
- **deploy-manager** - Deployment preparation and verification
- **code-reviewer** - Code review against spec and patterns

See `.claude/AGENTS_GUIDE.md` for complete documentation.

#### 2. Custom Skills (10 Total)
Located in `.claude/skills/` with full frontmatter:
- **api-builder** - Generate production-ready API routes
- **ui-builder** - Generate mobile-first React components
- **test-generator** - Generate Vitest tests with 100% coverage
- **bug-fixer** - Debug and fix bugs with minimal changes
- **migration-builder** - Generate SQL migrations with RLS
- **french-ui-helper** - Generate French UI labels and SMS templates
- **rls-policy-builder** - Generate Row Level Security policies
- **supabase-query-builder** - Generate type-safe Supabase queries
- **docs-updater** - Update project documentation
- **spec-enforcer** - Verify code matches spec requirements

See `.claude/SKILLS_GUIDE.md` for complete documentation.

#### 3. Output Styles (3 Total)
Located in `.claude/output-styles/`:
- **quebec-french** - Enforces Quebec French UI standards
- **production-ready** - Zero-tolerance quality enforcement
- **code-review** - Structured code review format

Usage:
```bash
claude --output-style quebec-french
claude --output-style production-ready
claude --output-style code-review
```

#### 4. Comprehensive Hooks
Located in `.claude/hooks/` with automatic validation:

**PreToolUse Hooks:**
- Warn about destructive commands (rm -rf, DROP TABLE)
- Check for missing authentication in API routes
- Suggest migrations instead of editing base schema
- Confirm before writing sensitive files

**PostToolUse Hooks:**
- Auto-format TypeScript/TSX files with Prettier
- Auto-lint API routes with ESLint
- Auto-run tests after changes
- Check test coverage (100% required)
- Verify RLS filtering in queries

**Session Hooks:**
- Display welcome message with quick commands (SessionStart)
- Show session summary with modified files (SessionEnd)
- Run project setup checks (Setup)
- Clean up temporary files (Stop)

See `.claude/settings.json` for complete hook configuration.

#### 5. MCP Integration
Model Context Protocol servers for enhanced capabilities:

**Available MCP Servers:**
- **supabase-local** - Direct database access and query execution
- **git-integration** - Git operations and repository management
- **file-search** - Fast content search with ripgrep
- **typescript-language** - TypeScript type checking and IntelliSense
- **testing** - Vitest test execution and coverage reports
- **stripe-integration** - Stripe payment operations (when configured)
- **twilio-sms** - Twilio SMS operations (when configured)

See `MCP_SETUP.md` for complete configuration guide.

#### 6. LSP Integration
Language Server Protocol support for:
- **TypeScript** - Auto-completion, type checking, refactoring
- **Tailwind CSS** - Class name completion, color preview, linting
- **ESLint** - Real-time linting and quick fixes
- **JSON** - Schema validation for config files
- **SQL** - PostgreSQL syntax highlighting and formatting
- **Markdown** - Document validation and linting

See `.lsp.json` for configuration.

#### 7. ~~CLI Automation~~ (REMOVED)

**Status:** CLI scripts removed as of 2026-01-28

**Reason:** CLI automation scripts are designed for CI/CD pipelines and team workflows. For solo development with direct Claude Code interaction, they add no value and complicate the workflow.

**What was removed:**
- `scripts/claude-automation.sh` - CLI wrapper script
- All `npm run claude:*` scripts from package.json (10 total)

**Why this is better:**
- Direct skill/agent invocation is faster and more flexible
- No need for CLI wrappers when you can just type `/api-builder` or use Task tool
- Simpler project structure
- Less maintenance overhead

**How to use skills/agents now:**
```bash
# In Claude Code conversation:
/api-builder Create /api/ratings/submit endpoint
/bug-fixer Fix navigation not showing for managers

# Or use Task tool for agents:
Task(subagent_type="feature-builder", prompt="Build photo upload feature")

# Fix bugs
npm run claude:fix-bug "Dashboard shows 0 for revenue"

# Pre-deployment checks
npm run claude:pre-deploy

# Generate tests for all untested files
npm run claude:generate-tests

# Update documentation
npm run claude:update-docs "Added loyalty points feature"

# CI/CD checks
npm run claude:ci
```

See `scripts/claude-automation.sh` for implementation.

#### 8. Plugin Distribution
Plugin manifest for team distribution:

**Files:**
- `.claude-plugin/plugin.json` - Main plugin manifest
- `.claude-plugin/marketplace.json` - Marketplace distribution config
- `.claude-plugin/README.md` - Plugin documentation

**Installation:**
```bash
claude plugins install entretien-prestige-dev
claude plugins activate entretien-prestige-dev
```

### Quality Standards Enforced

Claude Code integration enforces:
- ✅ 100% test coverage (statements, branches, functions, lines)
- ✅ Authentication on all API routes (requireUser/requireRole/requirePermission)
- ✅ RLS filtering on all queries (company_id filter)
- ✅ Zod validation on all API inputs
- ✅ French UI for all customer-facing text
- ✅ Mobile-first design (640px max-width)
- ✅ TypeScript strict mode (no any types)
- ✅ Comprehensive error handling

### Session Workflow

**Starting a session:**
```bash
claude
```

You'll see:
- 👋 Welcome message
- 📋 Project info (stack, language, design constraints)
- 🎯 Quick commands (npm scripts)
- 🤖 Available agents (6 specialized agents)
- 🔧 Available skills (10 custom skills)
- 📖 Key documentation links

**Ending a session:**
```bash
exit
```

You'll see:
- 📊 Session summary
- 📝 Modified files count
- 💡 Reminders (run tests, check build, review changes)

### Troubleshooting Claude Code

**Issue: Agents/skills not loading**
```bash
# Verify directory structure
ls .claude/agents/
ls .claude/skills/

# Clear cache and restart
rm -rf ~/.claude/cache
claude --restart
```

**Issue: Hooks not running**
```bash
# Make hooks executable
chmod +x .claude/hooks/*.sh

# Test hook manually
bash .claude/hooks/validate-migration.sh db/migrations/test.sql
```

**Issue: MCP servers not connecting**
```bash
# Check MCP status
claude --mcp-status

# Test MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"ping"}' | npx supabase-mcp-server

# Enable debug logging
MCP_DEBUG=1 claude --mcp supabase-local query "SELECT 1"
```

See `TROUBLESHOOTING.md` for complete troubleshooting guide.

### Documentation Locations

- **Main Guide:** `CLAUDE.md` (this file)
- **Agents:** `.claude/AGENTS_GUIDE.md`
- **Skills:** `.claude/SKILLS_GUIDE.md`
- **Claude Setup:** `.claude/README.md`
- **MCP Setup:** `MCP_SETUP.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Plugin Docs:** `.claude-plugin/README.md`
