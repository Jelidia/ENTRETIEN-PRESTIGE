---
description: Run unit tests (Vitest) and fix failures.
agent: ep
---

!npm test

- Summarize failing tests.
- Fix the underlying issues (minimal diffs).
- Add/adjust tests if needed.
- Re-run `npm test` until green.
