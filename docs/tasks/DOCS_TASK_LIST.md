# Docs Task List
Generated: 2026-02-02
Scope: Tasks explicitly listed as next steps, TODO, remaining items, checklists, or plans in docs. Completed items are omitted where clearly marked done. Credentials are not repeated here.

## docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md
### P0 - Database and RLS
- EP-P0-DB-04: Enforce soft delete semantics everywhere (API + RLS).
- EP-P0-DB-05: RLS audit plus role alignment (company isolation is not enough).
### P0 - Security and auth
- EP-P0-SEC-02: Replace in-memory rate limiting with a shared production store.
- EP-P0-SEC-07: Decide and enforce registration model (self-signup vs invite-only).
### P0 - Core flows
- EP-P0-FLOW-02: Make job photo uploads work end-to-end.
- EP-P0-FLOW-03: Implement Leads API to match Sales Leads UI.
- EP-P0-FLOW-04: Finish customer rating and review workflow.
### P0 - Payments
- EP-P0-PAY-01: Harden Stripe payment flow (intent creation, webhook, idempotency, persistence).
- EP-P0-PAY-02: Define and implement a real payment ledger.
- EP-P0-PAY-03: Make manual Interac marking safe and auditable.
### P1 - Engineering
- EP-P1-ENG-01: Validate all required env vars at boot (fail fast).
- EP-P1-ENG-02: Structured logging and request IDs everywhere.
- EP-P1-ENG-03: Standardize API response format and error handling.
- EP-P1-ENG-04: CI pipeline for typecheck, lint, tests, migration sanity.
- EP-P1-ENG-05: Remove unsafe any usage and tighten validators.
- EP-P1-ENG-06: Add E2E tests for critical flows.
- EP-P1-ENG-07: Remove stale agent docs and regenerate accurate documentation.
- EP-P1-ENG-08: Create production deployment checklist.
### P1 - Authorization model
- EP-P1-AUTH-01: Redesign permission keys so technician settings do not equal company settings.
- EP-P1-AUTH-02: Field-level authorization for jobs and customers.
- EP-P1-AUTH-03: Define and enforce a job status state machine.
- EP-P1-AUTH-04: Report data-scope rules to prevent technician data leakage.
- EP-P1-AUTH-05: Align role definitions across DB, permissions, and UI.
### P1 - Dispatch and scheduling
- EP-P1-DISP-01: Implement real conflict detection and scheduling rules.
- EP-P1-DISP-02: Replace naive auto-assign with an explainable assignment algorithm.
- EP-P1-DISP-03: Build employee availability management end-to-end.
- EP-P1-DISP-04: Weather cancellation safety checks and notifications.
### P1 - Messaging
- EP-P1-MSG-01: Fix SMS send idempotency and message persistence ordering.
- EP-P1-MSG-02: Inbound SMS webhook verification, dedupe, and company mapping.
- EP-P1-MSG-03: Opt-out and consent compliance for SMS (STOP handling, quiet hours).
- EP-P1-MSG-04: Email sending requires Resend when enabled and tracks delivery.
### P1 - Storage
- EP-P1-STOR-01: Stop storing public URLs for sensitive documents.
- EP-P1-STOR-02: Add file validation and malware scanning hook.
### P2 - Feature completeness and UX
- EP-P2-PRICE-01: Connect pricing engine to job creation and invoicing.
- EP-P2-JOBS-01: Implement job_history logging everywhere.
- EP-P2-CHECK-01: Finish shift checklist workflow with structured items and photos.
- EP-P2-CUST-01: Implement customer communication timeline and connect to jobs/leads.
- EP-P2-SALES-01: Add sales territory management UI with map polygon drawing.
- EP-P2-GPS-01: Make GPS tracking production-grade.
- EP-P2-UI-01: Replace manual ID entry with searchable pickers and pagination.
- EP-P2-I18N-01: French-first UX copy and Quebec formatting.
### P3 - Product expansion
- EP-P3-SUB-01: Implement customer subscriptions.
- EP-P3-COMM-01: Automate commissions and payroll generation.
- EP-P3-OPS-01: Manager approval workflows for invoices, upsells, discounts.
- EP-P3-SESS-01: Implement session management (view and revoke active sessions).
### Minimum production checklist (unchecked)
- Supabase migrations apply cleanly on a fresh DB (CI enforced).
- RLS enabled and tested for every tenant table.

## docs/ai/codex/OPENCODE_HANDOFF_PROMPT.md
- Verify scrolling works on /dashboard.
- Verify scrolling works on /team.
- Verify scrolling works on /profile.
- Verify scrolling works on /admin/users.
- Test /team page and verify /api/users returns 200 and team members display.
- Test job creation workflow.
- Test dispatch calendar workflow.
- Test team member creation workflow.
- Test technician pages: /technician, /technician/schedule, /technician/equipment, /technician/customers, /technician/earnings, /technician/profile, /technician/map.

## docs/status/FINAL_STATUS_AND_NEXT_STEPS.md
- Kill all Node processes for a clean restart.
- Delete .next build cache.
- Run npm run dev.
- Login as admin and open /team to verify all users display.
- If /team shows 0-1 users, check browser console for errors.
- If /team shows 0-1 users, check dev server logs for SQL errors.
- If /team shows 0-1 users, adjust RLS policy as needed.
- Run Playwright test: npx playwright test tests/e2e/full-site-test.spec.ts --reporter=list
- Verify RLS helper functions exist: get_user_role and get_user_company_id.
- Verify users_read_company_admin_manager policy exists on users table.
- Test RLS helper functions directly in SQL.
- Query users as admin and verify all users return.
- If login hangs, check dev server console for errors.
- If login hangs, check browser network tab for failed requests.
- If login hangs, verify rateLimit is still disabled.
- If login hangs, clear browser cache and cookies.
- Re-enable rate limiting before production.
- Test rate limiting with rapid login attempts.
- Verify /team shows all company users before production.
- Run full Playwright test suite before production.
- Delete docs/ops/RATE_LIMIT_DISABLED.md before production.
- Remove warning from docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md before production.
- Test all 4 roles can login and see correct pages.
- Verify logout button works for all roles.

## docs/status/COMPREHENSIVE_FIX_STATUS.md
### Phase 2 page audit methodology
- Login as admin.
- Login as manager.
- Login as sales_rep.
- Login as technician.
- Visit every page accessible to each role.
- Click every button and test every form.
- Document status as Working, Partial, Broken, or Remove.
### Pages requiring detailed audit
- /dashboard
- /dispatch
- /customers
- /jobs
- /invoices
- /sales/leads
- /reports
- /team (add member button)
- /admin/users
- /sales/dashboard
- /technician
- /operations
- /notifications
- /inbox
- /sales/schedule
- /sales/earnings
- /technician/equipment
- /technician/map
- /technician/earnings
### Critical buttons to test
- /dashboard: Export, New job, Dispatch crew, Add customer, Build estimate, Export report.
- /dispatch: Auto-assign, Reassign drag-drop, View conflicts, Weather cancel, Add job.
- /customers: Add customer, Export list, Import CSV, Search, View, Edit, Delete, Blacklist.
- /jobs: Create job, Export jobs, Filter by status, Assign technician, Edit, Delete, View, Complete.
- /invoices: Create invoice, Send invoice, Mark paid, Download PDF, Export list.
- /sales/leads: Add lead, Move pipeline stage, Convert to customer, Schedule follow-up, Bulk actions.
- /team: Deactivate user, Reset password.
### Phase 3 localization tasks
- Expand lib/i18n.ts with missing translation keys for dashboard, jobs, customers, dispatch, invoices, reports, sales, technician, and common actions.
- Add keys for dashboard: dashboard.title, dashboard.welcome, dashboard.stats.*, dashboard.actions.*.
- Add keys for jobs: jobs.title, jobs.status.*, jobs.create, jobs.assign, jobs.filter.
- Add keys for customers: customers.title, customers.add, customers.export, customers.search.
- Add keys for dispatch: dispatch.title, dispatch.assign, dispatch.autoassign, dispatch.calendar.
- Add keys for invoices: invoices.title, invoices.send, invoices.markpaid, invoices.download.
- Add keys for reports: reports.title, reports.generate, reports.export, reports.filters.
- Add keys for sales: sales.leads, sales.pipeline, sales.convert, sales.followup.
- Add keys for technician: tech.schedule, tech.complete, tech.photos, tech.navigation.
- Add keys for common actions: actions.save, actions.cancel, actions.view, actions.edit, actions.delete, actions.print, actions.assign, actions.complete, actions.approve.
- Update pages to use useLanguage and t() for all UI text.
- Update BottomNavMobile labels to use translated keys.
- Localize pages: /dashboard, /dispatch, /customers, /jobs, /invoices, /reports, /sales/dashboard, /sales/leads, /technician, /technician/schedule, /technician/equipment, /admin/users.
### Phase 4 bug fix and feature completion
- Validate redirect targets on login and 2FA.
- Encrypt 2FA secrets at rest.
- Replace in-memory rate limiting with a shared store.
- Disable public registration in production or gate with invite.
- Verify Twilio webhook signatures.
- Verify Stripe webhook signatures and add idempotency.
- Make webhook handlers idempotent and dedupe events.
- Complete RLS audit for all multi-tenant tables.
- Standardize soft delete filtering (deleted_at is null).
- Add RLS write policies where missing.
- Fix job photo upload path and storage inconsistencies and enforce 8 photos.
- Finish invoice generation (multi-page PDF, correct taxes, line items, email).
- Complete subscriptions and loyalty flow end-to-end.
- Finish customer ratings public page with token and Google redirect.
- Build notifications center with preferences and delivery policies.
- Add real-time dispatch updates (WebSocket or polling).
- Implement dispatch conflict detection.
- Remove placeholder or stub UI and fake data.
- Ensure consistent API error shapes.
- Replace console logging with structured logger.
- Add loading states to async actions.
- Add success and error toasts for form submissions.
### Phase 2 success criteria
- All pages audited and documented.
- Button audit report created and filled.
- Critical workflows tested end-to-end.
- Test user can create leads, customers, jobs, and team members.
### Phase 3 success criteria
- All translation keys added to lib/i18n.ts.
- All pages use useLanguage hook.
- Language switching works on all pages.
- No English text visible when French is selected.
- BottomNavMobile labels translated.
### Phase 4 success criteria
- All critical P0 and P1 bugs fixed.
- All critical buttons functional.
- Security issues resolved.
- RLS audit complete.
- Feature completeness achieved.
### Full project completion criteria
- Phase 1 complete.
- Phase 2 complete.
- Phase 3 complete.
- Phase 4 complete.
- All tests passing (unit and E2E).
- TypeScript clean.
- Deployable to staging and production.
### Manual testing checklist
- Visit each page as admin.
- Visit each page as manager.
- Visit each page as sales_rep.
- Visit each page as technician.
- Switch language FR to EN to FR.
- Verify all text changes.
- Click every button.
- Fill every form.
- Test all dropdowns and selects.
- Check all links.
- Test mobile view at 390px width.
- Test tablet view at 768px width.
- Test scrolling behavior.
- Check for console errors.
- Verify bottom nav always has 5 tabs.
### Automated testing tasks
- Create tests/phase2-page-functionality.test.tsx.
- Create tests/phase3-localization.test.tsx.
- Create tests/phase4-button-audit.test.tsx.
- Create E2E workflow tests: create-lead, create-customer, create-job, assign-technician, complete-job, create-invoice, language-switching, mobile-responsiveness.
### Immediate steps and action items
- Run manual comprehensive test: npx tsx tests/manual-comprehensive-test.ts
- Login as admin user.
- Visit each page and click every button.
- Document findings in docs/audit/BUTTON_AUDIT_REPORT.md.
- Take screenshots of broken or non-functional features.
- Test workflows: create lead, create customer, create team member, create job, dispatch auto-assign, drag-drop, edit time, verify changes.
- Fix P0 bugs, then P1, then P2.
- Expand French translations to top 5 pages: dashboard, dispatch, customers, jobs, sales leads.
- Fix Playwright tests with correct credentials.
- Create workflow E2E tests for core features.
- Add regression tests for fixed bugs.
- Run full test suite before each commit.
- Document button audit findings.
- Test lead creation workflow.
- Test customer creation workflow.
- Test team member creation workflow.
- Fix P0 bugs identified in audit.

## docs/status/SESSION_COMPLETE_SUMMARY.md
- Fix team page 400 errors.
- Fix duplicate .content on admin users page.
- Fix duplicate .content on profile page.
- Investigate login page 404 resource.
- Optimize sales leads page load time.
- Test technician pages (dashboard, schedule, equipment, customers, earnings, profile, map).
- Test job creation workflow.
- Test dispatch functions (auto-assign, drag-drop).
- Test team member creation workflow.
- Test fixes on real devices (phone, tablet, desktop).
- Expand French translations to remaining pages.
- Complete button audit for all pages.
- Add success toasts and loading states.
- Add comprehensive E2E tests.
- Run security audit.
- Run RLS audit for all multi-tenant tables.
- Complete feature implementation.
- Performance optimization.
- Prepare for production deployment.

## docs/changes/FIXES_APPLIED_2026-02-02.md
- Verify vertical scrolling works on all pages.
- Verify /team loads without 400 errors.
- Verify /admin/users renders correctly without layout issues.
- Verify /profile renders correctly without layout issues.
- Test remaining workflows: job creation, dispatch, team member creation.
- Restart dev server to apply fixes.
- Update docs/status/COMPREHENSIVE_FIX_STATUS.md with test results.
- Track remaining known issues: sales leads timeout, job creation not tested, dispatch functions not tested, team member creation not tested, technician pages not tested.

## docs/changes/BUG_FIXES_2026_01_31.md
- Add team member search and filter on /team.
- Add team member role filter dropdown.
- Cache role in localStorage to reduce API calls.
- Add team member quick actions (edit, deactivate).
- Add team performance metrics on team page.
- Run tests before deploy: npm test, npm run typecheck, npm run lint, npm run build.
- Related backlog items: RLS audit for user_profiles table, team member invitation flow, role permission matrix UI, bulk user management.

## docs/audit/BUTTON_AUDIT_REPORT.md
### Next steps
- Run manual test script: npx tsx tests/manual-comprehensive-test.ts
- Test core workflows: create lead, create customer, create job, assign technician, complete job workflow.
- Document findings in docs/audit/BUTTON_AUDIT_REPORT.md.
- Create issues for each broken button.
- Fix P0 bugs first.
- Re-test and verify fixes.
- Update status in audit report.
### Testing priority order
- Phase 1 core workflows: Dashboard, Customers, Jobs, Dispatch, Sales Leads, Technician.
- Phase 2 supporting features: Invoices, Reports, Team, Admin Users.
- Phase 3 nice-to-have: Customers import CSV, Reports schedule email, other P2 features.
### Audit timeline tasks
- Complete dashboard testing.
- Complete customers testing.
- Complete jobs testing.
- Complete dispatch testing.
- Complete sales leads testing.
- Complete technician testing.
- Complete remaining pages.
### Interactive elements to audit
- /dashboard: Export, New Job, Dispatch Crew, Add Customer, Build Estimate, View Reports, Recent job card link, View all jobs link.
- /dispatch: Auto-Assign, Today, Previous Day, Next Day, View Conflicts, Add Job, Job card drag, Job card click, Calendar cell click.
- /customers: Add Customer, Search, Export, Import CSV, Customer row click, View, Edit, Jobs, Blacklist.
- /jobs: Create Job, Status filter, Date range picker, Export, Job row click, View, Edit, Assign Tech, Cancel Job, Complete.
- /invoices: Create Invoice, Status filter, Export, Invoice row click, View, Download PDF, Send Email, Mark Paid, Void.
- /reports: Generate Report, Report type dropdown, Date range picker, Export PDF, Export Excel, Print, Schedule Email.
- /team: Add Member, Search, Member card click, View Profile, Edit Permissions, Reset to Defaults, Save Permissions, Deactivate User.
- /settings: Profile tab, Security tab, Documents tab, Preferences tab, Save Profile, Upload Photo, Change Password, Upload Document, Language toggle, Logout, Confirm Logout, Cancel Logout.
- /sales/dashboard: New Lead, View Pipeline, Schedule Meeting, Export Leads, Lead card click.
- /sales/leads: Add Lead, Search, Pipeline stage filter, Export, Lead card click, Lead card drag, Convert to Customer, Schedule Follow-up, Mark Lost.
- /sales/settings: Territory editing, Day toggles, Save Territory, Language toggle.
- /technician: View Schedule, Start Navigation, Job card click, Start Job, Complete Job, Call Customer.
- /technician/schedule: Previous Day, Today, Next Day, Job card click, Navigate, Start Job.
- /admin/users: Create User, Search, Role filter, User row click, Edit, Reset Password, Deactivate, Activate, Save User.

## docs/audit/AUDIT_RESULTS.md
- Fix bottom navigation not visible on /dashboard.
- Fix /team page error (400 or page error).
- Fix /sales/leads page timeout and loading errors.
- Fix duplicate .content on /admin/users.
- Fix duplicate .content on /profile.
- Ensure customer creation form has name and phone fields.
- Fix create lead workflow timeout in automated test.
- Re-run audit after fixes.

## docs/testing/TESTING_CHANGES_APPLIED.md
- Restart dev server to apply new RLS policy.
- Login as admin and verify /team shows all 4 users.
- Run Playwright full-site test suite with reporter list.
- Re-enable rate limiting before production.
- Test rapid login attempts to verify rate limiting works.
- Delete docs/ops/RATE_LIMIT_DISABLED.md before production.
- Remove warning from docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md before production.

## docs/testing/TESTING_QUICKSTART.md
- Run manual comprehensive test: npx tsx tests/manual-comprehensive-test.ts
- Run automated E2E tests: npx playwright test comprehensive-site-test --headed
- Run unit tests: npm test
- Verify scrolling fix on multiple pages.
- Create a lead in /sales/leads.
- Create a customer in /customers.
- Create a team member via /team -> /admin/users.
- Create a job in /jobs.
- Test dispatch calendar: auto-assign, drag-drop, create job from empty cell, document results.
- Verify bottom nav shows exactly 5 tabs and navigation works.
- Test language toggle in /settings and verify persistence.
- Document findings in docs/audit/BUTTON_AUDIT_REPORT.md.
- Update docs/status/COMPREHENSIVE_FIX_STATUS.md with completed items.
- Ensure success criteria: all pages visited, lead/customer/team member/job created, all P0 buttons tested, audit report updated, broken features documented, next fixes identified.
- After testing: review findings, prioritize bugs, create issues/task list, fix P0 bugs, re-test, move to Phase 3.
- Watch for known issues during testing: job photo upload, invoice PDF, auto-assign algorithm, export buttons, real-time dispatch updates.

## docs/testing/TESTING_COMPLETE_RESULTS.md
- Retest bottom nav fix.
- Test lead creation form.
- Fix team page 400 errors.
- Fix duplicate .content issues (admin users, profile).
- Test remaining workflows (job creation, dispatch, team member creation).
- Test technician pages (7 remaining pages).
- Expand French translations (Phase 3).
- Optimize sales leads page performance.
- Fix login 404 resource.
- Add loading states for async actions.
- Add success toasts for actions.
- Complete button audit for all pages.
- Fix remaining P2 bugs.
- Add comprehensive E2E tests for workflows.
- Run security audit.

## docs/testing/PHASE_1_TEST_PLAN.md
### Test 1: Language toggle
- Step 1: Navigate to /settings.
- Step 2: Click Langue tab.
- Step 3: Click English button.
- Step 4: Verify UI changes to English.
- Step 5: Refresh page and verify language persists.
- Step 6: Click Francais button.
- Step 7: Verify UI returns to French.
### Test 2: Profile management
- Step 1: Navigate to /settings.
- Step 2: Verify name, email, phone, and role display.
- Step 3: Click Edit next to name.
- Step 4: Change name and save.
- Step 5: Verify success message and updated name.
- Step 6: Repeat for email and phone.
- Step 7: Upload new avatar image.
- Step 8: Verify avatar updates immediately.
### Test 3: Password change
- Step 1: Navigate to /settings.
- Step 2: Click Security tab.
- Step 3: Enter current password.
- Step 4: Enter weak password and verify strength indicator.
- Step 5: Enter medium password and verify strength indicator.
- Step 6: Enter strong password and verify strength indicator.
- Step 7: Enter confirm password (matching).
- Step 8: Click Change password.
- Step 9: Verify success message.
- Step 10: Wait 2 seconds.
- Step 11: Verify redirect to login page.
- Step 12: Login with new password.
### Test 4: Team page permission editing
- Step 1: Login as admin or manager.
- Step 2: Navigate to /team.
- Step 3: Verify all team members are listed.
- Step 4: Click Edit permissions on a technician.
- Step 5: Verify modal opens with current permissions.
- Step 6: Toggle permissions on or off.
- Step 7: Click Save.
- Step 8: Verify success message.
- Step 9: Close modal and reload page.
- Step 10: Verify Custom permissions badge appears.
- Step 11: Re-open permissions modal.
- Step 12: Click Reset to defaults.
- Step 13: Verify success message and badge disappears.
### Test 5: Admin management page
- Step 1: Login as admin.
- Step 2: Navigate to /admin/manage.
- Step 3: Generate authenticator setup and verify OTP string appears.
- Step 4: Disable two-factor and verify string disappears.
- Step 5: Toggle role permissions and click Save role access.
- Step 6: Select a team member, toggle overrides, click Save overrides.
### Test 6: Logo display
- Step 1: Navigate to a page with TopBar.
- Step 2: Verify logo.png displays correctly.
- Step 3: Verify fallback EP text appears if image fails.
### Test 7: Mobile responsiveness
- Step 1: Set viewport to 375x667.
- Step 2: Navigate to /settings, /team, /admin/manage.
- Step 3: Verify modals centered and scrollable.
- Step 4: Verify tabs horizontally scrollable.
- Step 5: Verify buttons accessible and no text overflow.
### Test 8: Error handling
- Step 1: Test profile update with invalid data (empty name, invalid email, bad phone).
- Step 2: Test password change with incorrect current password and mismatched confirmation.
- Step 3: Test permission update as non-admin and for non-existent user.
### Known issues to verify or fix
- Verify language context does not cause hydration mismatch.
- Ensure Supabase storage config supports avatar upload.
- Verify email and phone update endpoints exist and work.
### Next steps after Phase 1
- Audit all pages for English text.
- Translate remaining English text to French.
- Test complete user workflows.
- Add territory management for sales reps.
- Create Playwright test suite.
- Fix all discovered bugs.
- Run performance testing.
### Completion criteria
- All 8 tests pass.
- No console errors.
- Build succeeds with no TypeScript errors.
- Mobile responsiveness verified.
- All modals and forms function correctly.
- Language toggle works and persists.
- Avatar upload works with Supabase storage.
- Password change flow works end-to-end.
- Permission editing saves correctly.

## docs/testing/TEST_RESULTS_SUMMARY.md
- Fix company_id mismatch so all users share the same company_id.
- Add delays between parallel tests to avoid rate limiting.
- Use different test accounts for parallel tests.
- Update test selector for nav count to use .bottom-nav-item.
- Update logout button detection (add aria-label).
- Test language consistency (French vs English labels).
- Run full test suite again after fixes.

## docs/testing/MANUAL_TEST_CHECKLIST.md
- Test 1: Open /dashboard and verify vertical scrolling works.
- Test 2: Open /team and verify vertical scrolling works.
- Test 3: Open /team and check Network tab for 400 errors on /api/users and /api/company.
- Test 4: Open /admin/users and verify only one .content element exists.
- Test 5: Open /admin/users and verify vertical scrolling works.
- Test 6: Open /profile and verify only one .content element exists.
- Test 7: Open /profile and verify vertical scrolling works.
- Test 8: Open /sales/leads, verify page loads within 5 seconds, and New Lead opens form.
- Test 9: Verify bottom navigation bar is visible with 5 tabs.
- Create TEST_RESULTS.md and fill results for scrolling, API errors, duplicate .content, sales leads, bottom nav, and overall status.

## docs/phase/PHASE_1_COMPLETION_SUMMARY.md
- Audit all remaining pages for English text.
- Add missing translation keys to lib/i18n.ts.
- Update components to use useLanguage hook.
- Test language switching across all pages.
- Audit all pages for non-functional buttons.
- Fix or remove non-functional features.
- Test complete user workflows.
- Add territory management for sales reps.
- Create /admin/settings page if needed for company-wide settings.

## docs/phase/PHASE_2_IMPLEMENTATION_PLAN.md
### Objectives
- Complete French localization across all pages.
- Audit and fix all non-functional buttons.
- Remove or implement placeholder features.
- Ensure consistent UI and UX across roles.
### Part A: French localization strategy
- Audit all pages for English text.
- Add missing translation keys to lib/i18n.ts.
- Update components to use useLanguage hook.
- Test language switching across all pages.
### Pages to localize
- Admin/Manager: /dashboard, /dispatch, /customers, /team, /jobs, /invoices, /reports, /admin/users.
- Sales: /sales/dashboard, /sales/leads, /sales/schedule, /sales/earnings, /sales/settings.
- Technician: /technician, /technician/schedule, /technician/equipment, /technician/earnings, /technician/profile.
- Shared components: components/TopBar.tsx, components/BottomNavMobile.tsx, components/AppShell.tsx, components/forms/*.
### Translation keys to add
- dashboard.title, dashboard.stats.revenue, dashboard.stats.jobs, dashboard.stats.customers.
- dispatch.title, dispatch.assign, dispatch.unassigned.
- jobs.title, jobs.status.pending, jobs.status.completed.
- customers.title, customers.add.
- actions.save, actions.cancel, actions.delete, actions.edit, actions.export, actions.print.
### Part B: Button audit methodology
- Visit each page.
- Click every button.
- Document status as Working, Partial, Non-functional, or Remove.
### Buttons to audit
- Dashboard: Export, New job, Dispatch crew, Add customer, Build estimate, Export report, stat card links.
- Dispatch: Auto-assign, Reassign, View conflicts, Weather cancel, Calendar view, Add job.
- Customers: Add customer, Export list, Import CSV, Search, Filter, per-customer actions.
- Jobs: Create job, Export jobs, Filter by status, Assign technician, job actions (edit, delete, view).
- Invoices: Create invoice, Send invoice, Mark paid, Download PDF, Export list.
- Team: Add member, View profile, Edit permissions.
- Settings: Save buttons, Upload buttons, Logout button.
### Implementation steps
- Expand lib/i18n.ts with comprehensive translation keys.
- Create useTranslation helper hook (format currency and dates).
- Update each page to replace hardcoded strings with t().
- Create or update button audit report.
- Fix critical non-functional buttons (P0 first).
### Testing strategy
- Manual: visit each page as each role, switch language, click every button, test all forms and inputs.
- Automated: add phase2-localization.test.tsx and phase2-buttons.test.tsx.
### Success criteria
- All pages have French translations.
- Language toggle works on all pages.
- All critical buttons functional.
- Non-functional buttons removed or disabled with tooltips.
- Button audit report complete.
- All tests passing and TypeScript clean.
- Documentation updated.

## docs/ops/DATABASE_RESET_COMPLETE.md
- Test login with all 4 users.
- Verify RLS: users see their company data only.
- Verify technicians see only assigned jobs.
- Verify sales reps see their own leads.
- Verify admins can manage everything.
- Update login API to verify password_hash correctly.
- Enable 2FA after basic login works.
- Verify login tested via dashboard.
- Verify RLS policies tested.
- Verify 2FA flow tested.

## docs/ops/RATE_LIMIT_DISABLED.md
- Re-enable rate limiting in lib/rateLimit.ts (remove bypass and restore original code).
- Remove warning comments in rateLimit function.
- Delete docs/ops/RATE_LIMIT_DISABLED.md.
- Test login rate limiting with rapid attempts.
- Verify API endpoint rate limits work.
- Verify middleware rate limits work.

## docs/rls/RLS_SECURITY_VERIFICATION.md
- Audit all API routes to ensure requireRole or requirePermission is used.
- Test company isolation manually.
- Monitor audit logs for suspicious patterns.
- Add integration tests for multi-tenancy isolation.
- Consider tighter RLS policies with company_id checks.
- Monitor for RLS policy violations in logs.

## docs/rls/RLS_MIGRATION_SUMMARY.md
- Configure Supabase auth hook for custom access token claims.
- Apply migration 20260131200000_enable_rls_with_jwt_claims.sql.
- Run supabase/test_rls_policies.sql.
- Verify JWT claims (company_id and user_role) after login.
- Test company isolation scenarios.
- Test role-based access scenarios.
- Test technician restrictions on jobs.
- Check query performance and index usage.
- Monitor for RLS policy violations, slow queries, failed auth attempts, cross-company access attempts.

## docs/status/COMMIT_READY.md
- Run npm run typecheck.
- Run npm run lint.
- Run npm test.
- Run npm run dev.
- Manually verify scrolling fix.
- Verify scrolling fix after commit.
- Run manual test script after commit.
- Test core workflows (create lead, create customer, create team member, create job, dispatch calendar).
- Document findings in docs/audit/BUTTON_AUDIT_REPORT.md.
- Run full test suite (unit and E2E) after commit.

## docs/status/IMPLEMENTATION_SUMMARY.md
### Phase 2 objectives
- Audit pages for English text.
- Translate to French using i18n.
- Identify and fix non-functional buttons.
- Add territory management for sales reps.
- Test complete user workflows.
### Phase 3 objectives
- Create Playwright test suite.
- Test complete user journeys.
- Performance testing.
- Security audit.
- Final bug fixes.
### Known issues to address
- Verify language context hydration safety.
- Configure avatar upload storage.
- Add email change verification flow.
- Validate phone format (E.164).
### Next actions
- Run dev server.
- Test Phase 1 features in browser.
- Fix any runtime issues.
- Start Phase 2 implementation.
- Complete localization.
- Audit and fix non-functional buttons.
- Add territory management for sales.
- Test on mobile devices.
- Begin Playwright test suite.
- Complete E2E coverage.
- Security audit.
- Performance optimization.
- Documentation update.
- Prepare for production deployment.

## docs/ui/ADAPTIVE_UI_GUIDE.md
- Test adaptive UI on different devices (phone, tablet, desktop).
- Use device hooks in components where needed.
- Add custom adaptations using device CSS classes.
- Optimize features based on device capabilities.
- Test on real devices.
