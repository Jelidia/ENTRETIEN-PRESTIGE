# Phase 2 Implementation Plan
## French Localization & Button Functionality Audit

**Date:** 2026-01-31
**Status:** 🚧 IN PROGRESS

---

## Objectives

1. Complete French localization across all pages
2. Audit and fix all non-functional buttons
3. Remove or implement placeholder features
4. Ensure consistent UI/UX across all roles

---

## Part A: French Localization

### Strategy
1. Audit all pages for English text
2. Add missing translation keys to `lib/i18n.ts`
3. Update components to use `useLanguage()` hook
4. Test language switching across all pages

### Pages to Localize

#### Admin/Manager Pages
- [ ] `/dashboard` - Dashboard page
- [ ] `/dispatch` - Dispatch/Schedule page
- [ ] `/customers` - Customer list page
- [ ] `/team` - Team management (already French ✅)
- [ ] `/jobs` - Jobs list page
- [ ] `/invoices` - Invoices page
- [ ] `/reports` - Reports page
- [ ] `/admin/users` - User management page

#### Sales Rep Pages
- [ ] `/sales/dashboard` - Sales dashboard
- [ ] `/sales/leads` - Leads page
- [ ] `/sales/schedule` - Schedule page
- [ ] `/sales/earnings` - Earnings page
- [ ] `/sales/settings` - Settings (already French ✅)

#### Technician Pages
- [ ] `/technician` - Technician dashboard
- [ ] `/technician/schedule` - Schedule page
- [ ] `/technician/equipment` - Equipment check
- [ ] `/technician/earnings` - Earnings page
- [ ] `/technician/profile` - Profile page

#### Shared Components
- [ ] `components/TopBar.tsx` (already handles logo ✅)
- [ ] `components/BottomNavMobile.tsx` (check labels)
- [ ] `components/AppShell.tsx`
- [ ] Form components in `components/forms/`

### Translation Keys to Add

We'll need to expand `lib/i18n.ts` with:

```typescript
// Dashboard
"dashboard.title": "Tableau de bord"
"dashboard.stats.revenue": "Revenu"
"dashboard.stats.jobs": "Travaux"
"dashboard.stats.customers": "Clients"

// Dispatch
"dispatch.title": "Répartition"
"dispatch.assign": "Assigner"
"dispatch.unassigned": "Non assigné"

// Jobs
"jobs.title": "Travaux"
"jobs.status.pending": "En attente"
"jobs.status.completed": "Complété"

// Customers
"customers.title": "Clients"
"customers.add": "Ajouter un client"

// Buttons & Actions
"actions.save": "Sauvegarder"
"actions.cancel": "Annuler"
"actions.delete": "Supprimer"
"actions.edit": "Modifier"
"actions.export": "Exporter"
"actions.print": "Imprimer"
```

---

## Part B: Button Functionality Audit

### Methodology
1. Visit each page
2. Click every button
3. Document functionality status:
   - ✅ Working
   - ⚠️ Partial (works but has issues)
   - ❌ Non-functional (placeholder)
   - 🚫 Remove (not needed)

### Dashboard Buttons to Audit
- [ ] "Export" button
- [ ] "New job" button
- [ ] "Dispatch crew" button
- [ ] "Add customer" button
- [ ] "Build estimate" button
- [ ] "Export report" button
- [ ] All stat card links

### Dispatch/Schedule Buttons
- [ ] "Auto-assign" button
- [ ] "Reassign" button
- [ ] "View conflicts" button
- [ ] "Weather cancel" button
- [ ] "Calendar view" button
- [ ] "Add job" button

### Customer Page Buttons
- [ ] "Add customer" button
- [ ] "Export list" button
- [ ] "Import CSV" button
- [ ] "Search" functionality
- [ ] "Filter" options
- [ ] Individual customer action buttons

### Jobs Page Buttons
- [ ] "Create job" button
- [ ] "Export jobs" button
- [ ] "Filter by status" button
- [ ] "Assign technician" button
- [ ] Job action buttons (edit, delete, view)

### Invoices Page Buttons
- [ ] "Create invoice" button
- [ ] "Send invoice" button
- [ ] "Mark paid" button
- [ ] "Download PDF" button
- [ ] "Export list" button

### Team Page Buttons
- [ ] "Add member" button (redirects to /admin/users ✅)
- [ ] "View profile" button
- [ ] "Edit permissions" button (working ✅)

### Settings Buttons
- [ ] All save buttons (working ✅)
- [ ] Upload buttons (working ✅)
- [ ] Logout button (working ✅)

---

## Implementation Steps

### Step 1: Expand `lib/i18n.ts`
Add comprehensive translation keys for all pages

### Step 2: Create `useTranslation` Hook (Helper)
```typescript
// lib/hooks/useTranslation.ts
export function useTranslation() {
  const { t, language } = useLanguage();

  return {
    t,
    language,
    formatCurrency: (amount: number) => {
      return new Intl.NumberFormat(language === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: 'CAD'
      }).format(amount);
    },
    formatDate: (date: Date | string) => {
      return new Date(date).toLocaleDateString(
        language === 'fr' ? 'fr-CA' : 'en-CA',
        { day: 'numeric', month: 'long', year: 'numeric' }
      );
    }
  };
}
```

### Step 3: Update Each Page Systematically
For each page:
1. Import `useLanguage()` hook
2. Replace hardcoded strings with `t('key')`
3. Test language switching
4. Audit all buttons
5. Fix or remove non-functional buttons

### Step 4: Create Button Audit Report
Document all findings in `BUTTON_AUDIT_REPORT.md`

### Step 5: Fix Critical Non-Functional Buttons
Priority order:
1. P0: Core workflow buttons (create job, assign, complete)
2. P1: Important features (export, print, send invoice)
3. P2: Nice-to-have (import CSV, bulk actions)
4. P3: Remove placeholders

---

## Testing Strategy

### Manual Testing
- [ ] Visit each page as each role
- [ ] Switch language and verify all text changes
- [ ] Click every button and verify functionality
- [ ] Test all forms and inputs

### Automated Testing
```typescript
// tests/phase2-localization.test.tsx
describe("French Localization", () => {
  it("should translate all dashboard text", () => {
    // Test French
    render(<LanguageProvider><Dashboard /></LanguageProvider>);
    expect(screen.getByText("Tableau de bord")).toBeInTheDocument();

    // Switch to English
    changeLanguage("en");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});

// tests/phase2-buttons.test.tsx
describe("Button Functionality", () => {
  it("should create job when clicking 'New job'", async () => {
    // Test button click and API call
  });
});
```

---

## Success Criteria

### Phase 2 Complete When:
- [ ] All pages have French translations
- [ ] Language toggle works on all pages
- [ ] All critical buttons are functional
- [ ] Non-functional buttons are removed or disabled with tooltips
- [ ] Button audit report is complete
- [ ] All tests passing
- [ ] TypeScript clean
- [ ] Documentation updated

---

## Estimated Timeline

- **Part A (Localization):** 2-3 hours
  - Expand i18n.ts: 30 min
  - Update dashboard pages: 1 hour
  - Update role-specific pages: 1 hour
  - Testing: 30 min

- **Part B (Button Audit):** 2-3 hours
  - Audit all pages: 1 hour
  - Fix critical buttons: 1-2 hours
  - Testing: 30 min
  - Documentation: 30 min

**Total:** 4-6 hours of focused work

---

## Next: Start Part A - Localization

We'll begin by expanding `lib/i18n.ts` with comprehensive translation keys, then systematically update each page.
