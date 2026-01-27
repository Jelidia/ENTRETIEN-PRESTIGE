# AGENTS.md

Guidance for agentic coding assistants working in this repo.

Read `CLAUDE.md` first for the full spec and business rules.

## Repo Snapshot
- Product: Entretien Prestige (field-service ERP for a Quebec cleaning company)
- Stack: Next.js 14 App Router, TypeScript, Tailwind, Supabase (Postgres + RLS)
- Language: French for UI/SMS/customer content; English for code and comments
- Mobile-first: max width 640px, bottom nav always, no sidebar, exactly 5 tabs per role
- Progress: ~85% complete (foundation done, core features implemented)
- Status: Ready for deployment, missing job photos, rating page, availability calendar UI

## Commands
Install and run:
- npm install
- npm run dev (local dev server)
- npm run build (production build)
- npm run start (serve production build)
- npm run lint (ESLint)

Tests:
- npm test (vitest run with 100% coverage thresholds)
- npm run test:watch (watch mode)

Run a single test:
- npx vitest run auth (matches test name or file substring)
- npx vitest run --grep "login" (pattern match)
- npx vitest run lib/pricing.test.ts (specific file)

Type check only:
- npx tsc --noEmit

## Cursor/Copilot Rules
- No .cursor/rules, .cursorrules, or .github/copilot-instructions.md found.

## Project Structure
- app/: Next.js App Router pages and API routes
  - (app)/: Authenticated pages (route group)
  - (auth)/: Auth pages (login, register, reset password)
  - api/: API routes (auth, jobs, customers, sms, users, etc.)
- components/: Shared UI components (BottomNav, Forms, StatusBadge, etc.)
- lib/: Business logic (auth, permissions, pricing, validators, integrations)
- db/: Schema and migrations (manual SQL apply in Supabase)
- tests/: Vitest tests (currently 5 files, need more coverage)

## Code Style and Conventions
TypeScript:
- Strict mode; avoid any (use unknown + type guards)
- Prefer named exports over default exports
- Use type-only imports when possible
- Avoid type assertions unless required by an API surface

Imports and paths:
- Use @/ absolute imports from repo root (tsconfig paths)
- Avoid relative traversals like ../../
- Group imports: external, internal (@/), then relative

Formatting and files:
- Follow existing formatting; keep diffs minimal
- Keep ASCII for new content unless file already uses Unicode
- Avoid unnecessary comments; only explain non-obvious logic

Naming:
- Components and types: PascalCase (CustomerCard, JobPayload)
- Functions and variables: camelCase (createJob, sendSms)
- Constants: UPPER_SNAKE_CASE for fixed config values
- API route folders: kebab-case (app/api/reset-password/route.ts)
- Zod schemas: camelCase + Schema (loginSchema)

## API Route Pattern
Use the standard handler flow:
1) Authenticate with requireUser/requireRole/requirePermission
2) Validate input with Zod safeParse
3) Perform Supabase query (RLS enforced)
4) Return NextResponse.json with a friendly message

Example response shape:
- Success: { success: true, data }
- Error: { error: "User-friendly message", details?: techDetails }

## Auth and Permissions
- Use requireUser/requireRole/requirePermission from lib/auth
- Early return if auth returns { response }
- Combine role + permission checks when needed

## Supabase and Data Access
- No ORM; use Supabase client queries directly
- Always filter by company_id for multi-tenancy
- Prefer explicit select columns (avoid select *)
- Use .single() for exactly one row; .maybeSingle() if optional
- Use createUserClient for normal access; admin client only in trusted server code

## Validation and Security
- Validate all external input with Zod (lib/validators)
- Never trust request.json without validation
- Do not expose raw error.message to clients
- Log errors with context (jobId, userId, companyId, etc.)

## Error Handling
- Log server-side errors with context
- Return user-friendly errors with appropriate HTTP status
- Avoid leaking DB or provider details in responses

## UI and UX Rules
- Mobile-first layout; max width 640px and centered on desktop
- BottomNavMobile always present; exactly 5 tabs per role
- No sidebar; no horizontal scroll
- Preserve existing design patterns unless explicitly requested

## Styling and Layout
- Tailwind utility classes are standard; avoid custom CSS unless needed
- Use Pagination/BottomSheet patterns instead of long scrolls
- Keep spacing consistent with existing components
- Avoid new global styles unless required in app/globals.css

## Localization
- French text for user-facing UI, SMS templates, and customer messages
- Keep labels concise for mobile screens
- Technical logs and comments can stay in English

## Testing Guidelines
- Vitest + Testing Library + jsdom
- 100% coverage required (statements, branches, functions, lines)
- Unit tests live in tests/ for lib logic
- Mock Supabase clients in integration tests

## Domain Rules to Respect
- No-show flow: call, SMS, wait 10 minutes before skip; no commission for no-show
- Photo requirements: before/after, 4 sides each (8 photos minimum) - NOT YET IMPLEMENTED
- Exactly 5 bottom-nav tabs per role (enforced in BottomNavMobile.tsx)
- Equipment checklist: start/end of shift (IMPLEMENTED at /technician/equipment)
- Commission tracking: Sales & tech earnings pages IMPLEMENTED
- No customer login: SMS/email updates only
- French primary language for all customer-facing content

## Rate Limiting
- API rate limiting enforced in middleware.ts
- Avoid removing or bypassing rate limit checks

## Database Migrations
- Add SQL files to db/migrations/YYYYMMDD_description.sql
- Apply manually in Supabase SQL editor (copy-paste and execute)
- Keep schema and migrations in sync with code changes
- Latest: 20260127_complete_spec_implementation.sql (16+ new tables)
- See SQL_MIGRATION_GUIDE.md for troubleshooting (if file exists)

## Environment Variables
- See .env.example for all required and optional keys
- **Required:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, APP_ENCRYPTION_KEY
- **Optional:** TWILIO_*, STRIPE_*, RESEND_*, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- Do not commit secrets (service role key, Stripe, Twilio tokens)
- Only expose NEXT_PUBLIC_ vars to the client
- Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

## Useful Files
- **CLAUDE.md** - Authoritative architecture and business rules (READ THIS FIRST)
- **READY_TO_DEPLOY.md** - Implementation status (~85% complete), deployment checklist
- **README.md** - Quick start guide
- **ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md** - Complete business requirements (48+ specs)
- middleware.ts - Auth checks + rate limiting
- lib/auth.ts - Auth helpers (requireUser, requireRole, requirePermission)
- lib/permissions.ts - Permission resolution (13 permissions, 4 roles)
- lib/validators.ts - 33+ Zod schemas for all API inputs
- lib/pricing.ts - Dynamic pricing calculator (size + time + holiday + discounts)
- lib/smsTemplates.ts - French SMS templates (10+ types)
- components/BottomNavMobile.tsx - Main navigation (5 tabs, role-based)
- vitest.config.ts - Test config (100% coverage required)
