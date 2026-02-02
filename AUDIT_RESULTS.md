# Comprehensive Audit Report

**Date:** 2026-02-02T05:17:51.126Z
**Server:** http://localhost:3000
**User:** jelidiadam12@gmail.com (admin)

---

## Summary

- ✅ **PASSED:** 22
- ❌ **FAILED:** 6
- ⚠️ **WARNINGS:** 0
- ℹ️ **INFO:** 18
- **TOTAL:** 46

---

## Auth

### ✅ Login

**URL:** `/login`

**Status:** PASS

**Message:** Login page loaded correctly

---

### ✅ Login

**URL:** `http://localhost:3000/dashboard`

**Status:** PASS

**Message:** Login successful - redirected to dashboard

---

## UI

### ✅ Global

**URL:** `http://localhost:3000/dashboard`

**Status:** PASS

**Message:** overflow-y is set correctly

---

### ✅ Global

**URL:** `http://localhost:3000/dashboard`

**Status:** PASS

**Message:** Page scrolls correctly

**Details:**
- Body height: 1590px
- Viewport: 844px
- Scrolled: 499.80950927734375px

---

### ❌ Bottom Nav

**URL:** `http://localhost:3000/dashboard`

**Status:** FAIL

**Message:** Bottom navigation not visible

---

## Page

### ✅ Dashboard

**URL:** `/dashboard`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 7
- Links: 5
- Inputs: 0

---

### ℹ️ Dashboard

**URL:** `/dashboard`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Export
- New job
- Dispatch crew
- Add customer

---

### ✅ Dispatch

**URL:** `/dispatch`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 9
- Links: 5
- Inputs: 7

---

### ℹ️ Dispatch

**URL:** `/dispatch`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Auto-assign
- New job
- Prev
- Today

---

### ✅ Customers

**URL:** `/customers`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 7
- Links: 5
- Inputs: 23

---

### ℹ️ Customers

**URL:** `/customers`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Add customer
- Save customer
- Save blacklist
- Submit complaint

---

### ✅ Jobs

**URL:** `/jobs`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 7
- Links: 5
- Inputs: 20

---

### ℹ️ Jobs

**URL:** `/jobs`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Create job
- Save job
- Assign job
- Update status

---

### ✅ Invoices

**URL:** `/invoices`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 5
- Links: 5
- Inputs: 13

---

### ℹ️ Invoices

**URL:** `/invoices`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- New invoice
- Save invoice
- Send invoice
- Record payment

---

### ✅ Reports

**URL:** `/reports`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 4
- Links: 7
- Inputs: 19

---

### ℹ️ Reports

**URL:** `/reports`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Save commission
- Save payroll
- Apply filters

---

### ❌ Team

**URL:** `/team`

**Status:** FAIL

**Message:** Page shows error

**Details:**
- Technicien · 5145550003

---

### ✅ Settings

**URL:** `/settings`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 1
- Links: 5
- Inputs: 0

---

### ✅ Sales Dashboard

**URL:** `/sales/dashboard`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 2
- Links: 6
- Inputs: 0

---

### ℹ️ Sales Dashboard

**URL:** `/sales/dashboard`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- ↻ Refresh

---

### ❌ Sales Leads

**URL:** `/sales/leads`

**Status:** FAIL

**Message:** Error loading page: page.goto: Timeout 15000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3000/sales/leads", waiting until "networkidle"[22m


---

### ✅ Sales Settings

**URL:** `/sales/settings`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 4
- Links: 5
- Inputs: 0

---

### ℹ️ Sales Settings

**URL:** `/sales/settings`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Français
- English
- Gérer les alertes

---

### ✅ Sales Schedule

**URL:** `/sales/schedule`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 2
- Links: 5
- Inputs: 0

---

### ℹ️ Sales Schedule

**URL:** `/sales/schedule`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Refresh

---

### ✅ Sales Earnings

**URL:** `/sales/earnings`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 2
- Links: 5
- Inputs: 0

---

### ℹ️ Sales Earnings

**URL:** `/sales/earnings`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Refresh

---

### ❌ Admin Users

**URL:** `/admin/users`

**Status:** FAIL

**Message:** Error loading page: locator.isVisible: Error: strict mode violation: locator('.content') resolved to 2 elements:
    1) <main class="content">…</main> aka getByRole('main')
    2) <div class="content">…</div> aka getByText('Gestion des utilisateurs+ Créer un utilisateurEmailNom completRô')

Call log:
[2m    - checking visibility of locator('.content')[22m


---

### ✅ Admin Manage

**URL:** `/admin/manage`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 7
- Links: 5
- Inputs: 77

---

### ℹ️ Admin Manage

**URL:** `/admin/manage`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Generate authenticator setup
- Disable two-factor
- Save settings
- Save role access

---

### ✅ Operations

**URL:** `/operations`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 4
- Links: 5
- Inputs: 16

---

### ℹ️ Operations

**URL:** `/operations`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- Save incident
- Save issue
- Save checklist

---

### ✅ Notifications

**URL:** `/notifications`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 1
- Links: 5
- Inputs: 0

---

### ✅ Inbox

**URL:** `/inbox`

**Status:** PASS

**Message:** Page loaded successfully

**Details:**
- Buttons: 2
- Links: 5
- Inputs: 0

---

### ℹ️ Inbox

**URL:** `/inbox`

**Status:** INFO

**Message:** Sample buttons

**Details:**
- ↻ Refresh

---

### ❌ Profile

**URL:** `/profile`

**Status:** FAIL

**Message:** Error loading page: locator.isVisible: Error: strict mode violation: locator('.content') resolved to 2 elements:
    1) <main class="content">…</main> aka getByRole('main')
    2) <div class="content">…</div> aka locator('div').filter({ hasText: /^Chargement\.\.\.$/ })

Call log:
[2m    - checking visibility of locator('.content')[22m


---

## Workflow

### ℹ️ Create Customer

**URL:** `/customers`

**Status:** INFO

**Message:** Add button found - clicking...

---

### ✅ Create Customer

**URL:** `/customers`

**Status:** PASS

**Message:** Customer creation form opened

**Details:**
- Modal: false
- Form: true

---

### ℹ️ Create Customer

**URL:** `/customers`

**Status:** INFO

**Message:** Form fields detected

**Details:**
- Name field: ❌
- Phone field: ❌
- Email field: ✅

---

### ❌ Create Lead

**URL:** `/sales/leads`

**Status:** FAIL

**Message:** Error: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3000/sales/leads", waiting until "networkidle"[22m


---

### ℹ️ Create Job

**URL:** `/jobs`

**Status:** INFO

**Message:** Add button found - clicking...

---

### ✅ Create Job

**URL:** `/jobs`

**Status:** PASS

**Message:** Job creation form opened

---

### ✅ Dispatch

**URL:** `/dispatch`

**Status:** PASS

**Message:** Calendar structure present

---

### ℹ️ Dispatch

**URL:** `/dispatch`

**Status:** INFO

**Message:** Auto-assign button found

---

### ℹ️ Dispatch

**URL:** `/dispatch`

**Status:** INFO

**Message:** Found 0 calendar events

---

