# Testing Quick Start Guide
**Created:** 2026-02-02
**Server Running:** ✅ http://localhost:3000

---

## ✅ Critical Scrolling Bug - FIXED!

The page scrolling issue has been resolved. The website should now scroll normally on all devices.

**What was fixed:** Added `overflow-y: auto` to `.app-body` in `app/globals.css`

---

## 🚀 Quick Test Commands

### 1. Manual Browser Testing (Recommended First)
```bash
npx tsx tests/manual-comprehensive-test.ts
```
This will:
- Open Chrome browser (visible)
- Login automatically
- Test all 27 pages
- Check scrolling
- Verify bottom navigation
- Log results to console
- **Leave browser open for you to inspect**

### 2. Automated E2E Tests
```bash
npx playwright test comprehensive-site-test --headed
```
This runs automated tests with visible browser.

### 3. Unit Tests
```bash
npm test
```
All unit tests should pass (currently 10/10 passing).

---

## 🔐 Test Login Credentials

Use these credentials to login manually:

**Admin:**
- Email: `jelidiadam12@gmail.com`
- Password: `Prestige2026!`

**Manager:**
- Email: `youssef.takhi@hotmail.com`
- Password: `Prestige2026!`

**Sales Rep:**
- Email: `jelidiadam12+2@gmail.com`
- Password: `Prestige2026!`

**Technician:**
- Email: `jelidiadam12+1@gmail.com`
- Password: `Prestige2026!`

---

## 📝 Manual Testing Checklist

### Test 1: Verify Scrolling Fix
1. Open http://localhost:3000 in your browser
2. Login with admin credentials above
3. **Try scrolling down the page**
4. ✅ Page should scroll smoothly
5. Try on multiple pages (dashboard, customers, jobs, etc.)

### Test 2: Create a Lead
1. Navigate to **Sales** → **Leads** (`/sales/leads`)
2. Click **"Add Lead"** or **"Nouveau Lead"** button
3. Fill in the form:
   - Name: "Test Lead"
   - Company: "Test Company"
   - Phone: "514-555-1234"
   - Email: "test@example.com"
4. Submit the form
5. ✅ Lead should appear in the list

### Test 3: Create a Customer
1. Navigate to **Customers** (`/customers`)
2. Click **"Add Customer"** or **"Ajouter Client"** button
3. Fill in the form:
   - Name: "Jean Tremblay"
   - Phone: "514-555-5678"
   - Email: "jean@example.com"
   - Address: "123 Rue St-Laurent, Montreal, QC"
4. Submit the form
5. ✅ Customer should appear in the list

### Test 4: Create a Team Member
1. Navigate to **Team** (`/team`)
2. Click **"Add Member"** button
3. Should redirect to `/admin/users`
4. Fill in the form:
   - Name: "New Technician"
   - Email: "newtech@example.com"
   - Role: Select "Technician"
   - Password: "TempPass123!"
5. Submit the form
6. ✅ New user should appear in team list

### Test 5: Create a Job
1. Navigate to **Jobs** (`/jobs`)
2. Click **"Create Job"** or **"Créer Travail"** button
3. Fill in the form:
   - Customer: Select from dropdown
   - Service Type: e.g., "Regular Cleaning"
   - Date: Select tomorrow
   - Time: Select a time
   - Technician: Assign a tech
4. Submit the form
5. ✅ Job should appear in the list

### Test 6: Test Dispatch Calendar
1. Navigate to **Dispatch** (`/dispatch`)
2. Try clicking **"Auto-Assign"** button
3. Try dragging a job card to a different technician
4. Try clicking on an empty calendar cell to create a job
5. ✅ Document what works and what doesn't

### Test 7: Test Bottom Navigation
1. Stay on any page
2. Look at the bottom of the screen
3. ✅ Should see exactly 5 navigation tabs
4. Click each tab
5. ✅ Each should navigate to a different page
6. ✅ Active tab should be highlighted

### Test 8: Test Language Toggle
1. Navigate to **Settings** (`/settings`)
2. Click on **Preferences** tab
3. Click the language toggle button
4. ✅ UI text should switch between French and English
5. Navigate to another page
6. ✅ Language preference should persist

---

## 📊 What to Document

As you test, document in `BUTTON_AUDIT_REPORT.md`:

**For each button/feature:**
- ✅ **Working** - Functions as expected
- ⚠️ **Partial** - Works but has issues
- ❌ **Broken** - Doesn't work or throws error
- 🚫 **Remove** - Should be removed (placeholder)

**Example:**
```markdown
| Add Customer button | Button | Top-right | Open modal | ✅ | P0 | Works perfectly |
| Export button | Button | Toolbar | Download CSV | ❌ | P1 | Returns 404 error |
```

---

## 🐛 Known Issues to Watch For

From previous analysis, these features might be incomplete:

1. **Job Photo Upload** - May have path/storage issues
2. **Invoice PDF** - May be missing some fields (taxes, multiple pages)
3. **Auto-Assign** - Algorithm may not be fully implemented
4. **Export Buttons** - Many might return 404 (API not created)
5. **Real-time Updates** - Dispatch board may not update live

---

## 📁 Documentation Files

After testing, update these files:

1. **docs/audit/BUTTON_AUDIT_REPORT.md**
   - Update status column for each tested button
   - Add notes about bugs found

2. **docs/status/COMPREHENSIVE_FIX_STATUS.md**
   - Update "Pages Requiring Detailed Audit" section
   - Check off completed items

---

## 🎯 Success Criteria

Testing is complete when:

- [x] Scrolling bug verified as fixed
- [ ] All 27 pages visited and tested
- [ ] Can create: Lead, Customer, Team Member, Job
- [ ] All critical (P0) buttons tested
- [ ] Button audit report updated with findings
- [ ] List of broken features documented
- [ ] Can identify what needs to be fixed next

---

## 💡 Pro Tips

1. **Use Chrome DevTools (F12)** to check for console errors
2. **Test in mobile view (390px width)** using DevTools device toolbar
3. **Take screenshots** of any broken features
4. **Note the exact error messages** if any appear
5. **Test with different roles** (admin, manager, sales_rep, technician)

---

## 🆘 Troubleshooting

**If dev server stopped:**
```bash
npm run dev
```

**If login doesn't work:**
- Check if you're being redirected to 2FA page
- Try a different test user
- Check browser console for errors

**If pages show errors:**
- Note the error message
- Check browser console
- Document in BUTTON_AUDIT_REPORT.md

**If tests fail:**
- Check that dev server is running on port 3000
- Verify test credentials are correct
- Check for TypeScript errors: `npm run typecheck`

---

## 📞 Next Steps After Testing

1. Review your findings in BUTTON_AUDIT_REPORT.md
2. Prioritize bugs (P0 → P1 → P2)
3. Create GitHub issues or task list for fixes
4. Start fixing P0 bugs (critical workflow blockers)
5. Re-test after fixes
6. Move on to Phase 3 (French localization)

---

**Happy Testing! 🚀**

Any issues found will help make the app production-ready.
