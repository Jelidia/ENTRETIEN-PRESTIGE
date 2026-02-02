---
description: Run TypeScript typecheck and summarize errors + fix plan.
agent: ep
---

!npm run typecheck

- Summarize the errors (group by root cause).
- Propose the minimal set of fixes and which files to touch.
- If fixes are obvious, implement them.
- Re-run typecheck at the end.
