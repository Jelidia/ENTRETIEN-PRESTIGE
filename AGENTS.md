# AGENTS.md

Guidance for agentic coding assistants working in this repo.

Read `CLAUDE.md` first. It is the authoritative guide for business rules, architecture, and production blockers. If you are using Claude Code, follow the skills/agents decision trees described there.

---

## Repo snapshot
- Product: Entretien Prestige (mobile-first field-service ERP for a Quebec cleaning company)
- Stack: Next.js 14 App Router, TypeScript, Tailwind, Supabase (Postgres + RLS)
- Language: French for UI/SMS/customer-facing content; English for code/logs
- UI constraints: max width 640px, bottom nav always, no sidebar, exactly 5 tabs per role
- Status: not production-ready (see `ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md`)

---

## Commands
### Install / run
```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

### Unit/integration tests (Vitest)
```bash
npm test                 # vitest run --coverage
npm run test:watch       # vitest
npx vitest run auth      # match test name pattern
npx vitest run --grep "login"
npx vitest run tests/technicianDashboard.test.tsx
```

### E2E tests (Playwright)
```bash
npm run test:e2e
npx playwright test tests/e2e/smoke.spec.ts
npx playwright test --grep "smoke"
```
Notes: Prefer targeted tests first; run full suite only for broad changes or on request. Coverage thresholds are 100% (see `vitest.config.ts`); `coverage.all` is false by default, so untouched files may not count toward coverage.

---

## Code style & conventions
### TypeScript
- Strict mode is on; avoid `any` (use `unknown` + type guards).
- Prefer named exports.
- Use type-only imports where possible.
- Avoid unsafe assertions unless required.

### Imports
- Use `@/` alias for repo-root imports (see `tsconfig.json`).
- Avoid deep `../../` when `@/` works.
- Order imports: external → internal (`@/`) → relative.

### Formatting
- No dedicated formatter config; follow existing file style and ESLint guidance.
- Keep JSX/Tailwind class ordering consistent with nearby code.

### Naming
- Components/types: `PascalCase`.
- Hooks: `useSomething`.
- Functions/vars: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.
- API folders/route segments: `kebab-case`.
- Zod schemas: `camelCaseSchema` (e.g. `loginSchema`).

### Error handling
- Response shape: success `{ success: true, data }`, error `{ error: "Message", details?: technicalDetails }`.
- Do not return raw DB errors to clients; log server-side with context.
- Fail closed on missing required env vars or integrations (no silent fallbacks).

### Localization
- Customer-facing strings and UI labels: French (Quebec).
- Technical logs/comments: English ok.

---

## API route requirements (non-public)
- Authenticate: `requireUser`, `requireRole`, or `requirePermission`.
- Validate input with Zod in `lib/validators.ts` (no inline schemas in routes).
- Prefer the RLS client (`createUserClient(accessToken)`).
- Enforce multi-tenancy in every query (`company_id` scoping).
- Use consistent response shapes and status codes.

---

## Data access rules
- Use Supabase client directly (no ORM).
- Prefer explicit column lists over `select("*")`.
- Use `.single()` when exactly one row is expected; `.maybeSingle()` when optional.
- If a table has `deleted_at`, exclude soft-deleted rows in queries.
- Treat webhook/third-party payloads as hostile; verify signatures and be idempotent.

---

## UI/UX constraints
- Mobile-first layout; max width 640px and centered on desktop.
- `BottomNavMobile` always present; exactly 5 tabs per role.
- No sidebar and no horizontal scrolling.
- Prefer pagination or bottom sheets over long lists.
- Reuse shared components where possible (e.g. `BottomNavMobile`, `Pagination`, `BottomSheet`).

---

## Testing guidelines
- Add tests for new business logic (`lib/`), API routes, and critical UI.
- If you fix a bug, add a regression test.
- Prefer the smallest relevant test run while iterating.

---

## Database migrations
- Migrations live in `supabase/migrations/`.
- Create `YYYYMMDD_description.sql` files; apply via Supabase SQL editor or local workflow.
- Validate RLS policies and indexes for any schema changes.

---

## Environment variables
Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ENCRYPTION_KEY` (must be required in production; fail closed)
- `NEXT_PUBLIC_BASE_URL`

Optional integrations:
- `TWILIO_*`, `STRIPE_*`, `RESEND_*`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Rules:
- Never commit secrets.
- Only `NEXT_PUBLIC_*` values may be exposed to the client.

---

## Where to look first
- `CLAUDE.md` — architecture + non-negotiable rules (authoritative)
- `ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md` — production readiness
- `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md` — requirements/spec
- `CRITICAL_FIXES_README.md` — immediate fixes overview
- `TROUBLESHOOTING.md` — database issues and fixes

---

## Cursor/Copilot rules
No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` were found at last scan. If you add one, keep it consistent with `CLAUDE.md`.
