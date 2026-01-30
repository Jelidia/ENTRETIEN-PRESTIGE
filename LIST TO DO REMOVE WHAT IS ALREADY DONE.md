# ENTRETIEN PRESTIGE — Master Backlog (Auto-generated)
- Generated: 2026-01-29 05:49:44
- Repo: `/mnt/data/ENTRETIEN_PRESTIGE/ENTRETIEN-PRESTIGE-main`
- Total items: **1071** (numbered list below)

## Legend
- **CONFIRMED**: Found directly by static scan (pattern-based).
- **CHECKLIST**: Best-practice / spec-driven requirement to verify or implement; may not be a bug but is something you should review for production readiness.

## Counts by priority
- **P0**: 81
- **P1**: 84
- **P2**: 798
- **P3**: 108

## Notes on coverage
- This is a static analysis + repository checklist. It *does not* execute the app, so runtime-only issues may still exist.
- Many items are deliberately granular (per route, per page, per table) to match your request for “everything”.

# P0 Items

# P1 Items

## API-Audit

## API-Idempotency

## API-RateLimit

## API-Security

## API-Tenancy

## API-Validation

## Config

## DB-RLS

## UI-Security

# P2 Items

## API

## API-Design

## API-RateLimit

## API-Reliability
537. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/access ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/access/route.ts`
538. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/reset-password ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/admin/reset-password/route.ts`
539. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/seed-users ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/admin/seed-users/route.ts`
540. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/seed ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/admin/seed/route.ts`
541. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/users/[user_id]/reset-password ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/admin/users/[user_id]/reset-password/route.ts`
542. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/users/[user_id] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/admin/users/[user_id]/route.ts`
543. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/users ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/admin/users/route.ts`
544. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/change-password ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/change-password/route.ts`
545. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/disable-2fa ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/disable-2fa/route.ts`
546. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/forgot-password ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/forgot-password/route.ts`
547. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/login ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/login/route.ts`
548. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/logout ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/logout/route.ts`
549. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/refresh-token ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/refresh-token/route.ts`
550. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/register ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/register/route.ts`
551. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/reset-password ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/reset-password/route.ts`
552. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/setup-2fa ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/setup-2fa/route.ts`
553. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/verify-2fa ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/auth/verify-2fa/route.ts`
554. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/company ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/company/route.ts`
555. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/customers/[id]/[action] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/customers/[id]/[action]/route.ts`
556. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/customers/[id] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/customers/[id]/route.ts`
557. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/customers ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/customers/route.ts`
558. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/debug/session ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/debug/session/route.ts`
559. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/dispatch/[action] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/dispatch/[action]/route.ts`
560. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/dispatch/calendar ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/dispatch/calendar/route.ts`
561. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/dispatch/technician/[id] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/dispatch/technician/[id]/route.ts`
562. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/documents ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/documents/route.ts`
563. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/email/[action] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/email/[action]/route.ts`
564. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/gps/[action] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/gps/[action]/route.ts`
565. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/gps/geofence/[id] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/gps/geofence/[id]/route.ts`
566. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/gps/technician/[id] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/gps/technician/[id]/route.ts`
567. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/health ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/health/route.ts`
568. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/invoices/[id]/[action] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/invoices/[id]/[action]/route.ts`
569. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/invoices/[id] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/invoices/[id]/route.ts`
570. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/invoices ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/invoices/route.ts`
571. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/[id]/[action] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/jobs/[id]/[action]/route.ts`
572. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/[id]/photos ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/jobs/[id]/photos/route.ts`
573. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/[id] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/jobs/[id]/route.ts`
574. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/export ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/jobs/export/route.ts`
575. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/jobs/route.ts`
576. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/maps/[action] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/maps/[action]/route.ts`
577. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/notifications/[id]/read ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/notifications/[id]/read/route.ts`
578. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/notifications ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/notifications/route.ts`
579. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/notifications/settings ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/notifications/settings/route.ts`
580. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/payments/[action] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/payments/[action]/route.ts`
581. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/ratings/submit ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/ratings/submit/route.ts`
582. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/ratings/validate ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/ratings/validate/route.ts`
583. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/reports/[type] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/reports/[type]/route.ts`
584. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/sales/dashboard ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/sales/dashboard/route.ts`
585. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/settings/document ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/settings/document/route.ts`
586. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/settings/password ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/settings/password/route.ts`
587. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/settings/profile ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/settings/profile/route.ts`
588. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/settings/upload ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/settings/upload/route.ts`
589. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/[action] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/sms/[action]/route.ts`
590. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/inbox/[threadId]/read ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/sms/inbox/[threadId]/read/route.ts`
591. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/inbox/[threadId] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/sms/inbox/[threadId]/route.ts`
592. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/inbox ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/sms/inbox/route.ts`
593. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/triggers ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/sms/triggers/route.ts`
594. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/uploads ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/uploads/route.ts`
595. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/users/[id]/availability ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/users/[id]/availability/route.ts`
596. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/users/[id] ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/users/[id]/route.ts`
597. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/users/me ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/users/me/route.ts`
598. **[P2][API-Reliability][ADD][CHECKLIST]** [CHECKLIST] /api/users ensure consistent error mapping (400/401/403/404/409/429/500) and no raw error leaks. — `app/api/users/route.ts`

## API-Validation
599. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/admin/reset-password validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/admin/reset-password/route.ts`
600. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/admin/seed validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/admin/seed/route.ts`
601. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/admin/users/[user_id]/reset-password validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/admin/users/[user_id]/reset-password/route.ts`
602. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/admin/users/[user_id] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/admin/users/[user_id]/route.ts`
603. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/admin/users validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/admin/users/route.ts`
604. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/auth/change-password validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/auth/change-password/route.ts`
605. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/auth/forgot-password validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/auth/forgot-password/route.ts`
606. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/auth/login validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/auth/login/route.ts`
607. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/auth/register validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/auth/register/route.ts`
608. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/auth/reset-password validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/auth/reset-password/route.ts`
609. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/auth/verify-2fa validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/auth/verify-2fa/route.ts`
610. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/company validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/company/route.ts`
611. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/customers/[id]/[action] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/customers/[id]/[action]/route.ts`
612. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/customers/[id] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/customers/[id]/route.ts`
613. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/customers validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/customers/route.ts`
614. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/dispatch/[action] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/dispatch/[action]/route.ts`
615. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/email/[action] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/email/[action]/route.ts`
616. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/gps/[action] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/gps/[action]/route.ts`
617. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/invoices/[id]/[action] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/invoices/[id]/[action]/route.ts`
618. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/invoices/[id] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/invoices/[id]/route.ts`
619. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/invoices validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/invoices/route.ts`
620. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/jobs/[id]/[action] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/jobs/[id]/[action]/route.ts`
621. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/jobs/[id]/photos validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/jobs/[id]/photos/route.ts`
622. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/jobs/[id] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/jobs/[id]/route.ts`
623. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/jobs validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/jobs/route.ts`
624. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/notifications/settings validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/notifications/settings/route.ts`
625. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/payments/[action] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/payments/[action]/route.ts`
626. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/ratings/submit validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/ratings/submit/route.ts`
627. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/reports/[type] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/reports/[type]/route.ts`
628. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/settings/password validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/settings/password/route.ts`
629. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/settings/profile validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/settings/profile/route.ts`
630. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/sms/[action] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/sms/[action]/route.ts`
631. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/users/[id]/availability validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/users/[id]/availability/route.ts`
632. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/users/[id] validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/users/[id]/route.ts`
633. **[P2][API-Validation][VERIFY][CHECKLIST]** [CHECKLIST] /api/users validate inputs (body/query/path) with zod; reject invalid UUIDs/phones/dates. — `app/api/users/route.ts`

## CodeQuality
634. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### `/agent bug-hunter` — `.claude-plugin/README.md:78`
635. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: **Bug investigation and fixing** — `.claude-plugin/README.md:79`
636. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Reproduces the bug — `.claude-plugin/README.md:80`
637. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: Use the bug-hunter agent to investigate why the sales dashboard shows 0 for revenue — `.claude-plugin/README.md:87`
638. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### `/bug-fixer` — `.claude-plugin/README.md:139`
639. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: /bug-fixer Fix: admin dashboard shows fake data — `.claude-plugin/README.md:143`
640. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - 🔐 Check for missing authentication in API routes — `.claude-plugin/README.md:214`
641. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "longDescription": "This plugin provides a comprehensive development environment for the Entretien Prestige project, including specialized agents for feature development, database architecture, testin — `.claude-plugin/marketplace.json:6`
642. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "description": "Feature builder, database architect, QA engineer, bug hunter, deploy manager, code reviewer" — `.claude-plugin/marketplace.json:69`
643. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "name": "bug-hunter", — `.claude-plugin/plugin.json:48`
644. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "path": "./agents/bug-hunter.md", — `.claude-plugin/plugin.json:49`
645. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "description": "Bug investigation and minimal fixes" — `.claude-plugin/plugin.json:50`
646. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "name": "bug-fixer", — `.claude-plugin/plugin.json:80`
647. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "path": "./skills/bug-fixer/SKILL.md", — `.claude-plugin/plugin.json:81`
648. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | `bug-hunter` | Bug investigation & fixing | Medium | 5-15 min | — `.claude/AGENTS_GUIDE.md:28`
649. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### 4. 🔍 Bug Hunter — `.claude/AGENTS_GUIDE.md:163`
650. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: **Purpose:** Bug investigation, root cause analysis, and fixing — `.claude/AGENTS_GUIDE.md:165`
651. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 1. ✅ Reproduces the bug — `.claude/AGENTS_GUIDE.md:175`
652. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "Use bug-hunter to investigate why techs can see jobs from other companies" — `.claude/AGENTS_GUIDE.md:185`
653. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Fixing a Complex Bug: — `.claude/AGENTS_GUIDE.md:295`
654. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "Use bug-hunter to find out why SMS messages aren't being sent to customers" — `.claude/AGENTS_GUIDE.md:299`
655. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Use bug-hunter → qa-engineer — `.claude/AGENTS_GUIDE.md:340`
656. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | Fix one bug | **Skill** (`/bug-fixer`) | Quick fix | — `.claude/AGENTS_GUIDE.md:364`
657. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | Investigate complex bug | **Agent** (`bug-hunter`) | Root cause analysis | — `.claude/AGENTS_GUIDE.md:365`
658. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ├── bug-hunter.md — `.claude/AGENTS_GUIDE.md:379`
659. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 4. **bug-hunter.md** - Bug investigation and minimal fixes — `.claude/IMPLEMENTATION_COMPLETE.md:41`
660. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Skills: bug-fixer, test-generator — `.claude/IMPLEMENTATION_COMPLETE.md:43`
661. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Hooks: Verify bug fix, warn if too many files changed — `.claude/IMPLEMENTATION_COMPLETE.md:44`
662. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 4. **bug-fixer** - Debug and fix bugs — `.claude/IMPLEMENTATION_COMPLETE.md:77`
663. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "claude:fix-bug": "Attempt to fix bug", — `.claude/IMPLEMENTATION_COMPLETE.md:198`
664. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: │   ├── bug-hunter.md          ✅ UPGRADED — `.claude/IMPLEMENTATION_COMPLETE.md:297`
665. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: │   ├── bug-fixer/SKILL.md             ✅ UPGRADED — `.claude/IMPLEMENTATION_COMPLETE.md:304`
666. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Fix a Bug — `.claude/IMPLEMENTATION_COMPLETE.md:490`
667. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: npm run claude:fix-bug "Dashboard shows 0 for revenue" — `.claude/IMPLEMENTATION_COMPLETE.md:493`
668. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: # Then: "Use the bug-hunter agent to investigate why dashboard shows 0 revenue" — `.claude/IMPLEMENTATION_COMPLETE.md:497`
669. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: │   ├── bug-fixer/ — `.claude/README.md:21`
670. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: │   ├── bug-hunter.md — `.claude/README.md:34`
671. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "Use the bug-hunter agent to investigate [issue]" — `.claude/README.md:55`
672. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 8. **bug-fixer** - Quick bug fixes — `.claude/README.md:87`
673. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 4. **bug-hunter** - Bug investigation & fixing — `.claude/README.md:105`
674. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Fixing a Bug: — `.claude/README.md:123`
675. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 1. `bug-hunter` agent → Investigate & fix — `.claude/README.md:124`
676. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 5. Try a simple agent - "Use bug-hunter to check for missing RLS policies" — `.claude/README.md:155`
677. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 8. ✅ `bug-fixer` - Quick bug fixes — `.claude/SETUP_COMPLETE.md:26`
678. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 4. ✅ `bug-hunter` - Bug investigation & fixing — `.claude/SETUP_COMPLETE.md:38`
679. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "Use the bug-hunter agent to check for any missing company_id filters in queries" — `.claude/SETUP_COMPLETE.md:70`
680. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: # Investigate bug — `.claude/SETUP_COMPLETE.md:104`
681. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "Use the bug-hunter agent to find out why customers are seeing jobs from other companies" — `.claude/SETUP_COMPLETE.md:105`
682. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Workflow 2: Fix Bug — `.claude/SETUP_COMPLETE.md:136`
683. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 1. "Use bug-hunter to investigate why SMS isn't sending" — `.claude/SETUP_COMPLETE.md:138`
684. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 3. /docs-updater Update docs: fixed SMS bug — `.claude/SETUP_COMPLETE.md:144`
685. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 2. ✅ Use `bug-hunter` to investigate a small issue — `.claude/SETUP_COMPLETE.md:189`
686. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | `bug-fixer` | Debug and fix bugs | 404 errors, broken features, fake data | — `.claude/SKILLS_GUIDE.md:15`
687. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### 2. bug-fixer — `.claude/SKILLS_GUIDE.md:64`
688. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: /bug-fixer Fix: admin dashboard shows fake data - replace with real queries — `.claude/SKILLS_GUIDE.md:75`
689. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Analysis of the bug — `.claude/SKILLS_GUIDE.md:79`
690. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Lists what matches (✅), what's missing (⚠️), what's wrong (❌) — `.claude/SKILLS_GUIDE.md:90`
691. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - List of missing/incorrect features — `.claude/SKILLS_GUIDE.md:100`
692. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Fixing a Bug: — `.claude/SKILLS_GUIDE.md:280`
693. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 1. **Identify the bug** (user report or testing) — `.claude/SKILLS_GUIDE.md:282`
694. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 2. **Use bug-fixer:** — `.claude/SKILLS_GUIDE.md:283`
695. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: /bug-fixer Fix: dashboard shows wrong revenue numbers — `.claude/SKILLS_GUIDE.md:285`
696. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ├── bug-fixer/SKILL.md — `.claude/SKILLS_GUIDE.md:322`
697. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: name: bug-hunter — `.claude/agents/bug-hunter.md:2`
698. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: description: Bug investigation, root cause analysis, and minimal fixing. Creates regression tests to prevent recurrence. — `.claude/agents/bug-hunter.md:3`
699. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - bug-fixer — `.claude/agents/bug-hunter.md:16`
700. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: script: !`.claude/hooks/verify-bug-fix.sh` — `.claude/agents/bug-hunter.md:21`
701. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: message: "Bug fix should be minimal. You're changing too many files. Focus on root cause only." — `.claude/agents/bug-hunter.md:25`
702. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: # Bug Hunter Agent — `.claude/agents/bug-hunter.md:31`
703. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: **Purpose:** Bug investigation, root cause analysis, and fixing — `.claude/agents/bug-hunter.md:33`
704. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 1. Reproduces the bug — `.claude/agents/bug-hunter.md:46`
705. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "Use the bug-hunter agent to investigate why the sales dashboard shows 0 for revenue even though there are completed jobs" — `.claude/agents/bug-hunter.md:57`
706. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Identifies incorrect queries, missing filters, wrong calculations — `.claude/agents/bug-hunter.md:64`
707. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Can use bug-fixer skill — `.claude/agents/bug-hunter.md:65`
708. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Verification that bug is fixed — `.claude/agents/bug-hunter.md:72`
709. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Can invoke /bug-fixer skill — `.claude/agents/bug-hunter.md:78`
710. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - ✅ No TODOs or FIXME comments in critical code — `.claude/agents/deploy-manager.md:94`
711. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: echo "❌ Missing: $file" — `.claude/hooks/project-setup.sh:39`
712. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: echo "   /agent bug-hunter         - Debug & fix" — `.claude/hooks/session-start.sh:20`
713. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: echo "❌ Missing authentication check (requireUser/requireRole/requirePermission)" — `.claude/hooks/validate-api-route.sh:12`
714. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: echo "❌ Missing Zod validation (use .safeParse())" — `.claude/hooks/validate-api-route.sh:19`
715. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: echo "❌ Missing NextResponse import" — `.claude/hooks/validate-api-route.sh:36`
716. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: echo "❌ No SQL statements detected (missing semicolons?)" — `.claude/hooks/validate-migration.sh:44`
717. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: echo "⚠️ Missing max-width constraint (should be 640px)" — `.claude/hooks/validate-ui-component.sh:12`
718. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ❌ CRITICAL: Missing authentication check in /api/admin/users — `.claude/output-styles/code-review.md:41`
719. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ⚠️ WARNING: Query missing company_id filter — `.claude/output-styles/code-review.md:46`
720. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ⚠️ Missing validation schema — `.claude/output-styles/code-review.md:65`
721. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: Missing: Holiday pricing branch not tested — `.claude/output-styles/code-review.md:119`
722. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ❌ Spec violation: Missing required field — `.claude/output-styles/code-review.md:140`
723. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ⚠️ Missing index — `.claude/output-styles/code-review.md:169`
724. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ❌ Missing max-width — `.claude/output-styles/code-review.md:219`
725. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Missing authentication — `.claude/output-styles/code-review.md:271`
726. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Data leaks (missing company_id filter) — `.claude/output-styles/code-review.md:272`
727. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Missing validation — `.claude/output-styles/code-review.md:280`
728. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Missing tests (non-critical paths) — `.claude/output-styles/code-review.md:283`
729. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ✅ Good: "The query is missing company_id filtering, which could leak data across companies. Add .eq('company_id', profile.company_id) to fix." — `.claude/output-styles/code-review.md:341`
730. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Security: ⚠️ (Missing company_id filter) — `.claude/output-styles/code-review.md:374`
731. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ⚠️ **Query missing company_id filter on commissions** — `.claude/output-styles/code-review.md:398`
732. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - NO TODO comments without implementation — `.claude/output-styles/production-ready.md:14`
733. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: CREATE TABLE new_table (...); -- Missing RLS! — `.claude/output-styles/production-ready.md:243`
734. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - ✅ No TODO comments — `.claude/output-styles/production-ready.md:342`
735. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: // ❌ TODO without implementation — `.claude/output-styles/production-ready.md:363`
736. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: // TODO: Implement this later — `.claude/output-styles/production-ready.md:364`
737. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "message": "⚠️ API route missing authentication. Add requireUser() or requireRole()." — `.claude/settings.json:19`
738. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: name: bug-fixer — `.claude/skills/bug-fixer/SKILL.md:2`
739. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: argument-hint: "Bug description (e.g., 'Fix: admin dashboard shows fake data')" — `.claude/skills/bug-fixer/SKILL.md:4`
740. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: agent: bug-hunter — `.claude/skills/bug-fixer/SKILL.md:14`
741. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: # bug-fixer Skill — `.claude/skills/bug-fixer/SKILL.md:24`
742. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: `/bug-fixer Fix: admin dashboard shows fake data - replace with real Supabase queries` — `.claude/skills/bug-fixer/SKILL.md:31`
743. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 1. Analyzes the bug — `.claude/skills/bug-fixer/SKILL.md:34`
744. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 3. Lists what matches (✅), what's missing (⚠️), what's wrong (❌) — `.claude/skills/spec-enforcer/SKILL.md:36`
745. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - **bug-fixer** - Fixing ANY bug (404s, type errors, broken features, fake data) — `.claude/system-prompt.txt:19`
746. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - **bug-hunter** - Complex bug investigation (root cause analysis, fix verification) — `.claude/system-prompt.txt:38`
747. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ❌ **WRONG** - User asks "Fix the navigation bug where multiple tabs are active" — `.claude/system-prompt.txt:74`
748. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ✅ **CORRECT** - User asks "Fix the navigation bug where multiple tabs are active" — `.claude/system-prompt.txt:79`
749. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: [Immediately invokes bug-fixer skill] — `.claude/system-prompt.txt:81`
750. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - **NO shortcuts EVER** - No "TODO", no "FIXME", no "temporary" solutions — `.claude/system-prompt.txt:88`
751. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: **Available Skills:** api-builder, bug-fixer, spec-enforcer, test-generator, ui-builder, migration-builder, french-ui-helper, rls-policy-builder, supabase-query-builder, docs-updater — `CLAUDE.md:25`
752. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: **Available Agents:** feature-builder, database-architect, qa-engineer, bug-hunter, deploy-manager, code-reviewer — `CLAUDE.md:39`
753. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - User: "Fix navigation bug" → You manually debug — `CLAUDE.md:48`
754. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - User: "Fix navigation bug" → Invoke **bug-fixer** skill — `CLAUDE.md:53`
755. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | **bug-fixer** | Fixing ANY bug or error | "Fix the bug where...", "Debug the issue...", "The feature is broken..." | — `CLAUDE.md:634`
756. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | **bug-hunter** | Complex bug investigation | "Investigate why...", "Root cause analysis for...", "Debug complex issue..." | — `CLAUDE.md:659`
757. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | Fix navigation bug | 20,000 tokens (investigate + fix) | 3,000 tokens (bug-fixer workflow) | **85%** | — `CLAUDE.md:682`
758. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - **NO shortcuts** - No "TODO", no "FIXME", no "we'll fix this later" — `CLAUDE.md:697`
759. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: **Why this matters:** Technical debt compounds. A "quick fix" today becomes a production bug tomorrow. Write it right the first time. — `CLAUDE.md:703`
760. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 1. Missing `@/` path alias (check `tsconfig.json`) — `CLAUDE.md:960`
761. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 3. Missing type imports from `@/lib/types` — `CLAUDE.md:962`
762. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Fixed bottom navigation styling bug (only 1 tab active at a time) — `CLAUDE.md:1024`
763. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | **bug-fixer** | Debug and fix bugs including 404 errors, fake data, broken features, and type errors. Finds root cause and makes minimal fixes. | ANY bug report, error, or broken functionality | 80- — `CLAUDE.md:1084`
764. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: Skill({ skill: "bug-fixer", args: "Navigation shows multiple active tabs" }) — `CLAUDE.md:1099`
765. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | **bug-hunter** | Bug investigation, root cause analysis, and fixing. Deep dives into complex issues and provides minimal, targeted fixes. | Complex bugs, mysterious errors, multi-file issues | Inves — `CLAUDE.md:1133`
766. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: "Use the bug-hunter agent to investigate the RLS policy error" — `CLAUDE.md:1142`
767. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | "Fix navigation bug" | ⚠️ MAYBE | Use bug-fixer skill first | Single bug = skill; complex issue = bug-hunter agent | — `CLAUDE.md:1151`
768. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 6. **IF task includes "investigate", "root cause", "complex bug" → MUST use bug-hunter** — `CLAUDE.md:1193`
769. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - **bug-hunter** - Bug investigation and minimal fixes — `CLAUDE.md:1207`
770. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - **bug-fixer** - Debug and fix bugs with minimal changes — `CLAUDE.md:1218`
771. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Check for missing authentication in API routes — `CLAUDE.md:1246`
772. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: /bug-fixer Fix navigation not showing for managers — `CLAUDE.md:1310`
773. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: npm run claude:fix-bug "Dashboard shows 0 for revenue" — `CLAUDE.md:1316`
774. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: **Missing:** — `CODE_ANALYSIS_REPORT.md:66`
775. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### ❌ MISSING IMPLEMENTATIONS (30-40%) — `CODE_ANALYSIS_REPORT.md:126`
776. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | PhotoUpload | ❌ | **MISSING** | — `CODE_ANALYSIS_REPORT.md:208`
777. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | AvailabilityGrid | ❌ | **MISSING** | — `CODE_ANALYSIS_REPORT.md:209`
778. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Bug #1: Sales Dashboard (HIGH PRIORITY) — `CODE_ANALYSIS_REPORT.md:217`
779. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Bug #2: Admin Dashboard Mock Data (HIGH PRIORITY) — `CODE_ANALYSIS_REPORT.md:225`
780. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Bug #3: PDF Generation Incomplete (MEDIUM PRIORITY) — `CODE_ANALYSIS_REPORT.md:233`
781. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Bug #4: Missing Photo Upload (MEDIUM PRIORITY) — `CODE_ANALYSIS_REPORT.md:241`
782. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Bug #5: Missing Rating Page (MEDIUM PRIORITY) — `CODE_ANALYSIS_REPORT.md:249`
783. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: | API Routes | "90%" | 85% (1 missing) | — `CODE_ANALYSIS_REPORT.md:268`
784. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Complete notification matrix — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:714`
785. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Complete message templates — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:731`
786. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Complete job state machine — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:760`
787. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Granular permissions per role — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:784`
788. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Exact calculation rules — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:807`
789. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Exact invoice layout — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:830`
790. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Search specifications — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:850`
791. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Photo/file requirements — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:871`
792. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Offline mode specifications — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:892`
793. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Error scenarios — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:914`
794. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: API integration specifics — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:932`
795. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: SLA specifications — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:964`
796. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: 2FA process step-by-step — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:988`
797. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: How new customers are added — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1016`
798. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Step-by-step payment process — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1044`
799. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Exact tax formulas — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1079`
800. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Complete French translations — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1102`
801. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Accessibility checklist — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1122`
802. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: QA checklist — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1150`
803. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: MISSING: Observability setup — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1184`
804. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: claude --mcp file-search search "TODO" --caseSensitive — `MCP_SETUP.md:138`
805. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - 🤖 6 Specialized Agents (feature-builder, database-architect, qa-engineer, bug-hunter, deploy-manager, code-reviewer) — `README.md:29`
806. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: **BROKEN/MISSING:** — `READY_TO_DEPLOY.md:166`
807. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Returns completion status and missing photos — `READY_TO_DEPLOY.md:282`
808. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Auto-advances to next missing photo — `READY_TO_DEPLOY.md:286`
809. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: **Database Ready, UI/API Missing:** — `READY_TO_DEPLOY.md:330`
810. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Returns completion status and missing photos — `READY_TO_DEPLOY.md:362`
811. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Auto-advances to next missing photo — `READY_TO_DEPLOY.md:366`
812. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 4. ✅ **Bottom navigation styling bug** - Fixed active tab detection — `READY_TO_DEPLOY.md:407`
813. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: - Console.warn() when services skip due to missing credentials — `READY_TO_DEPLOY.md:579`
814. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: 2. Missing dependency — `TROUBLESHOOTING.md:319`
815. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: setStatus("Preview updated (not saved). Missing technician ID."); — `app/(app)/dispatch/page.tsx:155`
816. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: return NextResponse.json({ error: "Missing refresh token" }, { status: 401 }); — `app/api/auth/refresh-token/route.ts:8`
817. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: return NextResponse.json({ error: "Missing document request" }, { status: 400 }); — `app/api/documents/route.ts:24`
818. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: return NextResponse.json({ error: "Document missing" }, { status: 404 }); — `app/api/documents/route.ts:46`
819. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: const missing = requiredPhotos — `app/api/jobs/[id]/photos/route.ts:53`
820. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: complete: missing.length === 0, — `app/api/jobs/[id]/photos/route.ts:59`
821. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: missing, — `app/api/jobs/[id]/photos/route.ts:60`
822. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: { error: "Missing photo_id parameter" }, — `app/api/jobs/[id]/photos/route.ts:188`
823. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: return NextResponse.json({ error: "Missing notification id" }, { status: 400 }); — `app/api/notifications/route.ts:35`
824. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: { error: "Missing event or jobId" }, — `app/api/sms/triggers/route.ts:23`
825. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: const [missing, setMissing] = useState<Array<{ photo_type: PhotoType; side: PhotoSide }>>([]); — `components/JobPhotoUpload.tsx:39`
826. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: setMissing(data.missing ?? []); — `components/JobPhotoUpload.tsx:63`
827. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: // Auto-advance to next missing photo — `components/JobPhotoUpload.tsx:127`
828. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: if (missing.length > 0) { — `components/JobPhotoUpload.tsx:128`
829. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: const nextMissing = missing[0]; — `components/JobPhotoUpload.tsx:129`
830. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: Photos manquantes: {missing.length}/8 — `components/JobPhotoUpload.tsx:192`
831. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: setError("Missing verification context."); — `components/auth/VerifyTwoFactorForm.tsx:21`
832. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Bug #1: Infinite Loop Crash 💥 — `db/CRITICAL_FIXES_README.md:11`
833. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Bug #2: Zombie Accounts 🧟 — `db/CRITICAL_FIXES_README.md:45`
834. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: ### Bug #3: Orphaned Users 👻 — `db/CRITICAL_FIXES_README.md:71`
835. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: -- CRITICAL BUG FIXES - DO NOT SKIP THIS MIGRATION — `db/migrations/20260126_fix_critical_security_bugs.sql:2`
836. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: -- 2. Soft delete bug (prevents email/phone reuse) — `db/migrations/20260126_fix_critical_security_bugs.sql:6`
837. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: -- 3. Orphaned user risk (missing auth.users FK) — `db/migrations/20260126_fix_critical_security_bugs.sql:7`
838. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: -- FIX #1: INFINITE LOOP BUG - Create Security Definer Function — `db/migrations/20260126_fix_critical_security_bugs.sql:14`
839. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: -- FIX #2: ZOMBIE ACCOUNT BUG - Fix Soft Delete Constraints — `db/migrations/20260126_fix_critical_security_bugs.sql:78`
840. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: return { response: NextResponse.json({ error: "Profile missing", details }, { status: 403 }) }; — `lib/auth.ts:72`
841. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: // TODO: Paste Google Maps API key in .env.local when ready. — `lib/maps.ts:7`
842. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: // TODO: Paste Resend API key in .env.local when ready. — `lib/resend.ts:9`
843. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: // TODO: Paste Stripe key in .env.local when ready. — `lib/stripe.ts:30`
844. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: // TODO: Paste Twilio credentials in .env.local when ready. — `lib/twilio.ts:13`
845. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: it("returns zeros when data is missing", () => { — `tests/dashboardMetrics.test.ts:63`
846. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: it("uses fallbacks for missing schedule details", () => { — `tests/dashboardMetrics.test.ts:83`
847. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: it("falls back to unknown when missing", () => { — `tests/rateLimit.test.ts:40`
848. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: it("computes rank when missing and uses client fallback", () => { — `tests/salesDashboard.test.ts:105`
849. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: it("renders jobs and GPS off state when geolocation is missing", async () => { — `tests/technicianDashboard.test.tsx:126`
850. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: it("uses the default GPS error when missing", async () => { — `tests/technicianMap.test.tsx:134`
851. **[P2][CodeQuality][FIX][CONFIRMED]** Todo marker: it("keeps loading when google maps is missing after script load", async () => { — `tests/technicianMap.test.tsx:178`

## DB-Integrity
852. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'auth_challenges' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
853. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'companies' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
854. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'customer_blacklist' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
855. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'customer_communication' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
856. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'customer_ratings' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
857. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'customer_subscriptions' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
858. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'customers' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
859. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'employee_availability' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
860. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'employee_commissions' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
861. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'equipment_checklist_templates' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
862. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'geofences' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
863. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'google_review_bonuses' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
864. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'gps_locations' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
865. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'incidents' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
866. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'invoices' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
867. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'job_assignments' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
868. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'job_history' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
869. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'job_photos' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
870. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'job_quality_issues' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
871. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'job_rework' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
872. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'job_upsells' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
873. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'jobs' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
874. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'leaderboard' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
875. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'leads' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
876. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'loyalty_points' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
877. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'loyalty_transactions' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
878. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'notifications' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
879. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'onboarding_progress' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
880. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'payroll_statements' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
881. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'referrals' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
882. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'sales_territories' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
883. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'shift_checklists' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
884. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'sms_messages' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
885. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'technician_location_daily' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
886. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'termination_records' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
887. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'upsell_items' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
888. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'user_audit_log' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
889. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'user_sessions' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`
890. **[P2][DB-Integrity][VERIFY][CHECKLIST]** [CHECKLIST] Table 'users' verify FK constraints, NOT NULLs, enums/check constraints for statuses. — `db/*`

## DB-Performance
891. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'auth_challenges' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
892. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'companies' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
893. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'customer_blacklist' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
894. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'customer_communication' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
895. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'customer_ratings' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
896. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'customer_subscriptions' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
897. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'customers' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
898. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'employee_availability' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
899. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'employee_commissions' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
900. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'equipment_checklist_templates' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
901. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'geofences' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
902. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'google_review_bonuses' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
903. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'gps_locations' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
904. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'incidents' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
905. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'invoices' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
906. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'job_assignments' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
907. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'job_history' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
908. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'job_photos' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
909. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'job_quality_issues' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
910. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'job_rework' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
911. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'job_upsells' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
912. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'jobs' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
913. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'leaderboard' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
914. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'leads' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
915. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'loyalty_points' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
916. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'loyalty_transactions' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
917. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'notifications' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
918. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'onboarding_progress' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
919. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'payroll_statements' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
920. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'referrals' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
921. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'sales_territories' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
922. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'shift_checklists' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
923. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'sms_messages' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
924. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'technician_location_daily' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
925. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'termination_records' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
926. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'upsell_items' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
927. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'user_audit_log' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
928. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'user_sessions' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`
929. **[P2][DB-Performance][ADD][CHECKLIST]** [CHECKLIST] Table 'users' ensure indexes exist for frequent filters (company_id, created_at, status, foreign keys). — `db/*`

## DB-SoftDelete
930. **[P2][DB-SoftDelete][VERIFY][CHECKLIST]** [CHECKLIST] Table 'companies' has deleted_at; ensure all queries filter and add indexes if needed. — `db/*`
931. **[P2][DB-SoftDelete][VERIFY][CHECKLIST]** [CHECKLIST] Table 'customers' has deleted_at; ensure all queries filter and add indexes if needed. — `db/*`
932. **[P2][DB-SoftDelete][VERIFY][CHECKLIST]** [CHECKLIST] Table 'equipment_checklist_templates' has deleted_at; ensure all queries filter and add indexes if needed. — `db/*`
933. **[P2][DB-SoftDelete][VERIFY][CHECKLIST]** [CHECKLIST] Table 'jobs' has deleted_at; ensure all queries filter and add indexes if needed. — `db/*`
934. **[P2][DB-SoftDelete][VERIFY][CHECKLIST]** [CHECKLIST] Table 'upsell_items' has deleted_at; ensure all queries filter and add indexes if needed. — `db/*`
935. **[P2][DB-SoftDelete][VERIFY][CHECKLIST]** [CHECKLIST] Table 'users' has deleted_at; ensure all queries filter and add indexes if needed. — `db/*`

## Observability
936. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/access add structured logs + request_id + timing; redact PII/secrets. — `app/api/access/route.ts`
937. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/reset-password add structured logs + request_id + timing; redact PII/secrets. — `app/api/admin/reset-password/route.ts`
938. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/seed-users add structured logs + request_id + timing; redact PII/secrets. — `app/api/admin/seed-users/route.ts`
939. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/seed add structured logs + request_id + timing; redact PII/secrets. — `app/api/admin/seed/route.ts`
940. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/users/[user_id]/reset-password add structured logs + request_id + timing; redact PII/secrets. — `app/api/admin/users/[user_id]/reset-password/route.ts`
941. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/users/[user_id] add structured logs + request_id + timing; redact PII/secrets. — `app/api/admin/users/[user_id]/route.ts`
942. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/admin/users add structured logs + request_id + timing; redact PII/secrets. — `app/api/admin/users/route.ts`
943. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/change-password add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/change-password/route.ts`
944. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/disable-2fa add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/disable-2fa/route.ts`
945. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/forgot-password add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/forgot-password/route.ts`
946. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/login add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/login/route.ts`
947. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/logout add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/logout/route.ts`
948. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/refresh-token add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/refresh-token/route.ts`
949. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/register add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/register/route.ts`
950. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/reset-password add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/reset-password/route.ts`
951. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/setup-2fa add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/setup-2fa/route.ts`
952. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/auth/verify-2fa add structured logs + request_id + timing; redact PII/secrets. — `app/api/auth/verify-2fa/route.ts`
953. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/company add structured logs + request_id + timing; redact PII/secrets. — `app/api/company/route.ts`
954. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/customers/[id]/[action] add structured logs + request_id + timing; redact PII/secrets. — `app/api/customers/[id]/[action]/route.ts`
955. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/customers/[id] add structured logs + request_id + timing; redact PII/secrets. — `app/api/customers/[id]/route.ts`
956. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/customers add structured logs + request_id + timing; redact PII/secrets. — `app/api/customers/route.ts`
957. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/debug/session add structured logs + request_id + timing; redact PII/secrets. — `app/api/debug/session/route.ts`
958. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/dispatch/[action] add structured logs + request_id + timing; redact PII/secrets. — `app/api/dispatch/[action]/route.ts`
959. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/dispatch/calendar add structured logs + request_id + timing; redact PII/secrets. — `app/api/dispatch/calendar/route.ts`
960. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/dispatch/technician/[id] add structured logs + request_id + timing; redact PII/secrets. — `app/api/dispatch/technician/[id]/route.ts`
961. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/documents add structured logs + request_id + timing; redact PII/secrets. — `app/api/documents/route.ts`
962. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/email/[action] add structured logs + request_id + timing; redact PII/secrets. — `app/api/email/[action]/route.ts`
963. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/gps/[action] add structured logs + request_id + timing; redact PII/secrets. — `app/api/gps/[action]/route.ts`
964. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/gps/geofence/[id] add structured logs + request_id + timing; redact PII/secrets. — `app/api/gps/geofence/[id]/route.ts`
965. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/gps/technician/[id] add structured logs + request_id + timing; redact PII/secrets. — `app/api/gps/technician/[id]/route.ts`
966. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/health add structured logs + request_id + timing; redact PII/secrets. — `app/api/health/route.ts`
967. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/invoices/[id]/[action] add structured logs + request_id + timing; redact PII/secrets. — `app/api/invoices/[id]/[action]/route.ts`
968. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/invoices/[id] add structured logs + request_id + timing; redact PII/secrets. — `app/api/invoices/[id]/route.ts`
969. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/invoices add structured logs + request_id + timing; redact PII/secrets. — `app/api/invoices/route.ts`
970. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/[id]/[action] add structured logs + request_id + timing; redact PII/secrets. — `app/api/jobs/[id]/[action]/route.ts`
971. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/[id]/photos add structured logs + request_id + timing; redact PII/secrets. — `app/api/jobs/[id]/photos/route.ts`
972. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/[id] add structured logs + request_id + timing; redact PII/secrets. — `app/api/jobs/[id]/route.ts`
973. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/export add structured logs + request_id + timing; redact PII/secrets. — `app/api/jobs/export/route.ts`
974. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/jobs add structured logs + request_id + timing; redact PII/secrets. — `app/api/jobs/route.ts`
975. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/maps/[action] add structured logs + request_id + timing; redact PII/secrets. — `app/api/maps/[action]/route.ts`
976. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/notifications/[id]/read add structured logs + request_id + timing; redact PII/secrets. — `app/api/notifications/[id]/read/route.ts`
977. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/notifications add structured logs + request_id + timing; redact PII/secrets. — `app/api/notifications/route.ts`
978. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/notifications/settings add structured logs + request_id + timing; redact PII/secrets. — `app/api/notifications/settings/route.ts`
979. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/payments/[action] add structured logs + request_id + timing; redact PII/secrets. — `app/api/payments/[action]/route.ts`
980. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/ratings/submit add structured logs + request_id + timing; redact PII/secrets. — `app/api/ratings/submit/route.ts`
981. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/ratings/validate add structured logs + request_id + timing; redact PII/secrets. — `app/api/ratings/validate/route.ts`
982. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/reports/[type] add structured logs + request_id + timing; redact PII/secrets. — `app/api/reports/[type]/route.ts`
983. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/sales/dashboard add structured logs + request_id + timing; redact PII/secrets. — `app/api/sales/dashboard/route.ts`
984. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/settings/document add structured logs + request_id + timing; redact PII/secrets. — `app/api/settings/document/route.ts`
985. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/settings/password add structured logs + request_id + timing; redact PII/secrets. — `app/api/settings/password/route.ts`
986. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/settings/profile add structured logs + request_id + timing; redact PII/secrets. — `app/api/settings/profile/route.ts`
987. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/settings/upload add structured logs + request_id + timing; redact PII/secrets. — `app/api/settings/upload/route.ts`
988. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/[action] add structured logs + request_id + timing; redact PII/secrets. — `app/api/sms/[action]/route.ts`
989. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/inbox/[threadId]/read add structured logs + request_id + timing; redact PII/secrets. — `app/api/sms/inbox/[threadId]/read/route.ts`
990. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/inbox/[threadId] add structured logs + request_id + timing; redact PII/secrets. — `app/api/sms/inbox/[threadId]/route.ts`
991. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/inbox add structured logs + request_id + timing; redact PII/secrets. — `app/api/sms/inbox/route.ts`
992. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/sms/triggers add structured logs + request_id + timing; redact PII/secrets. — `app/api/sms/triggers/route.ts`
993. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/uploads add structured logs + request_id + timing; redact PII/secrets. — `app/api/uploads/route.ts`
994. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/users/[id]/availability add structured logs + request_id + timing; redact PII/secrets. — `app/api/users/[id]/availability/route.ts`
995. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/users/[id] add structured logs + request_id + timing; redact PII/secrets. — `app/api/users/[id]/route.ts`
996. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/users/me add structured logs + request_id + timing; redact PII/secrets. — `app/api/users/me/route.ts`
997. **[P2][Observability][ADD][CHECKLIST]** [CHECKLIST] /api/users add structured logs + request_id + timing; redact PII/secrets. — `app/api/users/route.ts`
998. **[P2][Observability][FIX][CONFIRMED]** Console logging: # 6. Check for console.log — `.claude/hooks/pre-deploy-check.sh:51`
999. **[P2][Observability][FIX][CONFIRMED]** Console logging: echo "🐛 Checking for console.log statements..." — `.claude/hooks/pre-deploy-check.sh:52`
1000. **[P2][Observability][FIX][CONFIRMED]** Console logging: echo "⚠️ console.log statements found in app/" — `.claude/hooks/pre-deploy-check.sh:54`
1001. **[P2][Observability][FIX][CONFIRMED]** Console logging: echo "✅ No console.log in production code" — `.claude/hooks/pre-deploy-check.sh:57`
1002. **[P2][Observability][FIX][CONFIRMED]** Console logging: - NO console.log in production code — `.claude/output-styles/production-ready.md:15`
1003. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("DB error:", error); — `.claude/output-styles/production-ready.md:69`
1004. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Unexpected error:", error); — `.claude/output-styles/production-ready.md:78`
1005. **[P2][Observability][FIX][CONFIRMED]** Console logging: - ✅ No console.log statements — `.claude/output-styles/production-ready.md:341`
1006. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.log("Debug info"); — `.claude/output-styles/production-ready.md:373`
1007. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to fetch jobs:", error); — `.claude/skills/supabase-query-builder/SKILL.md:70`
1008. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("DB error:", error); — `CLAUDE.md:539`
1009. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to create job:", error, { jobId, userId: profile.user_id }); — `CLAUDE.md:791`
1010. **[P2][Observability][FIX][CONFIRMED]** Console logging: APP_ENCRYPTION_KEY=xxxxx==  # 32-byte base64 (generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))") — `CLAUDE.md:882`
1011. **[P2][Observability][FIX][CONFIRMED]** Console logging: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" — `README.md:71`
1012. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to create job:", error, { — `README.md:677`
1013. **[P2][Observability][FIX][CONFIRMED]** Console logging: APP_ENCRYPTION_KEY=xxxxx==  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" — `READY_TO_DEPLOY.md:502`
1014. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.log("Middleware checking:", request.nextUrl.pathname); — `TROUBLESHOOTING.md:194`
1015. **[P2][Observability][FIX][CONFIRMED]** Console logging: client.from('users').select('count').then(console.log); — `TROUBLESHOOTING.md:577`
1016. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to load profile:", error); — `app/(app)/technician/profile/page.tsx:56`
1017. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to list users:", listError); — `app/api/admin/reset-password/route.ts:30`
1018. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to reset password:", updateError); — `app/api/admin/reset-password/route.ts:52`
1019. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Seed users error:", error); — `app/api/admin/seed-users/route.ts:177`
1020. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Admin password reset failed:", updateError); — `app/api/admin/users/[user_id]/reset-password/route.ts:61`
1021. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to update user:", error); — `app/api/admin/users/[user_id]/route.ts:59`
1022. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Error updating user:", err); — `app/api/admin/users/[user_id]/route.ts:71`
1023. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to delete user:", error); — `app/api/admin/users/[user_id]/route.ts:122`
1024. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to count users:", countError); — `app/api/admin/users/route.ts:28`
1025. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to fetch users:", error); — `app/api/admin/users/route.ts:41`
1026. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to create user:", error); — `app/api/admin/users/route.ts:115`
1027. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Error creating user:", err); — `app/api/admin/users/route.ts:127`
1028. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Password update failed:", updateError); — `app/api/auth/change-password/route.ts:48`
1029. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Password reset failed:", updateError); — `app/api/auth/reset-password/route.ts:34`
1030. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to fetch job photos:", error, { — `app/api/jobs/[id]/photos/route.ts:27`
1031. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to update photo:", updateError); — `app/api/jobs/[id]/photos/route.ts:133`
1032. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to upload photo:", error, { — `app/api/jobs/[id]/photos/route.ts:158`
1033. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to delete photo:", error); — `app/api/jobs/[id]/photos/route.ts:201`
1034. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to insert rating:", ratingError); — `app/api/ratings/submit/route.ts:95`
1035. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to load sales dashboard", { — `app/api/sales/dashboard/route.ts:35`
1036. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to update user record:", updateError); — `app/api/settings/document/route.ts:62`
1037. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Error deleting document:", err); — `app/api/settings/document/route.ts:74`
1038. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to update password:", updateError); — `app/api/settings/password/route.ts:60`
1039. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Error changing password:", err); — `app/api/settings/password/route.ts:72`
1040. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to update profile:", error); — `app/api/settings/profile/route.ts:38`
1041. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Error updating profile:", err); — `app/api/settings/profile/route.ts:50`
1042. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to upload file:", uploadError); — `app/api/settings/upload/route.ts:72`
1043. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to update user record:", updateError); — `app/api/settings/upload/route.ts:103`
1044. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Error uploading file:", err); — `app/api/settings/upload/route.ts:118`
1045. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to send SMS:", error); — `app/api/sms/triggers/route.ts:176`
1046. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to fetch availability:", error); — `app/api/users/[id]/availability/route.ts:58`
1047. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to save availability:", insertError); — `app/api/users/[id]/availability/route.ts:148`
1048. **[P2][Observability][FIX][CONFIRMED]** Console logging: .catch((err) => console.error("Failed to load permissions", err)); — `components/BottomNavMobile.tsx:259`
1049. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Photo upload error:", err); — `components/JobPhotoUpload.tsx:137`
1050. **[P2][Observability][FIX][CONFIRMED]** Console logging: console.error("Failed to load dashboard data", { — `lib/queries.ts:59`

## Testing
1051. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /admin/users add UI tests (render, permissions, key interactions). — `app/(app)/admin/users/page.tsx`
1052. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /customers add UI tests (render, permissions, key interactions). — `app/(app)/customers/page.tsx`
1053. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /dashboard add UI tests (render, permissions, key interactions). — `app/(app)/dashboard/page.tsx`
1054. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /dispatch add UI tests (render, permissions, key interactions). — `app/(app)/dispatch/page.tsx`
1055. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /inbox add UI tests (render, permissions, key interactions). — `app/(app)/inbox/page.tsx`
1056. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /invoices add UI tests (render, permissions, key interactions). — `app/(app)/invoices/page.tsx`
1057. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /jobs add UI tests (render, permissions, key interactions). — `app/(app)/jobs/page.tsx`
1058. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /notifications add UI tests (render, permissions, key interactions). — `app/(app)/notifications/page.tsx`
1059. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /operations add UI tests (render, permissions, key interactions). — `app/(app)/operations/page.tsx`
1060. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /profile add UI tests (render, permissions, key interactions). — `app/(app)/profile/page.tsx`
1061. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /reports add UI tests (render, permissions, key interactions). — `app/(app)/reports/page.tsx`
1062. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /sales/dashboard add UI tests (render, permissions, key interactions). — `app/(app)/sales/dashboard/page.tsx`
1063. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /sales/earnings add UI tests (render, permissions, key interactions). — `app/(app)/sales/earnings/page.tsx`
1064. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /sales/leads add UI tests (render, permissions, key interactions). — `app/(app)/sales/leads/page.tsx`
1065. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /sales add UI tests (render, permissions, key interactions). — `app/(app)/sales/page.tsx`
1066. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /sales/schedule add UI tests (render, permissions, key interactions). — `app/(app)/sales/schedule/page.tsx`
1067. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /sales/settings add UI tests (render, permissions, key interactions). — `app/(app)/sales/settings/page.tsx`
1068. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /settings add UI tests (render, permissions, key interactions). — `app/(app)/settings/page.tsx`
1069. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /team/[id] add UI tests (render, permissions, key interactions). — `app/(app)/team/[id]/page.tsx`
1070. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /technician/customers add UI tests (render, permissions, key interactions). — `app/(app)/technician/customers/page.tsx`
1071. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /technician/earnings add UI tests (render, permissions, key interactions). — `app/(app)/technician/earnings/page.tsx`
1072. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /technician/equipment add UI tests (render, permissions, key interactions). — `app/(app)/technician/equipment/page.tsx`
1073. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /technician/map add UI tests (render, permissions, key interactions). — `app/(app)/technician/map/page.tsx`
1074. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /technician add UI tests (render, permissions, key interactions). — `app/(app)/technician/page.tsx`
1075. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /technician/profile add UI tests (render, permissions, key interactions). — `app/(app)/technician/profile/page.tsx`
1076. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /technician/schedule add UI tests (render, permissions, key interactions). — `app/(app)/technician/schedule/page.tsx`
1077. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /forgot-password add UI tests (render, permissions, key interactions). — `app/(auth)/forgot-password/page.tsx`
1078. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /login add UI tests (render, permissions, key interactions). — `app/(auth)/login/page.tsx`
1079. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /reset-password add UI tests (render, permissions, key interactions). — `app/(auth)/reset-password/page.tsx`
1080. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /verify-2fa add UI tests (render, permissions, key interactions). — `app/(auth)/verify-2fa/page.tsx`
1081. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page /rate/[token] add UI tests (render, permissions, key interactions). — `app/(public)/rate/[token]/page.tsx`
1082. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/access add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/access/route.ts`
1083. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/admin/reset-password add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/admin/reset-password/route.ts`
1084. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/admin/seed-users add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/admin/seed-users/route.ts`
1085. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/admin/seed add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/admin/seed/route.ts`
1086. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/admin/users/[user_id]/reset-password add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/admin/users/[user_id]/reset-password/route.ts`
1087. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/admin/users/[user_id] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/admin/users/[user_id]/route.ts`
1088. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/admin/users add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/admin/users/route.ts`
1089. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/change-password add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/change-password/route.ts`
1090. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/disable-2fa add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/disable-2fa/route.ts`
1091. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/forgot-password add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/forgot-password/route.ts`
1092. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/login add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/login/route.ts`
1093. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/logout add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/logout/route.ts`
1094. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/refresh-token add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/refresh-token/route.ts`
1095. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/register add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/register/route.ts`
1096. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/reset-password add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/reset-password/route.ts`
1097. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/setup-2fa add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/setup-2fa/route.ts`
1098. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/auth/verify-2fa add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/auth/verify-2fa/route.ts`
1099. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/company add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/company/route.ts`
1100. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/customers/[id]/[action] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/customers/[id]/[action]/route.ts`
1101. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/customers/[id] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/customers/[id]/route.ts`
1102. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/customers add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/customers/route.ts`
1103. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/debug/session add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/debug/session/route.ts`
1104. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/dispatch/[action] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/dispatch/[action]/route.ts`
1105. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/dispatch/calendar add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/dispatch/calendar/route.ts`
1106. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/dispatch/technician/[id] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/dispatch/technician/[id]/route.ts`
1107. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/documents add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/documents/route.ts`
1108. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/email/[action] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/email/[action]/route.ts`
1109. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/gps/[action] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/gps/[action]/route.ts`
1110. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/gps/geofence/[id] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/gps/geofence/[id]/route.ts`
1111. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/gps/technician/[id] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/gps/technician/[id]/route.ts`
1112. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/health add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/health/route.ts`
1113. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/invoices/[id]/[action] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/invoices/[id]/[action]/route.ts`
1114. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/invoices/[id] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/invoices/[id]/route.ts`
1115. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/invoices add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/invoices/route.ts`
1116. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/[id]/[action] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/jobs/[id]/[action]/route.ts`
1117. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/[id]/photos add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/jobs/[id]/photos/route.ts`
1118. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/[id] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/jobs/[id]/route.ts`
1119. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/jobs/export add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/jobs/export/route.ts`
1120. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/jobs add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/jobs/route.ts`
1121. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/maps/[action] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/maps/[action]/route.ts`
1122. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/notifications/[id]/read add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/notifications/[id]/read/route.ts`
1123. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/notifications add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/notifications/route.ts`
1124. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/notifications/settings add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/notifications/settings/route.ts`
1125. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/payments/[action] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/payments/[action]/route.ts`
1126. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/ratings/submit add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/ratings/submit/route.ts`
1127. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/ratings/validate add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/ratings/validate/route.ts`
1128. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/reports/[type] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/reports/[type]/route.ts`
1129. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/sales/dashboard add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/sales/dashboard/route.ts`
1130. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/settings/document add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/settings/document/route.ts`
1131. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/settings/password add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/settings/password/route.ts`
1132. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/settings/profile add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/settings/profile/route.ts`
1133. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/settings/upload add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/settings/upload/route.ts`
1134. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/sms/[action] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/sms/[action]/route.ts`
1135. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/sms/inbox/[threadId]/read add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/sms/inbox/[threadId]/read/route.ts`
1136. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/sms/inbox/[threadId] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/sms/inbox/[threadId]/route.ts`
1137. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/sms/inbox add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/sms/inbox/route.ts`
1138. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/sms/triggers add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/sms/triggers/route.ts`
1139. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/uploads add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/uploads/route.ts`
1140. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/users/[id]/availability add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/users/[id]/availability/route.ts`
1141. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/users/[id] add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/users/[id]/route.ts`
1142. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/users/me add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/users/me/route.ts`
1143. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] /api/users add tests (happy path, auth failure, validation failure, tenant boundary). — `app/api/users/route.ts`
1144. **[P2][Testing][ADD][CHECKLIST]** [CHECKLIST] Page / add UI tests (render, permissions, key interactions). — `app/page.tsx`

## TypeScript
1145. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: let upsells: any[] = []; — `app/(app)/jobs/page.tsx:94`
1146. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: let polygonCoordinates: any = undefined; — `app/(app)/sales/page.tsx:111`
1147. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: const mapInstance = useRef<any>(null); — `app/(app)/technician/map/page.tsx:17`
1148. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: const markers = useRef<any[]>([]); — `app/(app)/technician/map/page.tsx:18`
1149. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: const polyline = useRef<any>(null); — `app/(app)/technician/map/page.tsx:19`
1150. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: return (window as any).google; — `app/(app)/technician/map/page.tsx:76`
1151. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: // Also clean up any orphaned public.users (shouldn't exist with FK, but just in case) — `app/api/admin/seed-users/route.ts:30`
1152. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: name: (data.companies as any)?.[0]?.name || (data.companies as any)?.name || "Entretien Prestige", — `app/api/invoices/[id]/[action]/route.ts:115`
1153. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: address: (data.companies as any)?.[0]?.address || (data.companies as any)?.address, — `app/api/invoices/[id]/[action]/route.ts:116`
1154. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: city: (data.companies as any)?.[0]?.city || (data.companies as any)?.city, — `app/api/invoices/[id]/[action]/route.ts:117`
1155. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: province: (data.companies as any)?.[0]?.province || (data.companies as any)?.province, — `app/api/invoices/[id]/[action]/route.ts:118`
1156. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: postal_code: (data.companies as any)?.[0]?.postal_code || (data.companies as any)?.postal_code, — `app/api/invoices/[id]/[action]/route.ts:119`
1157. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: phone: (data.companies as any)?.[0]?.phone || (data.companies as any)?.phone, — `app/api/invoices/[id]/[action]/route.ts:120`
1158. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: email: (data.companies as any)?.[0]?.email || (data.companies as any)?.email, — `app/api/invoices/[id]/[action]/route.ts:121`
1159. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: gst_number: (data.companies as any)?.[0]?.gst_number || (data.companies as any)?.gst_number, — `app/api/invoices/[id]/[action]/route.ts:122`
1160. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: qst_number: (data.companies as any)?.[0]?.qst_number || (data.companies as any)?.qst_number, — `app/api/invoices/[id]/[action]/route.ts:123`
1161. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: name: `${(data.customers as any)?.[0]?.first_name || (data.customers as any)?.first_name || ""} ${(data.customers as any)?.[0]?.last_name || (data.customers as any)?.last_name || ""}`.trim(), — `app/api/invoices/[id]/[action]/route.ts:126`
1162. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: address: (data.customers as any)?.[0]?.address || (data.customers as any)?.address, — `app/api/invoices/[id]/[action]/route.ts:127`
1163. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: city: (data.customers as any)?.[0]?.city || (data.customers as any)?.city, — `app/api/invoices/[id]/[action]/route.ts:128`
1164. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: province: (data.customers as any)?.[0]?.province || (data.customers as any)?.province, — `app/api/invoices/[id]/[action]/route.ts:129`
1165. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: postal_code: (data.customers as any)?.[0]?.postal_code || (data.customers as any)?.postal_code, — `app/api/invoices/[id]/[action]/route.ts:130`
1166. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: phone: (data.customers as any)?.[0]?.phone || (data.customers as any)?.phone, — `app/api/invoices/[id]/[action]/route.ts:131`
1167. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: email: (data.customers as any)?.[0]?.email || (data.customers as any)?.email, — `app/api/invoices/[id]/[action]/route.ts:132`
1168. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: name: (data.companies as any)?.[0]?.name || (data.companies as any)?.name || "Entretien Prestige", — `app/api/invoices/[id]/[action]/route.ts:214`
1169. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: address: (data.companies as any)?.[0]?.address || (data.companies as any)?.address, — `app/api/invoices/[id]/[action]/route.ts:215`
1170. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: city: (data.companies as any)?.[0]?.city || (data.companies as any)?.city, — `app/api/invoices/[id]/[action]/route.ts:216`
1171. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: province: (data.companies as any)?.[0]?.province || (data.companies as any)?.province, — `app/api/invoices/[id]/[action]/route.ts:217`
1172. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: postal_code: (data.companies as any)?.[0]?.postal_code || (data.companies as any)?.postal_code, — `app/api/invoices/[id]/[action]/route.ts:218`
1173. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: phone: (data.companies as any)?.[0]?.phone || (data.companies as any)?.phone, — `app/api/invoices/[id]/[action]/route.ts:219`
1174. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: email: (data.companies as any)?.[0]?.email || (data.companies as any)?.email, — `app/api/invoices/[id]/[action]/route.ts:220`
1175. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: gst_number: (data.companies as any)?.[0]?.gst_number || (data.companies as any)?.gst_number, — `app/api/invoices/[id]/[action]/route.ts:221`
1176. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: qst_number: (data.companies as any)?.[0]?.qst_number || (data.companies as any)?.qst_number, — `app/api/invoices/[id]/[action]/route.ts:222`
1177. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: name: `${(data.customers as any)?.[0]?.first_name || (data.customers as any)?.first_name || ""} ${(data.customers as any)?.[0]?.last_name || (data.customers as any)?.last_name || ""}`.trim(), — `app/api/invoices/[id]/[action]/route.ts:225`
1178. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: address: (data.customers as any)?.[0]?.address || (data.customers as any)?.address, — `app/api/invoices/[id]/[action]/route.ts:226`
1179. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: city: (data.customers as any)?.[0]?.city || (data.customers as any)?.city, — `app/api/invoices/[id]/[action]/route.ts:227`
1180. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: province: (data.customers as any)?.[0]?.province || (data.customers as any)?.province, — `app/api/invoices/[id]/[action]/route.ts:228`
1181. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: postal_code: (data.customers as any)?.[0]?.postal_code || (data.customers as any)?.postal_code, — `app/api/invoices/[id]/[action]/route.ts:229`
1182. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: phone: (data.customers as any)?.[0]?.phone || (data.customers as any)?.phone, — `app/api/invoices/[id]/[action]/route.ts:230`
1183. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: email: (data.customers as any)?.[0]?.email || (data.customers as any)?.email, — `app/api/invoices/[id]/[action]/route.ts:231`
1184. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: const event: any = result.event; — `app/api/payments/[action]/route.ts:21`
1185. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: customer_name: `${(job.customers as any)?.[0]?.first_name || (job.customers as any)?.first_name || ""} ${(job.customers as any)?.[0]?.last_name || (job.customers as any)?.last_name || ""}`.trim(), — `app/api/ratings/validate/route.ts:74`
1186. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: technician_name: (job.technician as any)?.[0]?.full_name || (job.technician as any)?.full_name || "Technicien", — `app/api/ratings/validate/route.ts:77`
1187. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: assignments?.map((a: any) => a.job?.customer_id).filter(Boolean) || [] — `app/api/sms/inbox/route.ts:48`
1188. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: const threadsMap = new Map<string, any>(); — `app/api/sms/inbox/route.ts:69`
1189. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: } catch (error: any) { — `app/api/sms/triggers/route.ts:175`
1190. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: // Check if any other tab has a more specific match — `components/BottomNavMobile.tsx:289`
1191. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: client: { from: (table: string) => any }, — `lib/audit.ts:2`
1192. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: async function loadPermissions(request: Request, profile: { company_id: string; role: string; access_permissions?: any }) { — `lib/auth.ts:6`
1193. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: getMessage: (data: any) => string; — `lib/smsTemplates.ts:5`
1194. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: upsells: z.array(z.record(z.any())), — `lib/validators.ts:117`
1195. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: polygonCoordinates: z.array(z.any()).optional(), — `lib/validators.ts:317`
1196. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: startItems: z.array(z.record(z.any())).optional(), — `lib/validators.ts:345`
1197. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: endItems: z.array(z.record(z.any())).optional(), — `lib/validators.ts:348`
1198. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: onError?.({ code: 1, message: "Denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as any); — `tests/technicianDashboard.test.tsx:16`
1199. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/gps/hourly-ping", expect.any(Object))); — `tests/technicianDashboard.test.tsx:157`
1200. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: function createFetchMock(historyData: any[] = []): FetchHandler { — `tests/technicianMap.test.tsx:7`
1201. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: onError?.({ code: 1, message: "Denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as any); — `tests/technicianMap.test.tsx:24`
1202. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: (window as any).google = { — `tests/technicianMap.test.tsx:52`
1203. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: delete (window as any).google; — `tests/technicianMap.test.tsx:66`
1204. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: delete (window as any).google.maps; — `tests/technicianMap.test.tsx:105`
1205. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: delete (window as any).google; — `tests/technicianMap.test.tsx:158`
1206. **[P2][TypeScript][FIX][CONFIRMED]** 'any' used: (window as any).google = {}; — `tests/technicianMap.test.tsx:182`

## UI-Accessibility
1207. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /admin/users ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/admin/users/page.tsx`
1208. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /customers ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/customers/page.tsx`
1209. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /dashboard ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/dashboard/page.tsx`
1210. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /dispatch ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/dispatch/page.tsx`
1211. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /inbox ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/inbox/page.tsx`
1212. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /invoices ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/invoices/page.tsx`
1213. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /jobs ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/jobs/page.tsx`
1214. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /notifications ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/notifications/page.tsx`
1215. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /operations ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/operations/page.tsx`
1216. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /profile ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/profile/page.tsx`
1217. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /reports ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/reports/page.tsx`
1218. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /sales/dashboard ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/sales/dashboard/page.tsx`
1219. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /sales/earnings ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/sales/earnings/page.tsx`
1220. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /sales/leads ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/sales/leads/page.tsx`
1221. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /sales ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/sales/page.tsx`
1222. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /sales/schedule ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/sales/schedule/page.tsx`
1223. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /sales/settings ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/sales/settings/page.tsx`
1224. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /settings ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/settings/page.tsx`
1225. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /team/[id] ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/team/[id]/page.tsx`
1226. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /technician/customers ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/technician/customers/page.tsx`
1227. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /technician/earnings ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/technician/earnings/page.tsx`
1228. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /technician/equipment ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/technician/equipment/page.tsx`
1229. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /technician/map ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/technician/map/page.tsx`
1230. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /technician ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/technician/page.tsx`
1231. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /technician/profile ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/technician/profile/page.tsx`
1232. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /technician/schedule ensure accessible forms, labels, keyboard nav, focus management. — `app/(app)/technician/schedule/page.tsx`
1233. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /forgot-password ensure accessible forms, labels, keyboard nav, focus management. — `app/(auth)/forgot-password/page.tsx`
1234. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /login ensure accessible forms, labels, keyboard nav, focus management. — `app/(auth)/login/page.tsx`
1235. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /reset-password ensure accessible forms, labels, keyboard nav, focus management. — `app/(auth)/reset-password/page.tsx`
1236. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /verify-2fa ensure accessible forms, labels, keyboard nav, focus management. — `app/(auth)/verify-2fa/page.tsx`
1237. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page /rate/[token] ensure accessible forms, labels, keyboard nav, focus management. — `app/(public)/rate/[token]/page.tsx`
1238. **[P2][UI-Accessibility][ADD][CHECKLIST]** [CHECKLIST] Page / ensure accessible forms, labels, keyboard nav, focus management. — `app/page.tsx`

## UI-Perf
1239. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /admin/users ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/admin/users/page.tsx`
1240. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /customers ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/customers/page.tsx`
1241. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /dashboard ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/dashboard/page.tsx`
1242. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /dispatch ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/dispatch/page.tsx`
1243. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /inbox ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/inbox/page.tsx`
1244. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /invoices ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/invoices/page.tsx`
1245. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /jobs ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/jobs/page.tsx`
1246. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /notifications ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/notifications/page.tsx`
1247. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /operations ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/operations/page.tsx`
1248. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /profile ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/profile/page.tsx`
1249. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /reports ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/reports/page.tsx`
1250. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /sales/dashboard ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/sales/dashboard/page.tsx`
1251. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /sales/earnings ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/sales/earnings/page.tsx`
1252. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /sales/leads ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/sales/leads/page.tsx`
1253. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /sales ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/sales/page.tsx`
1254. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /sales/schedule ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/sales/schedule/page.tsx`
1255. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /sales/settings ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/sales/settings/page.tsx`
1256. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /settings ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/settings/page.tsx`
1257. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /team/[id] ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/team/[id]/page.tsx`
1258. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /technician/customers ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/technician/customers/page.tsx`
1259. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /technician/earnings ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/technician/earnings/page.tsx`
1260. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /technician/equipment ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/technician/equipment/page.tsx`
1261. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /technician/map ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/technician/map/page.tsx`
1262. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /technician ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/technician/page.tsx`
1263. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /technician/profile ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/technician/profile/page.tsx`
1264. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /technician/schedule ensure pagination/virtualization for long lists and minimize overfetching. — `app/(app)/technician/schedule/page.tsx`
1265. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /forgot-password ensure pagination/virtualization for long lists and minimize overfetching. — `app/(auth)/forgot-password/page.tsx`
1266. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /login ensure pagination/virtualization for long lists and minimize overfetching. — `app/(auth)/login/page.tsx`
1267. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /reset-password ensure pagination/virtualization for long lists and minimize overfetching. — `app/(auth)/reset-password/page.tsx`
1268. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /verify-2fa ensure pagination/virtualization for long lists and minimize overfetching. — `app/(auth)/verify-2fa/page.tsx`
1269. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page /rate/[token] ensure pagination/virtualization for long lists and minimize overfetching. — `app/(public)/rate/[token]/page.tsx`
1270. **[P2][UI-Perf][ADD][CHECKLIST]** [CHECKLIST] Page / ensure pagination/virtualization for long lists and minimize overfetching. — `app/page.tsx`

## UI-UX
1271. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /admin/users add empty/loading/error states and user-friendly messaging. — `app/(app)/admin/users/page.tsx`
1272. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /customers add empty/loading/error states and user-friendly messaging. — `app/(app)/customers/page.tsx`
1273. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /dashboard add empty/loading/error states and user-friendly messaging. — `app/(app)/dashboard/page.tsx`
1274. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /dispatch add empty/loading/error states and user-friendly messaging. — `app/(app)/dispatch/page.tsx`
1275. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /inbox add empty/loading/error states and user-friendly messaging. — `app/(app)/inbox/page.tsx`
1276. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /invoices add empty/loading/error states and user-friendly messaging. — `app/(app)/invoices/page.tsx`
1277. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /jobs add empty/loading/error states and user-friendly messaging. — `app/(app)/jobs/page.tsx`
1278. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /notifications add empty/loading/error states and user-friendly messaging. — `app/(app)/notifications/page.tsx`
1279. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /operations add empty/loading/error states and user-friendly messaging. — `app/(app)/operations/page.tsx`
1280. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /profile add empty/loading/error states and user-friendly messaging. — `app/(app)/profile/page.tsx`
1281. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /reports add empty/loading/error states and user-friendly messaging. — `app/(app)/reports/page.tsx`
1282. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /sales/dashboard add empty/loading/error states and user-friendly messaging. — `app/(app)/sales/dashboard/page.tsx`
1283. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /sales/earnings add empty/loading/error states and user-friendly messaging. — `app/(app)/sales/earnings/page.tsx`
1284. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /sales/leads add empty/loading/error states and user-friendly messaging. — `app/(app)/sales/leads/page.tsx`
1285. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /sales add empty/loading/error states and user-friendly messaging. — `app/(app)/sales/page.tsx`
1286. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /sales/schedule add empty/loading/error states and user-friendly messaging. — `app/(app)/sales/schedule/page.tsx`
1287. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /sales/settings add empty/loading/error states and user-friendly messaging. — `app/(app)/sales/settings/page.tsx`
1288. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /settings add empty/loading/error states and user-friendly messaging. — `app/(app)/settings/page.tsx`
1289. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /team/[id] add empty/loading/error states and user-friendly messaging. — `app/(app)/team/[id]/page.tsx`
1290. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /technician/customers add empty/loading/error states and user-friendly messaging. — `app/(app)/technician/customers/page.tsx`
1291. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /technician/earnings add empty/loading/error states and user-friendly messaging. — `app/(app)/technician/earnings/page.tsx`
1292. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /technician/equipment add empty/loading/error states and user-friendly messaging. — `app/(app)/technician/equipment/page.tsx`
1293. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /technician/map add empty/loading/error states and user-friendly messaging. — `app/(app)/technician/map/page.tsx`
1294. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /technician add empty/loading/error states and user-friendly messaging. — `app/(app)/technician/page.tsx`
1295. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /technician/profile add empty/loading/error states and user-friendly messaging. — `app/(app)/technician/profile/page.tsx`
1296. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /technician/schedule add empty/loading/error states and user-friendly messaging. — `app/(app)/technician/schedule/page.tsx`
1297. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /forgot-password add empty/loading/error states and user-friendly messaging. — `app/(auth)/forgot-password/page.tsx`
1298. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /login add empty/loading/error states and user-friendly messaging. — `app/(auth)/login/page.tsx`
1299. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /reset-password add empty/loading/error states and user-friendly messaging. — `app/(auth)/reset-password/page.tsx`
1300. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /verify-2fa add empty/loading/error states and user-friendly messaging. — `app/(auth)/verify-2fa/page.tsx`
1301. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page /rate/[token] add empty/loading/error states and user-friendly messaging. — `app/(public)/rate/[token]/page.tsx`
1302. **[P2][UI-UX][ADD][CHECKLIST]** [CHECKLIST] Page / add empty/loading/error states and user-friendly messaging. — `app/page.tsx`

## UI-i18n
1303. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /admin/users confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/admin/users/page.tsx`
1304. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /customers confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/customers/page.tsx`
1305. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /dashboard confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/dashboard/page.tsx`
1306. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /dispatch confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/dispatch/page.tsx`
1307. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /inbox confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/inbox/page.tsx`
1308. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /invoices confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/invoices/page.tsx`
1309. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /jobs confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/jobs/page.tsx`
1310. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /notifications confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/notifications/page.tsx`
1311. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /operations confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/operations/page.tsx`
1312. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /profile confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/profile/page.tsx`
1313. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /reports confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/reports/page.tsx`
1314. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /sales/dashboard confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/sales/dashboard/page.tsx`
1315. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /sales/earnings confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/sales/earnings/page.tsx`
1316. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /sales/leads confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/sales/leads/page.tsx`
1317. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /sales confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/sales/page.tsx`
1318. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /sales/schedule confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/sales/schedule/page.tsx`
1319. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /sales/settings confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/sales/settings/page.tsx`
1320. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /settings confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/settings/page.tsx`
1321. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /team/[id] confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/team/[id]/page.tsx`
1322. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /technician/customers confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/technician/customers/page.tsx`
1323. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /technician/earnings confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/technician/earnings/page.tsx`
1324. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /technician/equipment confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/technician/equipment/page.tsx`
1325. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /technician/map confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/technician/map/page.tsx`
1326. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /technician confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/technician/page.tsx`
1327. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /technician/profile confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/technician/profile/page.tsx`
1328. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /technician/schedule confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(app)/technician/schedule/page.tsx`
1329. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /forgot-password confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(auth)/forgot-password/page.tsx`
1330. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /login confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(auth)/login/page.tsx`
1331. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /reset-password confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(auth)/reset-password/page.tsx`
1332. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /verify-2fa confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(auth)/verify-2fa/page.tsx`
1333. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page /rate/[token] confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/(public)/rate/[token]/page.tsx`
1334. **[P2][UI-i18n][VERIFY][CHECKLIST]** [CHECKLIST] Page / confirm language consistency (FR/EN) and date/time formatting (America/Montreal). — `app/page.tsx`

# P3 Items

## Docs
1335. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - 🔐 Check for missing authentication in API routes — `.claude-plugin/README.md:214`
1336. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: 5. Try a simple agent - "Use bug-hunter to check for missing RLS policies" — `.claude/README.md:155`
1337. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: "Use the bug-hunter agent to check for any missing company_id filters in queries" — `.claude/SETUP_COMPLETE.md:70`
1338. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Lists what matches (✅), what's missing (⚠️), what's wrong (❌) — `.claude/SKILLS_GUIDE.md:90`
1339. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - List of missing/incorrect features — `.claude/SKILLS_GUIDE.md:100`
1340. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Identifies incorrect queries, missing filters, wrong calculations — `.claude/agents/bug-hunter.md:64`
1341. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - ✅ No TODOs or FIXME comments in critical code — `.claude/agents/deploy-manager.md:94`
1342. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ❌ CRITICAL: Missing authentication check in /api/admin/users — `.claude/output-styles/code-review.md:41`
1343. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ⚠️ WARNING: Query missing company_id filter — `.claude/output-styles/code-review.md:46`
1344. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ⚠️ Missing validation schema — `.claude/output-styles/code-review.md:65`
1345. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: Missing: Holiday pricing branch not tested — `.claude/output-styles/code-review.md:119`
1346. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ❌ Spec violation: Missing required field — `.claude/output-styles/code-review.md:140`
1347. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ⚠️ Missing index — `.claude/output-styles/code-review.md:169`
1348. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ❌ Missing max-width — `.claude/output-styles/code-review.md:219`
1349. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Missing authentication — `.claude/output-styles/code-review.md:271`
1350. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Data leaks (missing company_id filter) — `.claude/output-styles/code-review.md:272`
1351. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Missing validation — `.claude/output-styles/code-review.md:280`
1352. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Missing tests (non-critical paths) — `.claude/output-styles/code-review.md:283`
1353. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ✅ Good: "The query is missing company_id filtering, which could leak data across companies. Add .eq('company_id', profile.company_id) to fix." — `.claude/output-styles/code-review.md:341`
1354. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Security: ⚠️ (Missing company_id filter) — `.claude/output-styles/code-review.md:374`
1355. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ⚠️ **Query missing company_id filter on commissions** — `.claude/output-styles/code-review.md:398`
1356. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - NO placeholder functions — `.claude/output-styles/production-ready.md:13`
1357. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - NO TODO comments without implementation — `.claude/output-styles/production-ready.md:14`
1358. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: CREATE TABLE new_table (...); -- Missing RLS! — `.claude/output-styles/production-ready.md:243`
1359. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - ✅ No TODO comments — `.claude/output-styles/production-ready.md:342`
1360. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: // ❌ TODO without implementation — `.claude/output-styles/production-ready.md:363`
1361. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: // TODO: Implement this later — `.claude/output-styles/production-ready.md:364`
1362. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: <input placeholder="Entrez votre nom" /> — `.claude/output-styles/quebec-french.md:39`
1363. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: <input placeholder="Enter your name" /> — `.claude/output-styles/quebec-french.md:44`
1364. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: 3. Lists what matches (✅), what's missing (⚠️), what's wrong (❌) — `.claude/skills/spec-enforcer/SKILL.md:36`
1365. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - **NO shortcuts** - No "TODO", no "FIXME", no "we'll fix this later" — `CLAUDE.md:697`
1366. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: **Production:** Use Redis-backed rate limiting (not implemented yet) — `CLAUDE.md:924`
1367. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: 1. Missing `@/` path alias (check `tsconfig.json`) — `CLAUDE.md:960`
1368. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: 3. Missing type imports from `@/lib/types` — `CLAUDE.md:962`
1369. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Check for missing authentication in API routes — `CLAUDE.md:1246`
1370. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: **Missing:** — `CODE_ANALYSIS_REPORT.md:66`
1371. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ### ❌ MISSING IMPLEMENTATIONS (30-40%) — `CODE_ANALYSIS_REPORT.md:126`
1372. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: | PhotoUpload | ❌ | **MISSING** | — `CODE_ANALYSIS_REPORT.md:208`
1373. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: | AvailabilityGrid | ❌ | **MISSING** | — `CODE_ANALYSIS_REPORT.md:209`
1374. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ### Bug #4: Missing Photo Upload (MEDIUM PRIORITY) — `CODE_ANALYSIS_REPORT.md:241`
1375. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: ### Bug #5: Missing Rating Page (MEDIUM PRIORITY) — `CODE_ANALYSIS_REPORT.md:249`
1376. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: | API Routes | "90%" | 85% (1 missing) | — `CODE_ANALYSIS_REPORT.md:268`
1377. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Complete notification matrix — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:714`
1378. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Complete message templates — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:731`
1379. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Complete job state machine — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:760`
1380. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Granular permissions per role — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:784`
1381. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Exact calculation rules — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:807`
1382. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Exact invoice layout — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:830`
1383. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Search specifications — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:850`
1384. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Photo/file requirements — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:871`
1385. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Offline mode specifications — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:892`
1386. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Error scenarios — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:914`
1387. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: API integration specifics — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:932`
1388. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: SLA specifications — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:964`
1389. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: 2FA process step-by-step — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:988`
1390. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: How new customers are added — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1016`
1391. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Step-by-step payment process — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1044`
1392. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Exact tax formulas — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1079`
1393. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Complete French translations — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1102`
1394. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Accessibility checklist — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1122`
1395. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: QA checklist — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1150`
1396. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: MISSING: Observability setup — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:1184`
1397. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: claude --mcp file-search search "TODO" --caseSensitive — `MCP_SETUP.md:138`
1398. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: **BROKEN/MISSING:** — `READY_TO_DEPLOY.md:166`
1399. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Returns completion status and missing photos — `READY_TO_DEPLOY.md:282`
1400. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Auto-advances to next missing photo — `READY_TO_DEPLOY.md:286`
1401. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: **Database Ready, UI/API Missing:** — `READY_TO_DEPLOY.md:330`
1402. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Returns completion status and missing photos — `READY_TO_DEPLOY.md:362`
1403. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Auto-advances to next missing photo — `READY_TO_DEPLOY.md:366`
1404. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - Console.warn() when services skip due to missing credentials — `READY_TO_DEPLOY.md:579`
1405. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - ❌ Photo uploads (not implemented) — `READY_TO_DEPLOY.md:642`
1406. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: - ❌ Rating system (not implemented) — `READY_TO_DEPLOY.md:643`
1407. **[P3][Docs][FIX][CONFIRMED]** Doc flags missing/unfinished: 2. Missing dependency — `TROUBLESHOOTING.md:319`
1408. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude-plugin/README.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude-plugin/README.md`
1409. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/AGENTS_GUIDE.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/AGENTS_GUIDE.md`
1410. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/IMPLEMENTATION_COMPLETE.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/IMPLEMENTATION_COMPLETE.md`
1411. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/README.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/README.md`
1412. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/SETUP_COMPLETE.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/SETUP_COMPLETE.md`
1413. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/SKILLS_GUIDE.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/SKILLS_GUIDE.md`
1414. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/agents/bug-hunter.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/agents/bug-hunter.md`
1415. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/agents/code-reviewer.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/agents/code-reviewer.md`
1416. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/agents/database-architect.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/agents/database-architect.md`
1417. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/agents/deploy-manager.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/agents/deploy-manager.md`
1418. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/agents/feature-builder.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/agents/feature-builder.md`
1419. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/agents/qa-engineer.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/agents/qa-engineer.md`
1420. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/output-styles/code-review.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/output-styles/code-review.md`
1421. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/output-styles/production-ready.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/output-styles/production-ready.md`
1422. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/output-styles/quebec-french.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/output-styles/quebec-french.md`
1423. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/api-builder/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/api-builder/SKILL.md`
1424. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/bug-fixer/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/bug-fixer/SKILL.md`
1425. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/docs-updater/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/docs-updater/SKILL.md`
1426. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/french-ui-helper/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/french-ui-helper/SKILL.md`
1427. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/migration-builder/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/migration-builder/SKILL.md`
1428. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/rls-policy-builder/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/rls-policy-builder/SKILL.md`
1429. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/spec-enforcer/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/spec-enforcer/SKILL.md`
1430. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/supabase-query-builder/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/supabase-query-builder/SKILL.md`
1431. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/test-generator/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/test-generator/SKILL.md`
1432. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review .claude/skills/ui-builder/SKILL.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `.claude/skills/ui-builder/SKILL.md`
1433. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review AGENTS.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `AGENTS.md`
1434. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review CLAUDE.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `CLAUDE.md`
1435. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review CODE_ANALYSIS_REPORT.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `CODE_ANALYSIS_REPORT.md`
1436. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md`
1437. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review MCP_SETUP.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `MCP_SETUP.md`
1438. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review README.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `README.md`
1439. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review READY_TO_DEPLOY.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `READY_TO_DEPLOY.md`
1440. **[P3][Docs][VERIFY][CHECKLIST]** [CHECKLIST] Review TROUBLESHOOTING.md: remove contradictions, ensure it matches code & DB, and update deployment steps. — `TROUBLESHOOTING.md`
 
## Linting
