# Master Task List - Field Service Management Platform (single source of truth)

**If you discover new issues, bugs, improvements, or missing features while working on a task, add them to this list immediately and continue your current task. Do not let discoveries block your work-in-progress.**

This file is the only coordination list for work in this repo.

> **Note:** Task IDs use the legacy `EP-` prefix. This does NOT mean the platform is specific to one company.
> This is a **multi-tenant field service management platform** for many different companies, industries, and service types.
> Nothing should be hardcoded to a single company, service type, or region.

First before working give yourself a name, that you will remember always use the same name, that is not used.
Many AI work on this at the same time so never forget that

**List of name available** (take a name from here and remove it when you took it):
- AI-1
- AI-2
- AI-3
- AI-4
- AI-5
- AI-6
- AI-7
- AI-8
- AI-9

**List of name taken** (put the name you choose here):
-

## How to use
- Choose a task yourself and claim it by appending: `[AI-X 2026-02-05-14:30]`
- If a task has any tag, do not work on it
- When a task is done, delete the entire line
- If you stop without finishing, remove your tag so others can take it
- Keep tasks atomic (one task per line)

## Notes
- This list consolidates tasks from other docs
- Do not add task lists to other markdown files
- Priority: P0 (production blockers) → P1 (important) → P2 (competitive features) → P3 (future)
- Features inspired by: Jobber, Homebase360, Homebase, ServiceTitan, Housecall Pro
- **This platform is industry-agnostic**: cleaning, HVAC, plumbing, landscaping, electrical, pest control, etc. All service types, pricing rules, and business logic must be configurable per company.

### What already exists (do NOT re-create)
> **Tables:** companies, users, customers, jobs, invoices, leads, notifications, sms_messages, job_photos, job_history, job_assignments, job_quality_issues, job_rework, job_upsells, upsell_items, employee_commissions, employee_availability, customer_ratings, customer_rating_tokens, customer_subscriptions, customer_communication, customer_blacklist, referrals, loyalty_points, loyalty_transactions, leaderboard, gps_locations, geofences, incidents, idempotency_keys, onboarding_progress, payroll_statements, termination_records, shift_checklists, sales_territories, technician_location_daily, user_audit_log, user_sessions, auth_challenges, equipment_checklist_templates, google_review_bonuses, company_services, tax_settings, pricing_rules, holidays, sms_templates, email_templates
>
> **API routes:** /api/jobs, /api/jobs/[id], /api/customers, /api/customers/[id], /api/invoices, /api/invoices/[id], /api/leads, /api/leads/[id], /api/users, /api/users/[id], /api/notifications, /api/sms/*, /api/payments/*, /api/dispatch/*, /api/search, /api/uploads, /api/health, /api/reports/[type], /api/company/services, /api/settings/*, /api/auth/*
>
> **Pages:** /dashboard, /jobs, /customers, /dispatch, /inbox, /team, /team/[id], /invoices, /reports, /notifications, /sales/*, /technician/*, /admin/*, /settings, /profile
>
> **Components:** BottomNavMobile, Pagination, BottomSheet, StatusBadge, TopBar, SideNav, AppShell, KpiCard, JobPhotoUpload, GlobalSearch, all form components (CustomerForm, InvoiceForm, JobForm, LeadForm)
>
> **Lib modules:** env.ts, logger.ts, requestId.ts, rateLimit.ts, session.ts, auth.ts, crypto.ts, permissions.ts, validators.ts, pricing.ts, pdf.ts, smsTemplates.ts, stripe.ts, twilio.ts, resend.ts, notifications.ts, maps.ts, i18n.ts, data.ts, queries.ts, idempotency.ts, errorTracking.ts, security.ts, dashboardMetrics.ts, salesDashboard.ts, leads.ts, deviceDetection.ts, supabaseServer.ts, types.ts, api/index.ts

***

## P0 - PRODUCTION BLOCKERS (Must complete before launch)

### Code Quality & Foundation
- EP-P0-CODE-01 Add commitlint hook with conventional commits format (prevent bad commit messages going forward)
- EP-P0-CODE-02 Add React Error Boundaries to all layout files (app, auth, public layouts)
- EP-P0-CODE-03 Clean .gitignore: add tsconfig.tsbuildinfo, .next/, .vercel/, .DS_Store
- EP-P0-CODE-05 Add Content-Security-Policy and security headers in next.config.js
- EP-P0-CODE-06 Create unified error handling: lib/errors.ts with ApiError class and standard responses
- EP-P0-CODE-04 Upgrade lib/env.ts to use Zod schema validation (currently just a process.env wrapper with no startup validation)
- EP-P0-CODE-07 Replace in-memory rate limiter (lib/rateLimit.ts) with Redis/Upstash — NOTE: rate limiting is currently DISABLED (returns allowed: true always)
- EP-P0-CODE-08 Fix Jest/Babel config so test suites can parse TypeScript/JSX (all 33 suites currently fail with SyntaxError)
- EP-P0-CODE-09 Fix pre-existing TypeScript error in tests/pagesCoverage.test.tsx (DashboardPage arity mismatch)

### Platform Generalization
- EP-P0-GEN-10 Populate email_templates table with default templates per company (invoice, quote, reminder, receipt)
- EP-P0-GEN-11 Make PDF invoice generation use company branding from DB — company logo, colors, tax numbers from companies + tax_settings tables
- EP-P0-GEN-14 Make company onboarding configurable: registration creates company with configurable service types, pricing rules, tax rates, SMS/email templates
- EP-P0-GEN-15 Create /settings/company page: company name, legal name, address, phone, email, logo, tax numbers, timezone, locale, currency
- EP-P0-GEN-16 Create /settings/services page: CRUD for company_services with pricing, descriptions, duration estimates
- EP-P0-GEN-17 Create /settings/pricing page: configure pricing_rules, surcharges, discounts, tax_settings per company
- EP-P0-GEN-18 Create /settings/templates page: customize SMS and email templates per company with variable interpolation preview
- EP-P0-GEN-22 Finish locale/language support: date format, currency symbol, number format using companies.locale column
- EP-P0-GEN-25 Remove hardcoded personal emails (jelidiadam12@gmail.com, youssef.takhi@hotmail.com) from all test files — use configurable test accounts
- EP-P0-GEN-26 Update /api/jobs route to load company pricing config via loadCompanyPricing() instead of using fallback defaults
- EP-P0-GEN-27 Update invoice PDF callers to load tax rates from tax_settings table and pass them to generateInvoicePdf()

### Soft-Delete & Data Integrity
- EP-P0-SDEL-01 Enforce soft-delete semantics: all queries must filter deleted_at IS NULL by default
- EP-P0-SDEL-02 Add RLS policy layer: soft-deleted rows invisible to non-admins
- EP-P0-SDEL-03 Prevent updates to soft-deleted records unless admin restore flow
- EP-P0-SDEL-04 Implement data retention policy: purge soft-deleted records after configurable period

### Registration & Onboarding
- EP-P0-REG-01 Decide and enforce registration model: self-signup vs invite-only vs hybrid (configurable per deployment)
- EP-P0-REG-02 If self-signup: add email verification, CAPTCHA, rate limiting, anti-abuse monitoring
- EP-P0-REG-03 Company onboarding wizard: company info → service types → pricing → invite team → first customer
- EP-P0-REG-04 Employee onboarding flow: invite link → accept → set password → assign role → first login guided tour

## DATABASE SCHEMA TASKS

### Core Tables (Actually Missing)
- EP-P0-DB-20 Create roles table: id, company_id, role_name, role_key, permissions (JSONB), is_system_role, description, created_by, created_at, updated_at
- EP-P0-DB-21 Create role_permissions table: role_id, module, action, field_restrictions (JSONB), conditions (JSONB)
- EP-P0-DB-22 Modify users table: add role_id (FK to roles), remove hardcoded role enum
- EP-P0-DB-24 Create quotes table: id, company_id, customer_id, lead_id, quote_number, status, total_amount, tax_amount, expiry_date, terms, notes, created_by, sent_at, approved_at, approved_by, created_at
- EP-P0-DB-25 Create quote_line_items table: id, quote_id, description, quantity, unit_price, discount, tax_rate, total
- EP-P0-DB-26 Modify jobs table: add quote_id (FK), job_number, start_time, end_time, estimated_duration, actual_duration
- EP-P0-DB-27 Create job_notes table: id, job_id, note, created_by, is_internal, created_at (job_history exists but is status-change focused, not free-form notes)
- EP-P0-DB-30 Create job_documents table: id, job_id, document_url, document_type, name, uploaded_by, uploaded_at
- EP-P0-DB-31 Modify customers table: add customer_number, language_preference, preferred_contact_method, tags (JSONB), custom_fields (JSONB)
- EP-P0-DB-32 Create customer_notes table: id, customer_id, note, created_by, created_at
- EP-P0-DB-33 Create customer_documents table: id, customer_id, document_url, document_type, name, expiry_date, uploaded_at
- EP-P0-DB-34 Create customer_properties table: id, customer_id, address, property_type, notes, photos (JSONB), created_at
- EP-P0-DB-35 Modify invoices table: add invoice_number, due_date, paid_date, payment_terms, late_fee, subtotal, tax_amount, discount_amount, notes
- EP-P0-DB-36 Create invoice_line_items table: id, invoice_id, description, quantity, unit_price, tax_rate, discount, total
- EP-P0-DB-37 Create payment_ledger table: id, company_id, invoice_id, job_id, transaction_type, payment_method, amount, status, stripe_payment_id, metadata (JSONB), processed_at
- EP-P0-DB-38 Create payment_methods table: id, customer_id, type, stripe_payment_method_id, last4, expiry, is_default
- EP-P0-DB-40 Create notification_preferences table: user_id, event_type, email_enabled, sms_enabled, push_enabled, in_app_enabled
- EP-P0-DB-42 Create sms_threads table: id, company_id, customer_id, last_message_at, unread_count, assigned_to
- EP-P0-DB-43 Create email_logs table: id, company_id, recipient_email, subject, template_name, resend_id, status, sent_at, opened_at
- EP-P0-DB-47 Create commission_profiles table: id, company_id, name, rules (JSONB), is_active, version, created_by, created_at

### Indexes (Only Ones Not Yet Created)
- EP-P0-DB-60 Create composite index on jobs(company_id, status, scheduled_at)
- EP-P0-DB-64 Create index on invoices(company_id, status, due_date) for payment tracking
- EP-P0-DB-66 Create index on payments(company_id, processed_at DESC) for payment reports (requires payment_ledger table first)
- EP-P0-DB-72 Create full-text search index on customers(name, email, phone, address)
- EP-P0-DB-73 Create full-text search index on jobs(description, notes)

### RLS Policies (For New Tables)
- EP-P0-DB-80 Create RLS policies for roles table: company_id isolation, only admins can modify system roles
- EP-P0-DB-82 Create RLS policies for quotes table: company_id isolation, role-based access
- EP-P0-DB-85 Create RLS policies for payment_ledger table: company_id isolation, financial data restricted to admin/manager
- EP-P0-DB-89 Create RLS policies for user_audit_log table: read-only, admin/manager access only

### Data Migrations & Seeds
- EP-P0-DB-100 Migration: Create default roles for existing companies (Admin, Manager, Technician, Sales)
- EP-P0-DB-101 Migration: Assign existing users to appropriate roles based on current role field
- EP-P0-DB-103 Migration: Populate default email templates per existing company
- EP-P0-DB-105 Migration: Generate job_numbers for existing jobs
- EP-P0-DB-106 Migration: Generate invoice_numbers for existing invoices
- EP-P0-DB-107 Migration: Generate customer_numbers for existing customers

### Database Functions & Triggers
- EP-P0-DB-120 Create function: get_user_role(user_id) returns role with permissions
- EP-P0-DB-121 Create function: check_permission(user_id, module, action) returns boolean
- EP-P0-DB-123 Create function: generate_job_number(company_id) returns next job number
- EP-P0-DB-124 Create function: generate_invoice_number(company_id) returns next invoice number
- EP-P0-DB-125 Create function: calculate_invoice_total(invoice_id) recalculates invoice totals from line items
- EP-P0-DB-127 Create trigger: auto_update_invoice_total on invoice_line_items changes
- EP-P0-DB-128 Create trigger: auto_create_audit_log on sensitive table updates
- EP-P0-DB-129 Create trigger: auto_update_updated_at timestamp on all tables
- EP-P0-DB-130 Create trigger: prevent_system_role_deletion on roles table
- EP-P0-DB-131 Create trigger: cascade_job_status_to_timeline on jobs.status change

### Views (Performance)
- EP-P0-DB-140 Create view: v_jobs_with_details (joins jobs, customers, assigned user, service type)
- EP-P0-DB-141 Create view: v_invoices_with_payments (joins invoices with payment ledger)
- EP-P0-DB-146 Create view: v_upcoming_jobs (jobs in next 7 days with all details)
- EP-P0-DB-147 Create view: v_overdue_invoices (unpaid invoices past due date)

### Database Critical
- EP-P0-DB-02 Replace all SELECT * with explicit column lists in query files
- EP-P0-DB-03 Fix query patterns: use .single() / .maybeSingle() correctly to prevent array bugs
- EP-P0-DB-04 Create data access layer: lib/data/jobs.ts, customers.ts, users.ts, invoices.ts, roles.ts
- EP-P0-DB-05 RLS security audit: test with 3+ mock companies, verify complete isolation
- EP-P0-DB-06 Add version column to jobs and customers tables for optimistic concurrency control
- EP-P0-DB-08 Create migration testing script: preflight checks, dry-run mode, rollback procedures
- EP-P0-DB-10 Enable PgBouncer or Supabase connection pooling with documented limits

### Modular Role System (Configurable by Company)
- EP-P0-ROLE-03 Remove hardcoded roles from code: replace with dynamic role fetching from DB
- EP-P0-ROLE-04 Create /api/roles CRUD: list, create, update, delete (only non-system roles), clone role
- EP-P0-ROLE-05 Create /api/roles/[id]/permissions: get and update permissions for a role
- EP-P0-ROLE-06 Seed default roles per company: Admin (system), Manager, Technician, Sales (all editable except Admin)
- EP-P0-ROLE-07 Build UI for role management: /settings/roles with create, edit, delete, clone, permission matrix
- EP-P0-ROLE-08 Implement permission checking middleware: check user role permissions on every API call
- EP-P0-ROLE-09 Add role-based UI visibility: hide/show features based on user's role permissions
- EP-P0-ROLE-10 Create role assignment UI: when creating/editing users, select from company's available roles
- EP-P0-ROLE-11 Add permission categories: Jobs, Customers, Team, Scheduling, Invoicing, Payments, Reports, Settings, System

### API Routes (Actually Missing)
- EP-P0-API-03 Create /api/jobs/[id]/timeline: get job history (status changes, notes, photos)
- EP-P0-API-04 Create /api/jobs/[id]/duplicate: clone existing job with modifications
- EP-P0-API-07 Create /api/customers/[id]/jobs: get all jobs for a customer
- EP-P0-API-08 Create /api/customers/[id]/invoices: get all invoices for a customer
- EP-P0-API-09 Create /api/customers/[id]/notes: CRUD for customer notes
- EP-P0-API-12 Create /api/team/[id]/schedule: get employee's schedule with availability
- EP-P0-API-13 Create /api/team/[id]/commissions: get commission history and totals
- EP-P0-API-15 Create /api/schedule/conflicts: check for scheduling conflicts before assigning
- EP-P0-API-19 Create /api/invoices/[id]/pdf: generate PDF invoice
- EP-P0-API-20 Create /api/invoices/[id]/send: send invoice via email/SMS
- EP-P0-API-21 Create /api/quotes GET (list) and POST (create quote)
- EP-P0-API-22 Create /api/quotes/[id] GET, PATCH, POST (convert to job), DELETE
- EP-P0-API-23 Create /api/quotes/[id]/pdf: generate PDF quote
- EP-P0-API-25 Create /api/sms/webhook for incoming SMS (Twilio signature verification required)
- EP-P0-API-27 Harden /api/payments/stripe webhook: signature verification, idempotency, retry logic
- EP-P0-API-28 Create /api/payments/methods: manage customer payment methods
- EP-P0-API-29 Create /api/payments/refunds: process refunds with reason tracking
- EP-P0-API-36 Add request logging middleware: log all API requests with IDs, timing, errors

### Frontend Pages (Actually Missing)
- EP-P0-UI-03 Create /jobs/[id] page: details, photos upload, status updates, timeline, notes, invoice link
- EP-P0-UI-04 Create /jobs/new page: multi-step form (customer select/create, service, schedule, pricing preview)
- EP-P0-UI-05 Create /jobs/[id]/edit page: modify job details, reschedule, reassign
- EP-P0-UI-07 Create /customers/[id] page: profile, contact info, job history, invoices, notes, documents
- EP-P0-UI-08 Create /customers/new page: create customer with address validation
- EP-P0-UI-09 Create /customers/[id]/edit page: update customer information
- EP-P0-UI-11 Create /dispatch/map page: map view showing technician locations and job sites
- EP-P0-UI-15 Create /team/new page: invite employee, assign role, set permissions
- EP-P0-UI-16 Create /team/[id]/edit page: update employee info, change role
- EP-P0-UI-18 Create /invoices/[id] page: invoice details, payment history, send/download
- EP-P0-UI-19 Create /invoices/new page: create invoice from scratch (for non-job charges)
- EP-P0-UI-20 Create /quotes page: list active quotes, won/lost status
- EP-P0-UI-21 Create /quotes/[id] page: quote details, convert to job, send to customer
- EP-P0-UI-22 Create /quotes/new page: create quote with pricing, expiry date
- EP-P0-UI-24 Create /reports/revenue page: detailed revenue breakdown with charts
- EP-P0-UI-25 Create /reports/technicians page: performance metrics, rankings, commissions
- EP-P0-UI-26 Create /reports/customers page: CLV, retention, satisfaction scores
- EP-P0-UI-27 Create /settings/account page: user profile, password, notifications
- EP-P0-UI-28 Create /settings/company page: company info, branding, service area
- EP-P0-UI-29 Create /settings/roles page: manage roles and permissions (role CRUD UI)
- EP-P0-UI-30 Create /settings/services page: manage service types, pricing, descriptions
- EP-P0-UI-31 Create /settings/integrations page: Stripe, Twilio, Google Maps keys
- EP-P0-UI-34 Add loading states (skeletons) to all data-fetching pages
- EP-P0-UI-35 Add error states with retry buttons to all pages
- EP-P0-UI-36 Add empty states with CTAs to all list pages

### UI Components (Actually Missing)
- EP-P0-COMP-04 Create LoadingSpinner and Skeleton components (consistent loading states)
- EP-P0-COMP-05 Create Toast notification system (success, error, info, warning)
- EP-P0-COMP-06 Create Modal/Dialog component with backdrop and close handlers
- EP-P0-COMP-07 Create Form components: FormField, FormError, FormLabel with Zod validation
- EP-P0-COMP-08 Create DataTable component: sortable columns, filters, row actions, bulk select
- EP-P0-COMP-09 Create DatePicker and TimePicker components (mobile-friendly)
- EP-P0-COMP-10 Create FileUploader component: drag-drop, preview, progress, validation
- EP-P0-COMP-12 Create Avatar component with fallback initials
- EP-P0-COMP-13 Create CustomerSelector component: search, create new, recent customers
- EP-P0-COMP-14 Create ServiceSelector component: select service type with pricing preview
- EP-P0-COMP-15 Create AddressAutocomplete component: Google Places integration
- EP-P0-COMP-16 Create Calendar component: month view, day view, job markers
- EP-P0-COMP-17 Create JobCard component: compact job display for lists
- EP-P0-COMP-18 Create InvoicePreview component: live preview while editing
- EP-P0-COMP-19 Create PermissionMatrix component: visual permission editor for roles
- EP-P0-COMP-20 Create Chart components: LineChart, BarChart, PieChart for reports

### Security Critical
- EP-P0-SEC-02 Implement session revocation: check user status on each request (30s cache)
- EP-P0-SEC-03 Add CSRF protection to all form submissions
- EP-P0-SEC-04 Enforce MFA for admin role (mandatory system role)
- EP-P0-SEC-05 Enable GitHub secret scanning and Dependabot alerts
- EP-P0-SEC-06 Fix any high/critical vulnerability alerts from Dependabot
- EP-P0-SEC-07 Audit rules engine: ensure no eval() or arbitrary JS execution
- EP-P0-SEC-08 Add API rate limiting per user and per company (different limits per plan)
- EP-P0-SEC-09 Implement webhook signature verification (Stripe, Twilio)
- EP-P0-SEC-10 Add permission-based API authorization: check role permissions on every endpoint
- EP-P0-SEC-11 Implement audit log for sensitive actions: role changes, permission changes, data export
- EP-P0-SEC-XXa Move prod keys to Secret Manager (or password manager) + manual rotation playbook

### Testing
- EP-P0-TEST-01 E2E: Auth flow (register, login, logout, protected routes, role-based access)
- EP-P0-TEST-02 E2E: Job creation flow (select customer → service → schedule → pricing → create)
- EP-P0-TEST-03 E2E: Customer creation and search
- EP-P0-TEST-04 E2E: SMS sending and receiving workflow
- EP-P0-TEST-05 E2E: Payment flow (Stripe test mode → webhook → confirmation)
- EP-P0-TEST-06 E2E: Quote creation → approval → convert to job
- EP-P0-TEST-07 E2E: Invoice generation → send → payment → receipt
- EP-P0-TEST-08 E2E: Role management (create, edit permissions, assign to user)
- EP-P0-TEST-09 Integration: Pricing engine test all scenarios (DB-loaded config, fallback defaults, surcharges)
- EP-P0-TEST-10 Integration: Commission calculation (base, split, clawback)
- EP-P0-TEST-11 Unit tests for all lib/ modules (30+ files currently without tests)
- EP-P0-TEST-12 API endpoint tests with request/response validation
- EP-P0-TEST-13 RLS isolation tests: verify tenant cannot access other tenant data
- EP-P0-TEST-14 Permission tests: verify each role can only access allowed resources
- EP-P0-TEST-15 Set realistic coverage target: 80% for critical paths (not 100%)
- EP-P0-TEST-20 Create test data generator and anonymizer for staging

### Core Flows (Must Work End-to-End)
- EP-P0-FLOW-01 Photo upload flow: camera/file → upload → storage → DB record → display in job
- EP-P0-FLOW-02 Customer rating flow: job complete → SMS with link → rating page → Google redirect → bonus
- EP-P0-FLOW-03 Payment flow: create intent → customer pays → webhook → update DB → send receipt
- EP-P0-FLOW-04 Job lifecycle: create → assign → start → complete → invoice → payment → close
- EP-P0-FLOW-05 Quote lifecycle: create → send → approve → convert to job → schedule
- EP-P0-FLOW-06 Webhook reliability: idempotency, retry logic, dead-letter queue for failures
- EP-P0-FLOW-07 Scheduling flow: create job → check conflicts → optimize assignment → notify technician
- EP-P0-FLOW-08 Invoice flow: job complete → generate invoice → send (email/SMS) → payment → receipt

### Payments & Financial
- EP-P0-PAY-03 Manual payment methods: Cash, Check, Interac (approval workflow, receipt upload)
- EP-P0-PAY-04 Payment reconciliation job: daily check Stripe vs DB, alert on mismatches
- EP-P0-PAY-05 Payment error monitoring: Sentry alerts for failed payments, stuck intents
- EP-P0-PAY-06 Refund workflow: process refund → update ledger → notify customer → adjust commissions
- EP-P0-PAY-07 Partial payments: track payment installments for large invoices
- EP-P0-PAY-08 Payment reminders: automated reminders for overdue invoices (email/SMS)
- EP-P0-PAY-10 Payment receipts: auto-generate and send receipt on payment

### Monitoring & Observability
- EP-P0-OBS-01 Integrate Sentry for error tracking (or PostHog/LogRocket)
- EP-P0-OBS-02 Replace lib/logger.ts console.log wrapper with real structured logging (pino or winston) — current logger is JSON-over-console, not a proper library
- EP-P0-OBS-03 Upgrade /api/health to check DB connectivity, Redis, and external services — currently a 12-line stub that only returns `{status:"ok"}`
- EP-P0-OBS-04 Enable Vercel Analytics or alternative performance monitoring
- EP-P0-OBS-05 Setup uptime monitoring: Pingdom, UptimeRobot, or BetterStack
- EP-P0-OBS-06 Create alert rules: critical errors, payment failures, API downtime, permission violations

### Infrastructure & DevOps
- EP-P0-INFRA-01 Setup staging environment: Vercel preview deployments + separate Supabase project
- EP-P0-INFRA-02 Create CI/CD pipeline: GitHub Actions (typecheck, lint, test, build, deploy)
- EP-P0-INFRA-03 Deploy Redis instance: Upstash recommended (free tier for dev, pay-as-you-go for prod)
- EP-P0-INFRA-05 Document secrets management: which secrets go where, rotation policy
- EP-P0-INFRA-06 Create deployment runbook: step-by-step production deploy checklist
- EP-P0-INFRA-07 Setup automated DB backups with Supabase (daily + point-in-time recovery)
- EP-P0-INFRA-08 Configure environment-specific configs: dev, staging, production

### Documentation (Critical Gaps)
- EP-P0-DOC-01 API documentation: all endpoints with request/response examples (OpenAPI or manual)
- EP-P0-DOC-02 Deployment guide: environment setup, secrets, migration steps, rollback
- EP-P0-DOC-03 Environment variables documentation: list all vars, example values, where to get keys
- EP-P0-DOC-05 Database schema documentation: ER diagram, table descriptions, RLS policies
- EP-P0-DOC-06 Developer onboarding guide: local setup, running tests, making first PR

### Legal & Compliance
- EP-P0-LEG-01 Implement Law 25 audit log: track all access to sensitive customer/job data
- EP-P0-LEG-04 GDPR/DSAR endpoints: data export, deletion, redaction workflows
- EP-P0-LEG-05 Privacy policy page: clear data usage explanation
- EP-P0-LEG-06 Terms of service page: service terms, cancellation policy

### Governance
- EP-P0-GOV-01 Add CODEOWNERS, PR template, and branch protection rules for main branches
- EP-P0-REL-01 Add migration rollback automation and test it in staging (dry-run + rollback script)

### Commissions & Payroll
- EP-P0-COMM-01 Implement commission clawback: negative entries when job refunded/cancelled (use existing employee_commissions table)
- EP-P0-COMM-03 Commission approval workflow: manager reviews before finalizing
- EP-P0-COMM-04 Commission reports: detailed breakdown per technician with drill-down

***

## P1 - IMPORTANT FEATURES (Competitive Parity with Jobber/Homebase360)

### P1 Database Tables
- EP-P1-DB-01 Create recurring_services table: id, company_id, customer_id, service_type_id, frequency (weekly/monthly/etc), start_date, end_date, status, next_occurrence, last_job_id
- EP-P1-DB-02 Create time_entries table: id, company_id, user_id, job_id, clock_in, clock_out, break_duration, location_in (lat/lng), location_out (lat/lng), notes, approved_by, approved_at
- EP-P1-DB-03 Create availability table: id, user_id, day_of_week, start_time, end_time, is_available
- EP-P1-DB-04 Create time_off_requests table: id, user_id, start_date, end_date, reason, status, requested_at, approved_by, approved_at
- EP-P1-DB-05 Create inventory_items table: id, company_id, name, sku, description, category, quantity, unit, cost_per_unit, price_per_unit, reorder_level, location
- EP-P1-DB-06 Create inventory_transactions table: id, item_id, job_id, transaction_type (usage/restock/adjustment), quantity, cost, reason, created_by, created_at
- EP-P1-DB-07 Create equipment table: id, company_id, name, type (vehicle/tool), make, model, year, vin_serial, assigned_to, status, purchase_date, purchase_cost
- EP-P1-DB-08 Create equipment_maintenance table: id, equipment_id, maintenance_type, scheduled_date, completed_date, odometer, cost, notes, performed_by
- EP-P1-DB-09 Create vehicle_inspections table: id, equipment_id, user_id, inspection_date, checklist_items (JSONB), passed, notes, signature_url
- EP-P1-DB-10 Create campaigns table: id, company_id, name, type (email/sms/both), status, audience_filter (JSONB), template_id, scheduled_at, sent_at, stats (JSONB)
- EP-P1-DB-13 Create customer_portal_users table: id, customer_id, email, password_hash, last_login, created_at
- EP-P1-DB-14 Create customer_portal_sessions table: id, portal_user_id, token, expires_at, created_at
- EP-P1-DB-15 Create webhooks table: id, company_id, url, events (array), secret, is_active, created_at
- EP-P1-DB-16 Create webhook_deliveries table: id, webhook_id, event_type, payload (JSONB), response_status, response_body, attempted_at, succeeded_at
- EP-P1-DB-17 Create api_keys table: id, company_id, name, key_hash, permissions (JSONB), last_used_at, expires_at, created_at
- EP-P1-DB-18 Create territories table: id, company_id, name, boundaries (GeoJSON), assigned_users (array), color
- EP-P1-DB-19 Create tags table: id, company_id, name, color, category (customer/job/team), created_at
- EP-P1-DB-20 Create taggables table: tag_id, taggable_id, taggable_type (polymorphic for jobs/customers/team)

### P1 Views (Performance Optimization)
- EP-P1-DB-142 Create materialized view: mv_customer_lifetime_value (CLV per customer)
- EP-P1-DB-143 Create materialized view: mv_technician_performance (jobs, ratings, revenue per tech)
- EP-P1-DB-144 Create materialized view: mv_daily_revenue (daily revenue aggregates, refresh nightly)
- EP-P1-DB-145 Create materialized view: mv_monthly_metrics (monthly KPIs, refresh weekly)

### Authorization Model & Business Rules
- EP-P1-AUTH-01 Redesign permission keys: split "settings" into profile_settings vs company_settings vs team_management
- EP-P1-AUTH-02 Field-level authorization for Jobs: technicians can only update status/notes/photos, not pricing/schedule/assignment
- EP-P1-AUTH-03 Field-level authorization for Customers: sales reps can edit notes/scheduling, not billing/internal fields
- EP-P1-AUTH-04 Define and enforce job status state machine server-side: allowed transitions per role, reject invalid ones
- EP-P1-AUTH-05 Permission and data-scope rules for Reports: technicians see only own data, managers see company-wide
- EP-P1-AUTH-06 Align role definitions across DB, permissions code, and UI (handle dispatcher/customer roles)
- EP-P1-AUTH-07 Implement field-level permissions: hide sensitive fields (pricing, commissions) based on role

### Dispatch & Scheduling Operations
- EP-P1-DISP-01 Implement real conflict detection: overlapping jobs, travel time, technician capacity, blocked availability
- EP-P1-DISP-02 Replace naive auto-assign with scoring-based algorithm: availability, distance, skills, workload balancing
- EP-P1-DISP-03 Build employee availability management end-to-end: table + API + calendar UI
- EP-P1-DISP-04 Weather cancellation safety: only cancel jobs in cancelable statuses, never touch completed/paid jobs

### Messaging Operations
- EP-P1-MSG-01 Fix SMS send idempotency: persist message row before sending, update status after Twilio response
- EP-P1-MSG-02 Inbound SMS webhook: verify Twilio signature, dedupe by MessageSid, map to correct company by Twilio number
- EP-P1-MSG-03 SMS opt-out compliance: handle STOP/START keywords, store opt-out flag, enforce quiet hours
- EP-P1-MSG-04 Email sending: require RESEND_API_KEY when email enabled, track delivery status in DB

### File Storage & Privacy
- EP-P1-STOR-01 Stop storing public URLs for sensitive documents: use private buckets + signed URLs only
- EP-P1-STOR-02 Add file validation: max size (10MB), allowed MIME types, path traversal prevention, filename sanitization

### Production Engineering
- EP-P1-ENG-03 Standardize API response format: ok(data), badRequest(), unauthorized(), forbidden(), notFound(), serverError()
- EP-P1-ENG-05 Remove unsafe `any` usage: replace with explicit types, use z.coerce for form fields, validate UUID params
- EP-P1-ENG-06 Add E2E tests for critical flows (Playwright): login, create customer, create job, invoice, payment
- EP-P1-ENG-08 Create production deployment checklist: env vars, Supabase setup, webhooks, monitoring, backups

### Lead Management
- EP-P1-LEAD-03 Create /leads page: kanban board (new, contacted, quoted, won, lost)
- EP-P1-LEAD-04 Lead assignment: auto-assign to sales reps based on territory
- EP-P1-LEAD-05 Lead conversion: convert lead to customer + create first quote/job
- EP-P1-LEAD-06 Lead scoring: automatic scoring based on engagement, value, urgency
- EP-P1-LEAD-07 Lead source tracking: track where leads come from (website, referral, ads)

### Quote & Proposal System
- EP-P1-QUOTE-01 Quote templates: save and reuse quote templates
- EP-P1-QUOTE-02 Quote line items: multiple services, quantities, discounts
- EP-P1-QUOTE-03 Quote expiry: automatic expiration dates with reminders
- EP-P1-QUOTE-04 Quote approval: customer approves quote online (digital signature)
- EP-P1-QUOTE-05 Quote follow-ups: automated follow-up emails/SMS
- EP-P1-QUOTE-07 Quote analytics: track quote win rate, average quote value

### Customer Portal
- EP-P1-PORTAL-01 Create customer login system: separate from employee auth
- EP-P1-PORTAL-02 Customer dashboard: view upcoming jobs, past jobs, invoices
- EP-P1-PORTAL-03 Customer can request quote online
- EP-P1-PORTAL-04 Customer can approve quotes online
- EP-P1-PORTAL-05 Customer can view and pay invoices online
- EP-P1-PORTAL-06 Customer can view job history with photos
- EP-P1-PORTAL-07 Customer can reschedule jobs (with approval workflow)
- EP-P1-PORTAL-08 Customer can message company (integrated with /inbox)
- EP-P1-PORTAL-10 Customer can download invoices and receipts

### Recurring Services
- EP-P1-RECUR-01 Create recurring_services table: frequency, start_date, end_date, customer
- EP-P1-RECUR-02 Create /api/recurring-services CRUD endpoints
- EP-P1-RECUR-03 Recurring job generation: automatic job creation based on schedule
- EP-P1-RECUR-04 Recurring service UI: create, edit, pause, cancel recurring services
- EP-P1-RECUR-05 Recurring service reminders: notify customer before scheduled service
- EP-P1-RECUR-06 Recurring billing: auto-generate invoices for recurring services

### Advanced Scheduling
- EP-P1-SCHED-01 Route optimization: group jobs by location, minimize drive time
- EP-P1-SCHED-04 Skills-based assignment: only assign jobs to qualified technicians
- EP-P1-SCHED-05 Availability management: technicians set their availability
- EP-P1-SCHED-06 Time-off requests: request and approve time-off
- EP-P1-SCHED-08 Conflict detection: prevent double-booking, overlapping jobs
- EP-P1-SCHED-10 Customer preferred technician: assign preferred tech when available

### Time Tracking
- EP-P1-TIME-01 Create time_entries table: clock in/out, breaks, job tracking
- EP-P1-TIME-02 Create /api/time-tracking endpoints: clock in, clock out, breaks
- EP-P1-TIME-03 Mobile time clock: technicians clock in from mobile
- EP-P1-TIME-04 GPS verification: verify clock-in location matches job site
- EP-P1-TIME-05 Time tracking UI: view timesheets, edit entries, approve
- EP-P1-TIME-06 Overtime calculation: automatic overtime detection and alerts
- EP-P1-TIME-07 Time tracking reports: hours worked, overtime, labor costs

### Inventory Management
- EP-P1-INV-01 Create inventory_items table: name, SKU, quantity, cost, price
- EP-P1-INV-02 Create /api/inventory CRUD endpoints
- EP-P1-INV-03 Create /inventory page: list items, add, edit, track quantities
- EP-P1-INV-04 Job inventory tracking: assign inventory to jobs, deduct from stock
- EP-P1-INV-05 Low stock alerts: notify when items below threshold

### Equipment Management
- EP-P1-EQUIP-01 Create equipment table: vehicles, tools, assigned_to, maintenance_schedule
- EP-P1-EQUIP-02 Create /api/equipment CRUD endpoints
- EP-P1-EQUIP-03 Create /equipment page: list equipment, assignments, maintenance
- EP-P1-EQUIP-04 Vehicle inspections: daily pre-trip inspection checklist
- EP-P1-EQUIP-05 Maintenance scheduling: schedule and track equipment maintenance

### Marketing & Automation
- EP-P1-MKT-01 Email campaigns: send bulk emails to customer segments
- EP-P1-MKT-02 SMS campaigns: send bulk SMS to customer segments
- EP-P1-MKT-03 Customer segmentation: group customers by tags, value, activity
- EP-P1-MKT-04 Review requests: auto-send review requests after job completion
- EP-P1-MKT-07 Referral program: track referrals, reward referrers

### Reporting & Analytics
- EP-P1-REPORT-01 Revenue reports: by service, technician, time period
- EP-P1-REPORT-02 Job completion reports: on-time %, average time
- EP-P1-REPORT-03 Customer satisfaction reports: ratings, reviews, NPS
- EP-P1-REPORT-04 Technician performance: jobs completed, revenue, customer ratings
- EP-P1-REPORT-05 Sales pipeline: leads → quotes → jobs conversion rates
- EP-P1-REPORT-06 Profitability reports: revenue vs costs per job, service, technician
- EP-P1-REPORT-08 Export reports: CSV, PDF, Excel export

### Mobile Optimization & PWA
- EP-P1-PWA-01 Configure next-pwa: add service worker, manifest.json
- EP-P1-PWA-02 Create app manifest: name, icons, colors, display mode
- EP-P1-PWA-03 Offline support: cache critical pages and data
- EP-P1-PWA-05 Push notifications: web push for job updates, messages
- EP-P1-PWA-07 Camera access: use device camera for photos (PWA capabilities)
- EP-P1-PWA-08 GPS access: access device location for check-in, routing

### Notifications System
- EP-P1-NOTIF-02 Create /api/notifications endpoints: list, mark read, preferences (route exists but verify completeness)
- EP-P1-NOTIF-03 In-app notifications: bell icon with unread count
- EP-P1-NOTIF-04 Email notifications: configurable per event type
- EP-P1-NOTIF-07 Notification preferences: users control what notifications they receive
- EP-P1-NOTIF-08 Real-time notifications: WebSocket or SSE for instant updates

### Customer Communication
- EP-P1-COMM-01 Two-way SMS: customers can reply to SMS
- EP-P1-COMM-04 Automated reminders: job reminders 24h before, payment reminders
- EP-P1-COMM-05 Communication history: view all communications with customer (timeline)
- EP-P1-COMM-06 Bulk messaging: send message to multiple customers
- EP-P1-COMM-08 Unsubscribe management: respect opt-outs, manage preferences

### Document Management
- EP-P1-DOC-01 Create documents table: type, name, file_url, related_to (job/customer)
- EP-P1-DOC-02 Document upload: attach documents to jobs, customers, employees
- EP-P1-DOC-04 Document expiry: track expiry dates, send reminders
- EP-P1-DOC-06 E-signatures: collect digital signatures on documents

### Integration & API (Public API)
- EP-P1-API-01 Create public API documentation with Swagger/OpenAPI
- EP-P1-API-02 API authentication: API keys per company
- EP-P1-API-03 API rate limiting: per API key limits
- EP-P1-API-04 Webhooks system: subscribe to events (job.created, invoice.paid, etc)
- EP-P1-API-07 Google Calendar integration: sync jobs with Google Calendar

***

## P2 - COMPETITIVE FEATURES (Advanced capabilities)

### Advanced Customer Features
- EP-P2-CUST-02 Customer custom fields: add custom fields per company needs
- EP-P2-CUST-03 Customer merge tool: combine duplicate customer records
- EP-P2-CUST-04 Customer lifetime value: automatic CLV calculation
- EP-P2-CUST-07 Property profiles: multiple properties per customer

### Job Enhancements
- EP-P2-JOB-01 Job templates: save and reuse job configurations
- EP-P2-JOB-02 Job checklists: customizable checklists per service type
- EP-P2-JOB-05 Job completion forms: digital forms for job completion
- EP-P2-JOB-06 Before/after photos: mandatory photo pairs
- EP-P2-JOB-09 Multi-day jobs: jobs spanning multiple days

### Advanced Pricing
- EP-P2-PRICE-01 Dynamic pricing: adjust prices based on demand, time, weather
- EP-P2-PRICE-02 Volume discounts: automatic discounts for multiple services (beyond current simple rule)
- EP-P2-PRICE-03 Customer-specific pricing: custom pricing per customer
- EP-P2-PRICE-04 Seasonal pricing: different prices by season
- EP-P2-PRICE-05 Package deals: bundle services at discount

### P2 Database Tables
- EP-P2-DB-01 Create job_templates table: id, company_id, name, service_type_id, default_duration, default_price, checklist_items (JSONB), instructions
- EP-P2-DB-02 Create custom_fields table: id, company_id, entity_type (customer/job/team), field_name, field_type, options (JSONB), is_required, display_order
- EP-P2-DB-03 Create custom_field_values table: entity_id, entity_type, custom_field_id, value (JSONB)
- EP-P2-DB-04 Create deposits table: id, invoice_id, amount, payment_method, paid_at, refunded_at
- EP-P2-DB-06 Create credit_notes table: id, company_id, customer_id, invoice_id, credit_note_number, amount, reason, issued_at
- EP-P2-DB-07 Create expenses table: id, company_id, category, amount, description, receipt_url, paid_by, paid_at, reimbursed
- EP-P2-DB-08 Create quality_checks table: id, job_id, checklist_items (JSONB), inspector_id, passed, notes, inspected_at
- EP-P2-DB-09 Create complaints table: id, company_id, customer_id, job_id, subject, description, status, priority, assigned_to, resolved_at
- EP-P2-DB-11 Create certifications table: id, user_id, certification_name, issued_by, issue_date, expiry_date, document_url
- EP-P2-DB-15 Create coupons table: id, company_id, code, discount_type, discount_value, min_amount, max_uses, expires_at, uses_count

### Financial (Advanced)
- EP-P2-FIN-01 Deposits: collect deposits on quotes/jobs
- EP-P2-FIN-03 Credit notes: issue credit notes for returns
- EP-P2-FIN-04 Statements: generate customer account statements
- EP-P2-FIN-05 Accounts receivable: aging reports, collection management
- EP-P2-FIN-06 Expense tracking: track business expenses
- EP-P2-FIN-07 Profit margins: track margins per job, service, customer
- EP-P2-FIN-09 Tax reports: configurable tax reporting per company tax_settings

### Quality Control
- EP-P2-QC-01 Quality checklists: customizable QC checklists
- EP-P2-QC-02 Manager approvals: require manager approval for job completion
- EP-P2-QC-05 Issue tracking: track and resolve quality issues
- EP-P2-QC-07 Quality scores: calculate quality scores per technician

### Advanced Reports
- EP-P2-REP-01 Forecasting reports: predict future demand, revenue
- EP-P2-REP-02 Cohort analysis: customer retention by cohort
- EP-P2-REP-03 Service mix analysis: which services are most profitable
- EP-P2-REP-04 Geographic analysis: revenue by territory, neighborhood
- EP-P2-REP-06 Capacity planning: predict staffing needs

### Accessibility & Compliance
- EP-P2-ACC-01 WCAG 2.1 AA accessibility audit + remediation plan

***

## P3 - FUTURE EXPANSION (Nice-to-have)

### AI & Automation
- EP-P3-AI-01 AI scheduling: machine learning for optimal scheduling
- EP-P3-AI-02 Demand forecasting: predict busy periods
- EP-P3-AI-04 Churn prediction: identify at-risk customers
- EP-P3-AI-05 Chatbot: AI customer service chatbot

### White-Label & Multi-Brand
- EP-P3-WL-01 White-label domains: custom domains per company
- EP-P3-WL-02 White-label branding: full brand customization
- EP-P3-WL-03 White-label emails: custom email domains

### Enterprise Features
- EP-P3-ENT-01 SSO (SAML/OIDC): enterprise single sign-on
- EP-P3-ENT-04 Data residency: choose data storage location

### Integrations
- EP-P3-INT-01 Zapier integration: create Zapier app for the platform
- EP-P3-INT-02 QuickBooks integration: sync invoices, customers, payments
- EP-P3-INT-03 Xero integration: accounting software sync

***

## PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Deployment Verification
- [ ] All P0 tasks complete (check list above)
- [ ] CI green: typecheck, lint, unit tests, E2E tests all passing
- [ ] Security scan complete: no high/critical vulnerabilities
- [ ] Performance tests: API response times < 200ms p95, page load < 2s
- [ ] All environment variables documented and set
- [ ] Database migrations tested on staging
- [ ] RLS policies verified: multi-tenant isolation confirmed
- [ ] Role system tested: all permission combinations work
- [ ] Backup restore tested: last successful restore within 7 days
- [ ] Monitoring configured: Sentry, uptime monitor, dashboards
- [ ] Documentation complete: API docs, deployment guide
- [ ] Legal compliance: terms, privacy policy
- [ ] Payment processing tested: Stripe test mode → production mode
- [ ] SMS/Email tested: Twilio, Resend in production mode

### Deployment Steps
1. [ ] Tag release: `git tag v1.0.0` with changelog
2. [ ] Backup production database: create manual backup before deploy
3. [ ] Deploy to staging: verify on staging environment
4. [ ] Run smoke tests on staging: critical flows work
5. [ ] Apply database migrations to production
6. [ ] Deploy code to production (Vercel)
7. [ ] Verify health endpoint: `/api/health` returns 200
8. [ ] Smoke test production: create test job, invoice, payment
9. [ ] Monitor logs for 1 hour: watch error rates, performance
10. [ ] Enable monitoring alerts: ensure alerts are active

### Post-Deployment (First 24h)
- [ ] Monitor error rates: < 0.1% error rate
- [ ] Monitor performance: API latency normal, no degradation
- [ ] Check payment processing: no failed payments
- [ ] Check SMS/email delivery: messages being delivered
- [ ] Prepare rollback plan: document rollback steps if needed
