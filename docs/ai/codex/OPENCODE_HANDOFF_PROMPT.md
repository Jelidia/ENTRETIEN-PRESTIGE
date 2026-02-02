# ENTRETIEN PRESTIGE - AI Agent Handoff Prompt

**Copy everything below this line to continue the work with OpenCode/Codex:**

---

# Context: Quebec Cleaning Company ERP

**Stack:** Next.js 14 App Router, TypeScript, Supabase (PostgreSQL + RLS), Tailwind
**Directory:** `C:\Users\adam\OneDrive\CODE\ENTRETIEN PRESTIGE`
**Language:** French UI, English code

---

## WHAT WAS JUST FIXED (2026-02-02)

### 1. ⚠️ Scrolling Bug (VERIFY THIS FIRST!)
User reported vertical scroll frozen. Applied fix:
- File: `app/globals.css` lines 43-115
- Changed `.shell` and `.app-body` from `min-height: 100vh` → `height: 100vh`
- Added `overflow-y: auto` and `flex: 1` to `.content`

**YOU MUST VERIFY:** Open http://localhost:3000/dashboard and check if you can scroll up/down

### 2. Team Page 400 Errors
- File: `app/api/users/route.ts`
- Problem: RLS policy blocked reading other users
- Fix: Changed to `createAdminClient()` with `company_id` filter

### 3. Duplicate .content Wrappers
- Fixed: `app/(app)/admin/users/page.tsx`
- Fixed: `app/(app)/profile/page.tsx`
- Removed extra `.content` divs (AppShell already provides one)

### 4. Other Completed Fixes
- Bottom nav invisible → Added credentials to fetch in `components/BottomNavMobile.tsx`
- Lead form → Created `components/forms/LeadForm.tsx`
- Device detection → Created `lib/deviceDetection.ts` + `contexts/DeviceContext.tsx`

---

## YOUR TASKS (Priority Order)

### 1. VERIFY SCROLLING WORKS
```bash
npm run dev
```
Test these pages for vertical scrolling:
- [ ] /dashboard
- [ ] /team
- [ ] /profile
- [ ] /admin/users

**If still frozen:** Check `app/globals.css`. The `.content` class needs `overflow-y: auto` with a fixed height parent.

### 2. Test Team Page
- Go to /team
- Open DevTools Network tab
- Verify `/api/users` returns 200 (not 400)
- Verify team members display

### 3. Remaining Tests Needed
- Job creation workflow
- Dispatch calendar
- Team member creation
- 7 technician pages (untested)

---

## KEY ARCHITECTURE

```
app/                  # Next.js App Router
  (app)/              # Protected routes (require login)
  api/                # API routes
components/           # Shared UI
  AppShell.tsx        # Layout wrapper (adds .content)
  BottomNavMobile.tsx # 5-tab navigation
lib/
  auth.ts             # requireUser/requireRole/requirePermission
  supabaseServer.ts   # createUserClient/createAdminClient
  validators.ts       # All Zod schemas (NEVER inline!)
```

### API Pattern
```typescript
export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin"], "permission");
  if ("response" in auth) return auth.response;

  const client = createAdminClient(); // Bypasses RLS
  // OR: createUserClient(token) for RLS-enforced queries

  const { data } = await client.from("table").select("*")
    .eq("company_id", auth.profile.company_id); // Multi-tenant!

  return NextResponse.json({ success: true, data });
}
```

---

## CRITICAL RULES

1. **Mobile-first only** - 640px max width, bottom nav (no sidebar)
2. **French labels** - Quebec French for all UI
3. **5 tabs per role** - Admin/Manager/Sales/Technician have different tabs
4. **Zod in validators.ts** - Never create inline schemas
5. **RLS caution** - `users` table has strict RLS, use admin client when needed

---

## Quick Start

```bash
cd "C:\Users\adam\OneDrive\CODE\ENTRETIEN PRESTIGE"
npm run dev
# Open http://localhost:3000
# Login: admin@example.com / Admin@123
```

---

## Docs to Read

1. `docs/ai/agents/AGENTS.md` - OpenCode/Codex agent context
2. `docs/changes/FIXES_APPLIED_2026-02-02.md` - Today's fixes
3. `docs/testing/MANUAL_TEST_CHECKLIST.md` - Testing steps
4. `docs/status/COMPREHENSIVE_FIX_STATUS.md` - Overall status

---

**START:** Verify scrolling first, then continue testing. Good luck!
