# AGENTS.md

Guidance for agentic coding assistants working in this repo.

Read `CLAUDE.md` first. It is the authoritative spec for business rules and architecture.

## Repo Snapshot
- Product: Entretien Prestige (field-service ERP for a Quebec cleaning company)
- Stack: Next.js 14 App Router, TypeScript, Tailwind, Supabase (Postgres + RLS)
- Language: French for UI/SMS/customer content; English for code and comments
- Mobile-first: max width 640px, bottom nav always, no sidebar, exactly 5 tabs per role

## Commands
Install and run:
```
npm install
npm run dev
npm run build
npm run start
npm run lint
```

Tests:
```
npm test
npm run test:watch
```

Run a single test (Vitest):
```
npx vitest run auth
npx vitest run --grep "login"
npx vitest run lib/pricing.test.ts
```

Type check only:
```
npx tsc --noEmit
```

## Cursor/Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## Project Layout
- `app/` - Next.js App Router pages and API routes
  - `(app)/` - authenticated pages
  - `(auth)/` - login/reset pages
  - `api/` - API routes
- `components/` - shared UI components
- `lib/` - business logic and integrations
- `db/` - schema and SQL migrations
- `tests/` - Vitest tests

## Code Style and Conventions
TypeScript and types:
- Strict mode; avoid `any` (use `unknown` + type guards)
- Prefer named exports over default exports
- Use type-only imports where possible
- Avoid type assertions unless required by an API surface

Imports and module paths:
- Use `@/` path alias for repo-root imports
- Avoid relative traversals like `../../` when `@/` works
- Group imports: external, internal (`@/`), then relative

Naming conventions:
- Components and types: `PascalCase`
- Functions and variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- API route folders: `kebab-case`
- Zod schemas: `camelCase` + `Schema` suffix (e.g., `loginSchema`)

Formatting and comments:
- Follow existing formatting; keep diffs minimal
- Tailwind utilities are standard; avoid new global styles unless needed
- Avoid TODO/FIXME placeholders; code must be production-ready
- Add comments only for non-obvious logic; keep comments in English
- Keep user-facing strings in French

Validation:
- Validate all external input with Zod `safeParse`
- Centralize ALL schemas in `lib/validators.ts` (no inline schemas)
- Return friendly validation errors; do not leak internals

Error handling:
- Return user-friendly messages and appropriate HTTP status codes
- Do not expose raw `error.message` to clients
- Log server-side errors with context (e.g., jobId, userId, companyId)

## API Route Pattern
1) Authenticate with `requireUser`, `requireRole`, or `requirePermission`
2) Validate input with Zod `safeParse`
3) Query Supabase with RLS and `company_id` filtering
4) Return `NextResponse.json`

Response shape:
- Success: `{ success: true, data }`
- Error: `{ error: "Message", details?: technicalDetails }`

## Data Access Rules
- No ORM; use Supabase client directly
- Use `createUserClient` for RLS-enforced access
- Use admin client only in trusted server code
- Always filter by `company_id`
- Prefer explicit column lists over `select("*")`
- Use `.single()` when exactly one row is expected
- Use `.maybeSingle()` when a row might not exist

## UI/UX Rules
- Mobile-first layout, max width 640px, centered on desktop
- `BottomNavMobile` always present, exactly 5 tabs per role
- No sidebar; no horizontal scroll
- Prefer pagination or bottom sheets over long scrolls

## Localization
- French for UI text, SMS templates, and customer-facing messages
- English is acceptable for technical comments and logs

## Testing Guidelines
- Vitest + Testing Library + jsdom
- 100% coverage required (statements, branches, functions, lines)
- Unit tests for `lib/` logic in `tests/`
- Mock Supabase clients for integration tests

## Database Migrations
- Add SQL files to `db/migrations/YYYYMMDD_description.sql`
- Apply manually in Supabase SQL editor
- Keep `db/schema.sql` and migrations in sync with code

## Environment Variables
Required (local + deploy):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `APP_ENCRYPTION_KEY`
- `NEXT_PUBLIC_BASE_URL`

Common optional keys:
- `TWILIO_*`, `STRIPE_*`, `RESEND_*`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Never commit secrets. Only `NEXT_PUBLIC_*` may be exposed to the client.

## Useful Files
- `CLAUDE.md` - full spec and business rules
- `READY_TO_DEPLOY.md` - implementation status and checklist
- `README.md` - developer quick start
- `middleware.ts` - auth checks and rate limiting
- `lib/auth.ts` - auth helpers
- `lib/permissions.ts` - permission resolution
- `lib/validators.ts` - Zod schemas
- `components/BottomNavMobile.tsx` - 5-tab nav enforcement
- `vitest.config.ts` - coverage thresholds and test config

## Claude Code Skills/Agents (if applicable)
- If using Claude Code, follow the mandatory skill/agent decision trees in `CLAUDE.md`
- Prefer skills for single-scope tasks and agents for multi-step work
