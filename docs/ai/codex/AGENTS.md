# AGENTS.md — Field Service Management Platform (OpenCode/Codex)

This file is the **high‑signal, always‑on** project context for coding agents.

- Keep it **short and accurate** (agents will see it often).
- Put deep details in other docs and point to them.

If you need deeper context, prefer **targeted reads** (don't paste huge files by default).

## Repo snapshot

**Product:** Multi-tenant field service management platform (supports any industry: cleaning, HVAC, plumbing, landscaping, electrical, pest control, etc.)
**Stack:** Next.js 14 (App Router) + TypeScript + Supabase (Postgres + RLS) + Tailwind
**UI language:** Quebec French default, bilingual (code in English)
**Multi-tenancy:** All data is scoped by `company_id`. Each company configures its own service types, pricing, tax rates, templates, and branding. Nothing is hardcoded to a single company or industry.

### Key directories

- `app/` — Next.js routes (App Router)
  - `app/(app)/` protected routes
  - `app/(auth)/` login
  - `app/api/` API routes
- `components/` — UI components
- `lib/` — shared server/client logic
  - `lib/auth.ts` — `requireUser/requireRole/requirePermission`
  - `lib/supabaseServer.ts` — `createUserClient/createAdminClient`
  - `lib/validators.ts` — **ALL Zod schemas live here**
- `scripts/` — operational scripts (RLS/policies, reseed, verify users)
- `supabase/` — schema, migrations, RLS policies (tracked)

## Authoritative docs

- **Agent workflow + repo rules:** `docs/ai/codex/AGENTS.md` (this file)
- **Task backlog + deployment checklist:** `docs/tasks/DOCS_TASK_LIST.md`
- **Setup + env vars:** `README.md`

Legacy spec files and Claude Code documentation were removed; see git history if needed.

## Non‑negotiables (project rules)

### UI/UX

1. **Mobile-first only**: max width `640px`, bottom navigation.
2. **French UI**: Quebec French strings for labels, errors, SMS/email templates.
3. Role-based UX: 5 bottom nav tabs per role.

### API + Security + Multi‑tenant

1. **Every API route must authenticate** (`requireUser/requireRole/requirePermission`).
2. **Multi‑tenant always**: scope reads/writes by `company_id`.
3. Prefer `createUserClient(accessToken)` so RLS protects data.
4. Use `createAdminClient()` only when required (admin-only flows) **and still scope by `company_id`**.
5. Validate external input with **Zod schemas from `lib/validators.ts`** (never inline schemas).

### Operational patterns (don’t reinvent)

- **Idempotency**: write endpoints that can be retried should use the helpers in `lib/idempotency.ts`.
- **Audit logging**: sensitive actions should log via `lib/auditLog.ts`.
- **Rate limiting**: currently disabled (see `lib/rateLimit.ts`). Don’t accidentally remove/ignore this in “cleanup” work.

### Code conventions

- Use path aliases: prefer `@/…` imports over long relative paths.
- Keep server-side logic in `lib/` and UI in `components/`.

### Quality gates

- Prefer small, focused diffs.
- Don’t touch build artifacts: `.next/`, `node_modules/`, `coverage/`, `test-results/`.
- Don’t commit secrets (`.env*`, `.mcp.json`, service keys).

## How to work in this repo (agent workflow)

1. **Restate the goal** and any assumptions.
2. **Locate existing patterns** before writing new code (search similar routes/components).
3. **Plan the smallest change**: list files to touch.
4. Implement.
5. **Run checks** (choose what fits the change):
   - `npm run typecheck`
   - `npm run lint`
   - `npm test` (Vitest)
   - `npm run test:e2e` (Playwright)
6. Summarize: what changed, why, files touched, commands run.

## Available skills and agents (current)

**Skills:** `spec-enforcer`, `docs-updater`, `french-ui-helper`, `agent-browser`, `ui-fr-ca`, `testing-selection`, `task-coordination`, `rls-audit`, `api-route-safety`

**Agents:** `general`, `explore`, `qa`, `review`, `scout`, `security`, `ui`

## Common commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

## Repo-specific diagnostics (useful before blaming RLS/auth)

```bash
node scripts/check-rls-status.ts
node scripts/diagnose-rls.ts
node scripts/test-login-flow.ts
node scripts/verify-users-exist.ts
```

## "If you only read 3 docs"

1. `README.md` — setup + env vars + operational overview
2. `docs/tasks/DOCS_TASK_LIST.md` — full task backlog, priorities, and deployment checklist (single source of truth)
3. `docs/ops/TROUBLESHOOTING.md` — debugging and migration playbook

## OpenCode/Codex quality-of-life

This repo includes OpenCode config (`opencode.json`) plus a few custom commands:

- `/improve <request>` — rewrite a raw request into an AI-optimized prompt
- `/typecheck` — run `npm run typecheck`
- `/lint` — run `npm run lint`
- `/test` — run `npm test`
- `/rls-check` — run `node scripts/check-rls-status.ts`
- `/review` — run a read-only review of the current `git diff`
- `/opencode-registry` — query the local Awesome OpenCode registry snapshot
