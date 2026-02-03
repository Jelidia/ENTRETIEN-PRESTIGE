---
name: testing-selection
description: Choose the smallest meaningful verification commands for a given change.
---

Guide:
- Type changes -> `npm run typecheck`
- Lint/config changes -> `npm run lint`
- Core logic changes -> `npm test`
- UI flows/routing -> `npm run test:e2e`
- Auth/RLS issues -> `node scripts/check-rls-status.ts` or `node scripts/diagnose-rls.ts`
