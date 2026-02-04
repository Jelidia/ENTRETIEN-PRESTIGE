# Master Task List (single source of truth)

This file is the only coordination list for work in this repo.

How to use
- Claim a task by appending: " [WIP: <owner> <YYYY-MM-DD>]" to that line.
- If a task has any WIP tag, do not work on it.
- When a task is done, delete the entire line.
- If you stop without finishing, remove your WIP tag so others can take it.
- Keep tasks atomic (one task per line).

Notes
- This list consolidates tasks from other docs.
- Do not add task lists to other markdown files.

## P0 - Release blockers
- EP-P0-DB-04 Enforce soft delete semantics everywhere (API + RLS).
- EP-P0-DB-05 RLS audit plus role alignment (company isolation is not enough).
- EP-P0-SEC-02 Replace in-memory rate limiting with a shared production store (remove temporary disable).
- EP-P0-SEC-07 Decide and enforce registration model (self-signup vs invite-only).
- EP-P0-FLOW-03 Implement Leads API to match Sales Leads UI. [WIP: OpenCode 2026-02-03]
- EP-P0-FLOW-04 Finish customer rating and review workflow (tokens -> rating -> bonus).
- EP-P0-PAY-01 Harden Stripe payment flow (intent creation, webhook, idempotency, persistence).
- EP-P0-PAY-02 Define and implement a real payment ledger.
- EP-P0-PAY-03 Make manual Interac marking safe and auditable.

## P1 - Engineering, auth, dispatch, messaging, storage
- EP-P1-AUTH-01 Redesign permission keys so technician settings do not equal company settings.
- EP-P1-AUTH-02 Field-level authorization for jobs and customers.
- EP-P1-AUTH-03 Define and enforce a job status state machine.
- EP-P1-AUTH-04 Report data-scope rules to prevent technician data leakage.
- EP-P1-AUTH-05 Align role definitions across DB, permissions, and UI.
- EP-P1-DISP-01 Implement real conflict detection and scheduling rules.
- EP-P1-DISP-02 Replace naive auto-assign with an explainable assignment algorithm.
- EP-P1-DISP-03 Build employee availability management end-to-end.
- EP-P1-DISP-04 Weather cancellation safety checks and notifications.
- EP-P1-MSG-02 Inbound SMS webhook verification, dedupe, and company mapping.
- EP-P1-MSG-03 Opt-out and consent compliance for SMS (STOP handling, quiet hours).
- EP-P1-MSG-04 Email sending requires Resend when enabled and tracks delivery.
- EP-P1-STOR-01 Stop storing public URLs for sensitive documents.
- EP-P1-STOR-02 Add file validation and malware scanning hook.

## P2 - Feature completeness and UX
- EP-P2-PRICE-01 Connect pricing engine to job creation and invoicing.
- EP-P2-JOBS-01 Implement job_history logging everywhere.
- EP-P2-CHECK-01 Finish shift checklist workflow with structured items and photos.
- EP-P2-CUST-01 Implement customer communication timeline and connect to jobs/leads.
- EP-P2-SALES-01 Add sales territory management UI with map polygon drawing.
- EP-P2-GPS-01 Make GPS tracking production-grade.
- EP-P2-UI-01 Replace manual ID entry with searchable pickers and pagination.
- EP-P2-I18N-01 French-first UX copy and Quebec formatting.

## P3 - Product expansion
- EP-P3-SUB-01 Implement customer subscriptions.
- EP-P3-COMM-01 Automate commissions and payroll generation.
- EP-P3-OPS-01 Manager approval workflows for invoices, upsells, discounts.
- EP-P3-SESS-01 Implement session management (view and revoke active sessions).

## UI device adaptiveness

## Spec decisions to finalize (missing requirements)
- Notification matrix (who gets what for each event).
- Full SMS templates (French, all triggers) and full email templates.
- Job workflow state machine (states, transitions, roles, auto transitions).
- Permissions matrix per role (CRUD + field-level rules).
- Commission calculation formulas (splits, taxes, discounts, timing).
- Invoice and receipt format details (GST/QST, numbering, late fees).
- Search specifications (fields, filters, limits, fuzzy rules).
- File upload requirements (sizes, formats, compression, storage rules, EXIF).
- Offline mode scope + sync behavior (conflicts, queues, retries).
- Error handling and edge cases (payment failure, GPS loss, upload retry, etc).
- Integration specifics (Twilio/Stripe/Maps webhook details and limits).
- Performance requirements (SLA targets, concurrency, uptime).
- Authentication flow details (2FA flow, reset rules, session rules).
- Customer onboarding flow details (lead vs direct customer paths).
- Payment flows (Interac/Stripe/Cash step-by-step).
- Tax calculation details (GST/QST rounding, exemptions).
- Localization rules (FR strings, date/time formats, currency, phone).
- Accessibility checklist (WCAG 2.1 AA requirements).
- Testing requirements (unit/integration/e2e coverage list).
- Monitoring and logging plan (error tracking, analytics, performance).

## QA and testing
- Manual comprehensive test blocked: missing Playwright dependency (install Playwright and rerun npx tsx tests/manual-comprehensive-test.ts). [WIP: opencode 2026-02-03]
- Run full E2E suite: npm run test:e2e (fix failures).
- Test core workflows: create lead, customer, team member, job; dispatch calendar (auto-assign, drag-drop).

## Pre-production checklist
- Supabase migrations apply cleanly on a fresh DB (CI enforced).
- RLS enabled and tested for every tenant table.
- Run npm run typecheck, npm run lint, npm test, npm run test:e2e.
- Verify RLS helper functions exist and policies are correct (get_user_role, get_user_company_id).
