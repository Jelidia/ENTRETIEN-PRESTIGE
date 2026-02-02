# Phase 1 Implementation - Test Plan

**Date:** 2026-01-31
**Status:** Implementation Complete, Testing in Progress

## What Was Implemented

### 1. Internationalization (i18n) System
- **Files Created:**
  - `lib/i18n.ts` - Translation system with French and English support
  - `contexts/LanguageContext.tsx` - React context for language state management
  - Updated `app/layout.tsx` - Added LanguageProvider wrapper

- **Features:**
  - French as default language (stored in localStorage)
  - English toggle available in settings
  - Comprehensive translation keys for all UI elements
  - Client-side language switching with persistence

### 2. New User Settings Page
- **File Updated:** `app/(app)/settings/page.tsx`
- **Features:**
  - Profile tab: Name, email, phone, role, avatar management
  - Security tab: Password change with strength indicator
  - Language tab: French/English toggle
  - Modal dialogs for editing profile fields
  - Avatar upload with preview
  - All text in French with i18n support

### 3. Admin Management Page
- **File Created:** `app/(app)/admin/manage/page.tsx`
- **Purpose:** Moved complex admin features (security, role permissions, user overrides) from settings
- **Features:**
  - Two-factor authentication setup
  - Role-based access control matrix
  - User-specific permission overrides
  - Notification settings

### 4. Enhanced Team Page
- **File Updated:** `app/(app)/team/page.tsx`
- **Features:**
  - Converted to client-side rendering
  - Added "Modifier permissions" button for each member
  - Permission edit modal with checkbox list
  - Reset to default role permissions option
  - Visual indicator for custom permissions
  - All French labels

### 5. CSS Enhancements
- **File Updated:** `app/globals.css`
- **Added:**
  - `.modal-overlay` - Full-screen overlay for modals
  - `.modal` - Modal container with scrolling
  - `.tab-button` - Tab navigation styles
  - `.pill` and `.tag` - Status badge styles

## Test Plan

### Test 1: Language Toggle
**Steps:**
1. Navigate to `/settings`
2. Click on "Langue" tab
3. Click "English" button
4. Verify UI changes to English
5. Refresh page - verify language persists
6. Click "Français" button
7. Verify UI returns to French

**Expected Result:**
- Language changes immediately
- Persists across page refresh
- All translated labels update correctly

**Status:** ⏳ Pending

---

### Test 2: Profile Management
**Steps:**
1. Navigate to `/settings`
2. On "Mon profil" tab, verify current name, email, phone, role display
3. Click "Modifier" next to name
4. Change name and save
5. Verify success message and name updates
6. Repeat for email and phone
7. Upload new avatar image
8. Verify avatar updates immediately

**Expected Result:**
- All profile fields update successfully
- Avatar upload works and displays new image
- Success messages appear for each update
- Changes persist after page refresh

**Status:** ⏳ Pending

---

### Test 3: Password Change
**Steps:**
1. Navigate to `/settings`
2. Click "Sécurité" tab
3. Enter current password
4. Enter new password (test strength indicator):
   - "test" → should show "Faible" (weak)
   - "Test1234" → should show "Moyen" (medium)
   - "Test1234!@#" → should show "Fort" (strong)
5. Enter confirm password (matching)
6. Click "Changer le mot de passe"
7. Verify success message
8. Wait 2 seconds
9. Verify redirect to login page

**Expected Result:**
- Password strength indicator updates correctly
- Success message appears
- Auto-logout after 2 seconds
- Can login with new password

**Status:** ⏳ Pending

---

### Test 4: Team Page - Permission Editing
**Steps:**
1. Login as admin or manager
2. Navigate to `/team`
3. Verify all team members are listed
4. Click "Modifier permissions" on a technician
5. Verify modal opens with current permissions
6. Toggle some permissions on/off
7. Click "Sauvegarder"
8. Verify success message
9. Close modal and reload page
10. Verify "Permissions personnalisées" badge appears
11. Re-open permissions modal
12. Click "Réinitialiser aux valeurs par défaut"
13. Verify success message and badge disappears

**Expected Result:**
- Modal opens smoothly
- Permissions update correctly in database
- Badge appears/disappears appropriately
- Reset function works

**Status:** ⏳ Pending

---

### Test 5: Admin Management Page
**Steps:**
1. Login as admin
2. Navigate to `/admin/manage`
3. Test 2FA setup:
   - Click "Generate authenticator setup"
   - Verify OTP auth string appears
   - Click "Disable two-factor"
   - Verify string disappears
4. Test role permissions:
   - Toggle some permissions for a role
   - Click "Save role access"
   - Verify success message
5. Test user overrides:
   - Select a team member
   - Toggle some permissions
   - Click "Save overrides"
   - Verify success message

**Expected Result:**
- All admin functions work
- Changes persist
- Appropriate success/error messages display

**Status:** ⏳ Pending

---

### Test 6: Logo Display
**Steps:**
1. Navigate to any page with TopBar
2. Verify logo.png displays correctly
3. If logo fails to load, verify fallback "EP" text appears

**Expected Result:**
- Logo displays at 140x40px
- Fallback works if image missing

**Status:** ⏳ Pending

---

### Test 7: Mobile Responsiveness
**Steps:**
1. Open DevTools and set viewport to 375x667 (iPhone SE)
2. Navigate through all pages:
   - `/settings`
   - `/team`
   - `/admin/manage`
3. Verify:
   - Modals are centered and scrollable
   - Tabs are horizontally scrollable
   - All buttons are accessible
   - Text doesn't overflow
   - Images scale correctly

**Expected Result:**
- All pages work on mobile (max-width: 640px)
- No horizontal scrolling
- All interactive elements accessible

**Status:** ⏳ Pending

---

### Test 8: Error Handling
**Steps:**
1. Test profile update with invalid data:
   - Empty name
   - Invalid email format
   - Phone with special characters
2. Test password change:
   - Incorrect current password
   - Mismatched confirmation
   - Password too short
3. Test permission update:
   - As non-admin user
   - For non-existent user

**Expected Result:**
- Appropriate error messages display
- No crashes or console errors
- User can retry with correct data

**Status:** ⏳ Pending

---

## Bug Tracking

### Known Issues
1. ⚠️ Language context might cause hydration mismatch (mounted check added to prevent)
2. ⚠️ Avatar upload requires valid Supabase storage configuration
3. ⚠️ Email/phone update endpoints may not exist yet (needs verification)

### Issues Found During Testing
(To be filled in during testing)

---

## Next Steps After Phase 1

### Phase 2: French Localization & Button Audit
1. Audit all pages for non-functional buttons
2. Translate all remaining English text to French
3. Test complete user workflows
4. Add territory management for sales reps

### Phase 3: End-to-End Testing
1. Create Playwright test suite
2. Test complete user journeys
3. Fix all discovered bugs
4. Performance testing

---

## Completion Criteria

Phase 1 is considered complete when:
- [ ] All 8 tests pass
- [ ] No console errors
- [ ] Build succeeds with no TypeScript errors
- [ ] Mobile responsiveness verified
- [ ] All modals and forms function correctly
- [ ] Language toggle works and persists
- [ ] Avatar upload works with Supabase
- [ ] Password change flow works end-to-end
- [ ] Permission editing saves correctly

**Current Status:** 🚧 Implementation complete, testing in progress
