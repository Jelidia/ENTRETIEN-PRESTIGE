# Master Task List (single source of truth)

**If you discover new issues, bugs, improvements, or missing features while working on a task, add them to this list immediately and continue your current task. Do not let discoveries block your work-in-progress.**

This file is the only coordination list for work in this repo.

First before working give yourself a name, that you will remember always use the same name, that is not used.  
Many ai work on this at the same time so never forget that

List of name available (take a name from here and remove it when you took it) : 
  
 - AI - 1
 - AI - 2
 - AI - 3
 - AI - 4
 - AI - 5
 - AI - 6
 - AI - 8
 - AI - 9

List of name taken (put the name you choose here) : 

- AI - 7

How to use
- Chose a task yourself and claim it by appending it with: " [: <your name> <YYYY-MM-DD-HOURS-MINUTES>]" to that line.
- If a task has any tag, do not work on it.
- When a task is done, delete the entire line.
- If you stop without finishing, remove your tag so others can take it.
- Keep tasks atomic (one task per line).

Notes
- This list consolidates tasks from other docs.
- Do not add task lists to other markdown files.

---

## P0 - Release blockers

### Database & RLS
- EP-P0-DB-04 Enforce soft delete semantics everywhere (API + RLS).
- EP-P0-DB-05 RLS audit plus role alignment (company isolation is not enough).
- EP-P0-DB-06 Implement Optimistic Concurrency Control: Add a `version` column to critical tables (Jobs, Customers) and block updates if the version on the server doesn't match the client's version (prevents overwrite conflicts).
- EP-P0-DB-07 Idempotency keys: add UNIQUE constraint on (`idempotency_key`, `scope`), add `created_at` and a TTL/cleanup job for stuck "processing" states.
- EP-P0-DB-08 Automated DB migration preflight and rollback scripts: ensure migrations are reversible and provide dry-run checks.

### Security & auth
- EP-P0-SEC-02 Replace in-memory rate limiting with a shared production store (remove temporary disable).
- EP-P0-SEC-03 Implement Strict Session Revocation: Update middleware to check user status against the DB on every request (caching allowed for 30s) to ensure terminated employees lose access immediately, not when tokens expire.
- EP-P0-SEC-04 Ensure rules engine never executes arbitrary JS: enforce sandbox / whitelist for expression evaluation, CPU/memory limits and deny unsafe operations.
- EP-P0-SEC-05 Repository secrets scanning: enable secret scanning + prevent commits with keys; remediate leaked secrets.
- EP-P0-SEC-06 SAST / dependency scanning: enable CI SAST and Dependabot / SCA alerts; schedule regular vulnerability triage.
- EP-P0-SEC-07 Decide and enforce registration model (self-signup vs invite-only).
- EP-P0-SEC-08 Enforce MFA for admin / billing roles.
- EP-P0-SEC-09 Optional SSO (SAML/OIDC) design & implementation for enterprise tenants.

### Engineering & data quality
- EP-P0-ENG-11 CI gating: require typecheck, lint, unit tests and security checks before merge.
- EP-P0-ENG-12 Add dependency license & SCA policy (allowed licenses).
- EP-P0-ENG-13 Accessibility (WCAG) audit & remediation plan for public pages and admin UI.

### Core flows
- EP-P0-FLOW-02 Make job photo uploads work end-to-end (upload + DB record + viewing).
- EP-P0-FLOW-04 Finish customer rating and review workflow (tokens → rating → bonus).
- EP-P0-FLOW-05 Webhook reliability: ensure idempotent handling and dead-letter queue for webhook failures.

### Payments
- EP-P0-PAY-01 Harden Stripe payment flow (intent creation, webhook, idempotency, persistence).
- EP-P0-PAY-02 Define and implement a real payment ledger.
- EP-P0-PAY-03 Make manual Interac marking safe and auditable.
- EP-P0-PAY-04 Build Payment Reconciliation Job: scheduled task that compares Stripe/Interac logs with DB to detect/fix "stuck" payments.
- EP-P0-PAY-05 Payment error monitoring & alerting: detect failed reconciliations and notify ops.

### Commissions & payroll
- EP-P0-COMM-02 Implement Commission "Clawback" Logic: generate negative commission entries when a paid job is refunded or cancelled.
- EP-P0-COMM-03 Payroll accuracy tests: nightly batch validation that simulates payroll runs to detect outliers.

### Legal & compliance
- EP-P0-LEG-01 Implement Law 25 Data Access Audit: immutable log table that records every "view" on sensitive Customer/Job data (who/when/what), exportable.
- EP-P0-LEGAL-02 Implémenter le Rapport d'Incident: formulaire technicien (photos + description) qui déclenche alerte critique (SMS/Email) aux managers.
- EP-P0-LEGAL-03 Implémenter l'Acceptation des CGV: bloquer début d'un job tant que le client n'a pas accepté (signature numérique / case).
- EP-P0-LEGAL-04 GDPR / DSAR flow: implement data subject request process (export / delete / redact).

### Product configuration & SaaS foundation (obligatoire pour plateforme marque-blanche)
- EP-P0-IMPORTANT-01 Nothing should be hardcoded like services or company name; admin/manager must be able to manage company profile and services in-app.
- EP-P0-SaaS-01 Multi-tenant resolver & isolation: implémenter résolveur de tenant (hostname/subdomain, API key, header), helpers `get_current_tenant()` et RLS standards ; valider `company_id` partout.
- EP-P0-SaaS-02 Central Config Store (DB): créer tables versionnées et RLS-safe pour `pricing_profiles`, `commission_profiles`, `payroll_rules`, `holiday_profiles`, `service_types`, `feature_flags`, `company_branding`, `email_templates` (JSONB + version + draft/published + author + audit).
- EP-P0-SaaS-03 Config API & CRUD: exposer API sécurisées (zod validations) pour CRUD des configs par company, preview endpoint, clonage / import / export JSON.
- EP-P0-SaaS-04 Secure Rules Engine: intégrer moteur déclaratif (json-logic/json-rules-engine/custom DSL) pour formules (prix/commissions/paie). **Interdiction d'exécuter JS arbitraire.**
- EP-P0-SaaS-05 Rule Compiler & Cache: précompiler règles en artefacts rapides (AST), cache (Redis) et invalidation/versioning au publish.
- EP-P0-SaaS-06 Admin Config Editor + Simulator: UI/backend pour créer/éditer/cloner/versionner/publier configs et simuler (input→résultat). Inclure test scenarios et bouton « publish ».
- EP-P0-SaaS-07 Branding & White-Label features: `company_branding` (logo, couleurs, custom CSS, email templates), support domaine custom (CNAME) et preview/test send d'emails.
- EP-P0-SaaS-08 Billing & Tenant Subscriptions: intégration Stripe (plans par company), métriques (SMS, storage, appels API), facturation récurrente, essais, statut d'abonnement et UI facturation.
- EP-P0-SaaS-09 Tenant Quotas & Rate Limits: quotas multi-dimension (API calls/min, storage GB, SMS/day) + rate limiting par tenant (Redis). Lier aux plans.
- EP-P0-SaaS-10 Onboarding & Provisioning: flows API pour provisionner tenant (configs par défaut, role templates, sample data), checklist onboarding et tests automatisés.
- EP-P0-SaaS-11 Migration and Fallback Plan: scripts/migrations pour extraire règles codées en dur vers `pricing_profiles`/`commission_profiles`; fallback compatibilité et feature flag de bascule progressive.
- EP-P0-SaaS-12 Config Audit & Approval Workflow: audit immuable (who/when/what), approbation (draft→approved→published) et rollback.
- EP-P0-SaaS-13 Sandbox & Staging per tenant: permettre tenant sandbox (test data) partageable pour validation.
- EP-P0-SaaS-14 Per-tenant Feature Flags: activer fonctionnalités par company (flags + UI + analytics).
- EP-P0-SaaS-15 Secure Secrets & Per-tenant credentials: stocker secrets par-tenant via secret manager (pas en clair dans la DB).
- EP-P0-SaaS-16 Performance & Scaling: profilage engine règles, patterns cache/sharding, précalculs batch (paie).
- EP-P0-SaaS-17 Legal / Data Residency & Export: support résidence données par tenant, outils suppression/export conformes (Law25/GDPR).
- EP-P0-SaaS-18 Governance & Plugin Model: définir limites d'extension, sécurité pour plugins, processus de review pour custom code.
- EP-P0-SaaS-19 Tests & QA for Configs: tests unitaires/integration pour chaque type de règle et non-régression après migration.
- EP-P0-SaaS-20 Disaster Recovery & Backups: scheduled full and incremental backups, tested restores, and runbook for failover.
- EP-P0-SaaS-21 SLA/SLO definitions & alerting: define availability/perf SLOs and set up alerts / dashboards.
- EP-P0-SaaS-22 Chaos & Resilience testing: periodic chaos tests of critical infra (DB failover, cache failure, rules engine latency).
- EP-P0-SaaS-23 Créer le compte "compagnie" super-admin + seed idempotent pour tests : script (ex. supabase/seeds/seed_company_super_admin.sql ou .json) qui crée une company de test, un user super_admin (email + mot de passe initial), lui assigne le rôle company_owner, et provisionne des configs minimales (branding, pricing_profile sample, commission_profile sample, feature_flags). Le seed doit être idempotent, documenter les vars d'environnement et la commande d'exécution, et vérifier RLS.
---

## P1 - Engineering, auth, dispatch, messaging, storage

### Engineering
- EP-P1-ENG-03 Standardize API response format and error handling.
- EP-P1-ENG-06 Add E2E tests for critical flows (Playwright).
- EP-P1-ENG-08 Product gap audit: compare spec + live UI vs code; log missing/mis-implemented features with file refs.
- EP-P1-ENG-11 Implémenter la File d'Attente de Synchronisation (Offline Mode): permettre aux techniciens d'effectuer des actions hors réseau et synchroniser.
- EP-P1-ENG-12 Canary deploys & config rollout: safe rollout of config changes with canary and monitoring.
- EP-P1-ENG-13 Migration preflight checks: automated validations before DB migration apply.

### Auth & permissions
- EP-P1-AUTH-01 Redesign permission keys so technician settings do not equal company settings.
- EP-P1-AUTH-02 Field-level authorization for jobs and customers.
- EP-P1-AUTH-03 Define and enforce a job status state machine.
- EP-P1-AUTH-04 Report data-scope rules to prevent technician data leakage.
- EP-P1-AUTH-05 Align role definitions across DB, permissions, and UI.
- EP-P1-SaaS-01 Tenant admin roles & permissions: rôles multi-niveau (company_owner, billing_admin, ops_admin, template_editor) avec field-level permissions.
- EP-P1-SaaS-10 RBAC audit & admin logs: track admin actions and changes to configs for security/compliance.

### Dispatch & scheduling
- EP-P1-DISP-01 Implement real conflict detection and scheduling rules.
- EP-P1-DISP-02 Replace naive auto-assign with an explainable assignment algorithm.
- EP-P1-DISP-03 Build employee availability management end-to-end.
- EP-P1-DISP-04 Weather cancellation safety checks and notifications.
- EP-P1-DISP-05 Dispatch schedule view toggle: add day/3-day/week/month selector (mobile-first).
- EP-P1-DISP-06 Render 3-day/week/month grids with correct job grouping + headers.
- EP-P1-DISP-07 Enable drag-and-drop across multi-day/week/month grids (mouse + touch) to update job date/time; only active in "Modify schedule" mode.
- EP-P1-DISP-08 Add date picker (single day + range) with schedule preview list.
- EP-P1-DISP-09 Move weather cancellation controls from schedule to Settings page (permissions + UX).
- EP-P1-DISP-10 Weather cancellation flow: select dates → list affected jobs → cancel all or reschedule.
- EP-P1-DISP-11 Reschedule flow: send SMS link → customer selects new slot → confirm + update job.

### Sales workflow

### Ops & restrictions
- EP-P1-OPS-04 Implémenter les Restrictions Technicien-Client: liste "Techniciens Exclus" sur profil client.

### Storage & documents
- EP-P1-STOR-01 Stop storing public URLs for sensitive documents.
- EP-P1-STOR-02 Add file validation and malware scanning hook.
- EP-P1-SaaS-04 Metering & Usage APIs: exposer endpoints usage par tenant (API calls, SMS, storage) et job reconciliation avec Stripe usage records.
- EP-P1-SaaS-09 Custom domain onboarding: vérifier CNAME, provisionner certificat et lier au branding tenant.

---

## P2 - Feature completeness and UX

### Core features
- EP-P2-JOBS-03 Add Voice Notes to Jobs.
- EP-P2-CHECK-01 Finish shift checklist workflow with structured items and photos.
- EP-P2-CUST-02 Implement Customer Language Preference (EN/FR).
- EP-P2-CUST-03 Implement Customer Merge Tool.
- EP-P2-CUST-04 Referral Linking UI and $50 bonus workflow.

### Sales & territories
- EP-P2-SALES-06 Add DB tables + RLS for sales_days and sales_day_assignments.
- EP-P2-SALES-05 Implémenter l'Ajout de Service sur le Terrain (Upsell).

### GPS & availability
- EP-P2-GPS-01 Make GPS tracking production-grade.
- EP-P2-GPS-02 Implement "Lien de Suivi Client" (public temporary URL).

### Messaging

### Payments
- EP-P2-PAY-05 Implémenter les Pourboires Numériques (balance "Pourboires à verser").

### Marketing & retention
- EP-P2-MKT-01 Automatisation de Réactivation (jobs 6/12 mois).

### Admin & ops
- EP-P2-FLT-01 Implement Vehicle Inspection (Circle Check).
- EP-P2-ADMIN-01 Build Dynamic Service & Pricing UI (support per-tenant pricing profiles and live preview).
- EP-P2-ADMIN-02 Implement User Impersonation.
- EP-P2-ADMIN-03 Build Role Templates (clone permissions).
- EP-P2-ADMIN-04 Record Change History (Audit Log) – "Last Edited By".
- EP-P2-ADMIN-05 Global Tag Manager.
- EP-P2-OPS-03 Implement Inventory Low-Stock Alerts.
- EP-P2-SaaS-02 Commission Builder UI: visual editor for commissions (splits, clawbacks, paliers) + simulator.
- EP-P2-SaaS-03 Payroll Rules UI: admin UI to configure payroll cycles, deductions, taxes, and simulate pay runs.
- EP-P2-SaaS-04 Logistics config UI: configure territories, travel time, dispatch heuristics per company.
- EP-P2-SaaS-05 Template Library & Marketplace: starter templates (residential, commercial, landscaping).
- EP-P2-SaaS-06 Onboarding checklist UI for tenants.
- EP-P2-SaaS-07 Tenant feature usage dashboard & alerts.

### Reporting & dashboards

### Dispatch enhancements

### UX & UI
---

## P3 - Product expansion

- EP-P3-SUB-01 Implement customer subscriptions.
- EP-P3-COMM-01 Automate commissions and payroll generation (full pipeline).
- EP-P3-OPS-01 Manager approval workflows for invoices, upsells, discounts.
- EP-P3-BI-01 Implémenter le Calcul de Rentabilité Réelle (revenus vs coûts directs).
- EP-P3-SESS-01 Implement session management (view and revoke active sessions).
- EP-P3-SaaS-01 White-label provisioning automation: templates + API to provision white-label site (DNS, branding, onboarding, test data).
- EP-P3-SaaS-02 Marketplace for shareable profiles: publish/import pricing/commission templates.
- EP-P3-SaaS-03 Managed customizations process: APIs/process for paid customizations tracked as managed extensions.
- EP-P3-SaaS-04 Partner onboarding & reseller model: allow agencies/resellers to provision clients and manage billing.
- EP-P3-SaaS-05 Support automation & SLA-based escalation: automatic escalation based on tenant SLA and billing tier.

---

## Spec decisions to finalize (missing requirements)

### Notifications & messaging
- Notification matrix (who gets what for each event).
- Full SMS templates (French, all triggers) and full email templates.

### Workflow & permissions
- Job workflow state machine (states, transitions, roles, auto transitions).
- Permissions matrix per role (CRUD + field-level rules).

### Finance & payments
- Commission calculation formulas (splits, taxes, discounts, timing).
- Invoice and receipt format details (GST/QST, numbering, late fees).
- Payment flows (Interac/Stripe/Cash step-by-step).
- Tax calculation details (GST/QST rounding, exemptions).

### Search, files, offline
- Search specifications (fields, filters, limits, fuzzy rules).
- File upload requirements (sizes, formats, compression, storage rules, EXIF).
- Offline mode scope + sync behavior (conflicts, queues, retries).

### Reliability & integrations
- Error handling and edge cases (payment failure, GPS loss, upload retry, etc).
- Integration specifics (Twilio/Stripe/Maps webhook details and limits).
- Performance requirements (SLA targets, concurrency, uptime).
- Monitoring and logging plan (error tracking, analytics, performance).

### Auth, onboarding, localization
- Authentication flow details (2FA flow, reset rules, session rules).
- Customer onboarding flow details (lead vs direct customer paths).
- Localization rules (FR strings, date/time formats, currency, phone).
- Accessibility checklist (WCAG 2.1 AA requirements).
- Testing requirements (unit/integration/e2e coverage list).

---

## QA and testing
- Run full E2E suite: `npm run test:e2e` (fix failures).
- Test core workflows: create lead, customer, team member, job; dispatch calendar (auto-assign, drag-drop).
- EP-P1-SaaS-08 Tenant isolation tests: automatisés pour vérifier qu’un tenant ne peut lire/éditer données d’un autre tenant (RLS + API tests).
- EP-P0-SaaS-19 Tests & QA for Configs: tests unitaires/integration pour rules engine et migration non-régression.
- EP-P0-SaaS-22 Chaos & Resilience tests: scheduled chaos experiments and postmortem.

---

## Production deployment checklist
- Record release tag or commit SHA, deployment time, and approver in the deployment log.
- Confirm CI is green for the release commit (typecheck, lint, tests, e2e) and archive results.
- Apply Supabase migrations in staging and production; store migration logs.
- Verify RLS enabled for every tenant table and helper functions exist (`get_user_role`, `get_user_company_id`).
- Validate production secrets and env vars are present (`APP_ENCRYPTION_KEY`, Stripe, Twilio, Resend) in the secrets manager.
- Verify Stripe keys + webhook secret configured (or payments disabled explicitly).
- Verify Twilio configured + webhook signature verification enabled (or SMS disabled explicitly).
- Verify Resend configured (or email disabled explicitly).
- Verify storage buckets are private and signed URLs used for documents/photos.
- Ensure no demo or mock fallback data in production paths.
- Confirm observability configured (structured logs + request IDs + error tracking) and capture a test request.
- Run smoke tests for core workflows: create lead, customer, team member, job; verify dispatch calendar behavior.
- Capture rollback plan (previous release tag and DB backup status).
- EP-P0-SaaS-20 Periodic restore tests: verify DB backups by performing test restores on staging monthly.
