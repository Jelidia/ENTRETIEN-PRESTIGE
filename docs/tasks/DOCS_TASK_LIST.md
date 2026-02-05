# Master Task List (single source of truth)

**If you discover new issues, bugs, improvements, or missing features while working on a task, add them to this list immediately and continue your current task. Do not let discoveries block your work-in-progress.**

This file is the only coordination list for work in this repo.

First before working give yourself a name., that is not used.
Many ai work on this at the same time so never forget that

List of name available (take a name from here) : 

- AI - 5
- AI - 6
- AI - 7
- AI - 8
- AI - 9

List of name taken (put the name you choose here) : 

 - AI - 1
 - AI - 2
 - AI - 3
 - AI - 4











How to use
- Chose a task yourself and claim it by appending it with: " [: <your name> <YYYY-MM-DD-HOURS-MINUTES>]" to that line.
- If a task has any tag, do not work on it.
- When a task is done, delete the entire line.
- If you stop without finishing, remove your tag so others can take it.
- Keep tasks atomic (one task per line).

Notes
- This list consolidates tasks from other docs.
- Do not add task lists to other markdown files.

## P0 - Release blockers
### Database & RLS
- EP-P0-DB-04 Enforce soft delete semantics everywhere (API + RLS).
- EP-P0-DB-05 RLS audit plus role alignment (company isolation is not enough).

- EP-P0-DB-06 Implement Optimistic Concurrency Control: Add a `version` column to critical tables (Jobs, Customers) and block updates if the version on the server doesn't match the client's version (prevents overwrite conflicts).
### Security & auth
- EP-P0-SEC-02 Replace in-memory rate limiting with a shared production store (remove temporary disable).
- EP-P0-SEC-03 Implement Strict Session Revocation: Update middleware to check user status against the DB on every request (caching allowed for 30s) to ensure terminated employees lose access immediately, not when tokens expire.
- EP-P0-SEC-07 Decide and enforce registration model (self-signup vs invite-only).

### Engineering & data quality
 - EP-P0-ENG-09 Implémenter la Normalisation E.164: Forcer le formatage strict des numéros de téléphone à l'entrée (API/Front) pour garantir 100% de délivrabilité des SMS Twilio et éviter les erreurs silencieuses.
### Core flows
- EP-P0-FLOW-02 Make job photo uploads work end-to-end (upload + DB record + viewing).
- EP-P0-FLOW-03 Implement Leads API to match the Sales Leads UI.
- EP-P0-FLOW-04 Finish customer rating and review workflow (tokens -> rating -> bonus).
### Payments
- EP-P0-PAY-01 Harden Stripe payment flow (intent creation, webhook, idempotency, persistence).
- EP-P0-PAY-02 Define and implement a real payment ledger.
- EP-P0-PAY-03 Make manual Interac marking safe and auditable.
- EP-P0-PAY-04 Build Payment Reconciliation Job: A scheduled task that compares Stripe/Interac logs with the internal Database to auto-detect and fix "Stuck/Ghost" payments that failed to sync via webhook.

### Commissions & payroll
- EP-P0-COMM-02 Implement Commission "Clawback" Logic: Automatically generate negative commission entries when a paid job is refunded or cancelled, ensuring overpayments are deducted from the next payroll.

### Legal & compliance
- EP-P0-LEG-01 Implement Law 25 Data Access Audit: Create an immutable log table that records every "View" action on sensitive Customer/Job data (Who, When, What), exportable for compliance requests.
- EP-P0-LEGAL-02 Implémenter le Rapport d'Incident: Formulaire dédié pour les techniciens (photos + description) qui déclenche une alerte critique (SMS/Email) aux managers pour une gestion immédiate des dégâts.
- EP-P0-LEGAL-03 Implémenter l'Acceptation des CGV: Bloquer le début d'un travail tant que le client n'a pas accepté (signature numérique ou case à cocher) les termes de service (responsabilité, exclusions, paiements).
### Product configuration
- EP-P0-IMPORTANT-01 Nothing should be hardcoded like services or company name; admin/manager must be able to manage company profile and services in-app.

## P1 - Engineering, auth, dispatch, messaging, storage
### Engineering
- EP-P1-ENG-03 Standardize API response format and error handling. 
- EP-P1-ENG-05 Remove unsafe any usage and tighten validators.
- EP-P1-ENG-06 Add E2E tests for critical flows (Playwright).
- EP-P1-ENG-08 Product gap audit: compare spec + live UI vs code; log missing/mis-implemented features with file refs.
- EP-P1-ENG-11 Implémenter la File d'Attente de Synchronisation (Offline Mode): Permettre aux techniciens d'effectuer des actions (finir job, uploader photos) sans réseau, en stockant les requêtes localement pour une exécution différée automatique.

### Auth & permissions
- EP-P1-AUTH-01 Redesign permission keys so technician settings do not equal company settings.
- EP-P1-AUTH-02 Field-level authorization for jobs and customers.
- EP-P1-AUTH-03 Define and enforce a job status state machine.
- EP-P1-AUTH-04 Report data-scope rules to prevent technician data leakage.
- EP-P1-AUTH-05 Align role definitions across DB, permissions, and UI.

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
- EP-P1-DISP-10 Weather cancellation flow: select dates -> list affected jobs -> cancel all or reschedule.
- EP-P1-DISP-11 Reschedule flow: send SMS link -> customer selects new slot -> confirm + update job.

### Sales workflow
- EP-P1-SALES-02 Implémenter l'Expiration des Devis: Ajouter une date de validité aux Leads/Devis et empêcher la conversion en Job si la date est dépassée, forçant une révision du prix.

### Ops & restrictions
- EP-P1-OPS-04 Implémenter les Restrictions Technicien-Client: Ajouter une liste "Techniciens Exclus" sur le profil client qui empêche l'assignation accidentelle de personnel spécifique (conflits passés).

### Storage & documents
- EP-P1-STOR-01 Stop storing public URLs for sensitive documents.
- EP-P1-STOR-02 Add file validation and malware scanning hook.

## P2 - Feature completeness and UX
### Core features
- EP-P2-PRICE-01 Connect pricing engine to job creation and invoicing.
- EP-P2-PRICE-02 Display "Last Price Paid": Show the customer's previous job price next to the quoting field to ensure consistent pricing (stop looking up old invoices).
- EP-P2-JOBS-01 Implement job_history logging everywhere.
- EP-P2-JOBS-02 Implement "Clone Job" Workflow: Add "Duplicate" action to past jobs that pre-fills a new job form with the customer's previous service details and pricing.
- EP-P2-JOBS-03 Add Voice Notes to Jobs: Allow technicians to record audio clips (e.g., explanation of tricky damage) attached to the job record (stop typing long paragraphs with wet hands).
- EP-P2-CHECK-01 Finish shift checklist workflow with structured items and photos.
- EP-P2-CUST-01 Implement customer communication timeline and connect to jobs/leads.
- EP-P2-CUST-02 Implement Customer Language Preference (EN/FR): Add DB field, display "Speak English/French" badge on Tech/Seller view, and update SMS/Email automation to select the matching language template.
- EP-P2-CUST-03 Implement Customer Merge Tool: Admin tool to combine duplicate customer profiles (merging history/jobs) into a single record (stop having 3 "John Does").
- EP-P2-CUST-04 Referral Linking UI: Simple "Referred By" picker in Customer creation that links to an existing client and triggers the $50 bonus logic (stop tracking referrals on paper).

### Sales & territories
- EP-P2-SALES-01 Add sales territory management UI with map polygon drawing. 
- EP-P2-SALES-02 Implement "Sales Day" logistics flow: create shifts with default meeting point/time, enable per-seller overrides for custom pickup times/addresses, and allow saving instruction sets (notes) as reusable templates. 
- EP-P2-SALES-03 Build hierarchical territory mapping: allow Managers to draw a "Master Polygon" (team zone) and assign "Specific Polygons" (individual sub-zones) to specific sellers for that day. 
- EP-P2-SALES-04 Build Sales Rep mobile schedule card: display the specific assigned pickup time/address (handling overrides) and render the map showing the Master Zone with their specific Sub-Zone highlighted. 
- EP-P2-SALES-06 Add DB tables + RLS for sales_days and sales_day_assignments; refresh Supabase types.
- EP-P2-SALES-05 Implémenter l'Ajout de Service sur le Terrain: Permettre aux techniciens d'ajouter des services (Upsell) à un job en cours avec validation immédiate par signature client ou confirmation SMS, mettant à jour la facture en temps réel.

### GPS & availability
- EP-P2-GPS-01 Make GPS tracking production-grade.
- EP-P2-GPS-02 Implémenter le "Lien de Suivi Client": Générer une URL publique temporaire (expirant après le job) envoyée par SMS, permettant au client de voir la position du technicien en approche (style Uber).
- EP-P2-AVAIL-01 Admin/Manager availability page: team availability grid + overrides. 
- EP-P2-AVAIL-02 Sales rep availability page: self availability edit (days + time windows).
- EP-P2-AVAIL-03 Technician availability page: self availability edit (days + time windows).

### Messaging
- EP-P2-MSG-01 Enforce strict SMS inbox visibility: Admin/Manager view all conversations; Tech/Sellers view ONLY assigned clients (enforced via RLS & API).
- EP-P2-MSG-02 Implement SMS Persona & Prefix Logic: Force mandatory prefixes for Tech/Seller messages; add "Speak As" selector for Admin/Manager with smart prefixing (shows only on start or persona switch).
- EP-P2-MSG-03 Implement SMS Access Locking: Build UI/DB controls for Admin/Manager to lock/revoke messaging access for specific Sellers/Techs (per-client or global block).
- EP-P2-MSG-04 Bulk SMS Broadcast: "Select All" customers in a filtered list and send a single announcement message (e.g., "Holiday Closures") (stop texting 50 people one by one).

### Payments
- EP-P2-PAY-05 Implémenter les Pourboires Numériques: Ajouter une option (10%, 15%, 20%, Autre) lors du paiement facture qui route les fonds vers une balance "Pourboires à verser" dans le rapport de paie.

### Marketing & retention
- EP-P2-MKT-01 Implémenter l'Automatisation de Réactivation: Tâche planifiée qui scanne les jobs vieux de 6/12 mois et envoie automatiquement des campagnes SMS/Email personnalisées pour réserver le prochain entretien.
- EP-P2-MKT-02 Implémenter le "Review Gating": Créer un flux post-job qui dirige les clients satisfaits (4-5★) vers Google Maps et les mécontents (1-3★) vers un formulaire de support interne pour éviter les mauvais avis publics.

### Admin & ops
- EP-P2-FLT-01 Implémenter l'Inspection Véhicule (Circle Check): Formulaire obligatoire au début/fin de quart exigeant des photos datées du véhicule pour débloquer l'application, assurant la traçabilité des dommages.
- EP-P2-ADMIN-01 Build Dynamic Service & Pricing UI: Allow Admins to create/edit Service Types, Packages, and Base Prices via the web interface (replace hardcoded constants with DB tables).
- EP-P2-ADMIN-02 Implement User Impersonation: Allow Admins to temporarily "View As" a specific Manager, Tech, or Sales Rep to debug permission/visibility issues instantly.
- EP-P2-ADMIN-03 Build Role Templates: Allow cloning an existing user's permissions when creating a new employee to speed up onboarding (stop clicking 20 checkboxes every time).
- EP-P2-ADMIN-04 Record Change History (Audit Log): Show a "Last Edited By [Name]" timestamp on critical records with a simple view of what changed (stop asking "Who deleted this?").
- EP-P2-ADMIN-05 Global Tag Manager: UI to create/edit color-coded tags (e.g., "VIP", "Bad Dog", "Gate Code") so they are consistent across the team (stop having "V.I.P." and "VIP" tags).
- EP-P2-OPS-02 Implement "Running Late" Trigger: Technician quick-action that updates job ETA and auto-sends an apology SMS to the customer with the new time.
- EP-P2-OPS-03 Implement Inventory Low-Stock Alerts: Auto-notify Manager via SMS/Email when tracked equipment/supplies fall below defined thresholds (stop running out of soap).

### Reporting & dashboards
- EP-P2-DASH-01 Customizable Dashboard Layout: Allow Admins to drag-and-drop, resize, or hide KPI cards to prioritize what matters to them (stop staring at useless graphs).

### Dispatch enhancements
- EP-P2-DISP-12 Implement "Find Next Available Slot": Add a search button to the Dispatch Calendar that auto-scrolls to the next opening matching the job's duration and technician territory.

### UX & UI
- EP-P2-UX-01 Fix Job Assignment UX: Add "Reassign" and "Move Time" buttons to Job Cards (stop just relying on drag-drop).
- EP-P2-UX-03 Mobile UI Fix: Convert Customer/Job tables to "Card Views" on mobile to prevent horizontal scrolling.
- EP-P2-UX-05 Implement Global Search Bar: Unified search input in TopNav that queries Customers, Jobs, and Leads simultaneously with categorized results.
- EP-P2-UX-06 Implement "Continuous Job Flow": After completing a job, display a "Navigate to Next Job" prompt that auto-loads the next scheduled assignment's GPS details.
- EP-P2-UX-07 Implement Bulk Actions for Tables: Add checkboxes to Job and Invoice lists with bulk operations (e.g., "Bulk Approve", "Bulk Send SMS", "Bulk Archive").
- EP-P2-UX-08 Implement Google Places Autocomplete: Add address prediction to all Job/Customer forms to auto-fill fields and capture precise GPS coordinates instantly.
- EP-P2-UX-11 Implement Customer "Quick View" Popover: Show critical tags (VIP, Bad Dog, Gate Codes) in a popup when hovering/tapping a customer name in the Schedule, avoiding full page navigation.
- EP-P2-UX-15 Implement Mobile Se Actions: Add "Se Left to Call" and "Se Right to Complete" on job list items for one-handed mobile use (stop aiming for tiny buttons).
- EP-P2-UX-16 Implement Command Palette (Ctrl+K): A centralized search bar to jump to any page or run actions (e.g., type "New Inv..." -> opens Invoice) instantly.
- EP-P2-UX-17 Smart Date Pickers: Add "Tomorrow", "Next Week", "First Monday of Month" quick-select chips to all date inputs (stop clicking 'Next' 12 times).
- EP-P2-UX-18 Drag-and-Drop Multi-Upload: Allow dragging 10 photos at once into the upload zone instead of selecting one by one (stop the upload struggle).
- EP-P2-UI-02 Mobile UI audit: fix iOS/Android layout/visibility issues on dispatch, schedule, map, settings, leads, customers.
- EP-P2-UI-01 Replace manual ID entry with searchable pickers and pagination.
- EP-P2-I18N-01 French-first UX copy and Quebec formatting.
- EP-P2-ENG-01 Human-Readable Error Toasts: Replace generic "Error 500" alerts with specific, actionable messages (e.g., "Weak Internet - Retrying save...") (stop confusion).

## P3 - Product expansion
- EP-P3-SUB-01 Implement customer subscriptions.
- EP-P3-COMM-01 Automate commissions and payroll generation.
- EP-P3-OPS-01 Manager approval workflows for invoices, upsells, discounts.
- EP-P3-BI-01 Implémenter le Calcul de Rentabilité Réelle: Tableau de bord qui croise revenus vs coûts directs (main d'œuvre + déplacement) pour afficher la marge nette par job et alerter sur les contrats non-rentables.
- EP-P3-SESS-01 Implement session management (view and revoke active sessions).

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

## QA and testing
- Run full E2E suite: npm run test:e2e (fix failures). 
- Test core workflows: create lead, customer, team member, job; dispatch calendar (auto-assign, drag-drop).

## Production deployment checklist
- Record release tag or commit SHA, deployment time, and approver in the deployment log.
- Confirm CI is green for the release commit (typecheck, lint, tests, e2e) and archive results.
- Apply Supabase migrations in staging and production; store migration logs.
- Verify RLS enabled for every tenant table and helper functions exist (get_user_role, get_user_company_id).
- Validate production secrets and env vars are present (APP_ENCRYPTION_KEY, Stripe, Twilio, Resend) in the secrets manager.
- Verify Stripe keys + webhook secret configured (or payments disabled explicitly).
- Verify Twilio configured + webhook signature verification enabled (or SMS disabled explicitly).
- Verify Resend configured (or email disabled explicitly).
- Verify storage buckets are private and signed URLs used for documents/photos.
- Ensure no demo or mock fallback data in production paths.
- Confirm observability configured (structured logs + request IDs + error tracking) and capture a test request.
- Run smoke tests for core workflows: create lead, customer, team member, job; verify dispatch calendar behavior.
- Capture rollback plan (previous release tag and DB backup status).
