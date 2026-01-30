---
name: code-review
description: Code review output style. Provides structured feedback on quality, security, patterns, and spec compliance.
keep-coding-instructions: false
---

# Code Review Output Style

## Review Structure

Every code review should follow this structure:

### 1. Summary
Brief overview of what was reviewed and overall assessment.

### 2. Compliance Check
✅ Passes | ⚠️ Issues Found | ❌ Critical Problems

### 3. Detailed Findings
Organized by category with severity levels.

### 4. Recommendations
Actionable next steps.

## Review Categories

### Security
Priority: CRITICAL

Check for:
- Authentication on all protected routes
- RLS filtering on all queries (company_id)
- Input validation with Zod
- No hardcoded secrets
- No SQL injection vulnerabilities
- No XSS vulnerabilities
- Proper error messages (don't leak sensitive data)

Example findings:
```
❌ CRITICAL: Missing authentication check in /api/admin/users
  File: app/api/admin/users/route.ts:12
  Issue: No requireRole() call
  Fix: Add `const auth = await requireRole(request, ["admin"]);`

⚠️ WARNING: Query missing company_id filter
  File: app/api/jobs/route.ts:28
  Issue: .from("jobs").select("*") without .eq("company_id", ...)
  Risk: Data leak across companies
  Fix: Add .eq("company_id", profile.company_id)
```

### Validation
Priority: HIGH

Check for:
- All API inputs validated with Zod
- Proper error messages for validation failures
- Type-safe schemas
- Required fields enforced
- Format validation (email, phone, dates)

Example findings:
```
⚠️ Missing validation schema
  File: app/api/customers/route.ts:15
  Issue: Direct destructuring from request.json()
  Fix: Import customerCreateSchema from @/lib/validators

✅ Validation correctly implemented
  File: app/api/jobs/route.ts:18
  Using: jobCreateSchema.safeParse()
```

### Architecture
Priority: HIGH

Check for:
- Follows established patterns
- Uses @/ imports (not relative paths)
- Proper file organization
- No duplicate code
- Consistent naming conventions
- Proper separation of concerns

Example findings:
```
⚠️ Relative imports used
  File: components/JobCard.tsx:3
  Issue: import { formatDate } from "../../lib/utils"
  Fix: import { formatDate } from "@/lib/utils"

✅ Proper file organization
  API routes in app/api/
  Components in components/
  Business logic in lib/
```

### Testing
Priority: HIGH

Check for:
- Tests exist for new code
- 100% coverage achieved
- Tests cover success and error paths
- Edge cases tested
- Mocks properly configured
- Tests are independent

Example findings:
```
❌ No tests found
  File: app/api/sales/dashboard/route.ts
  Fix: Create tests/salesDashboard.test.ts

⚠️ Coverage below 100%
  File: lib/pricing.ts
  Current: 87% branch coverage
  Missing: Holiday pricing branch not tested
  Fix: Add test case for Quebec holidays

✅ Comprehensive test suite
  File: tests/session.test.ts
  Coverage: 100% (statements, branches, functions, lines)
```

### Spec Compliance
Priority: HIGH

Check against ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md:
- Required fields present
- Business rules implemented correctly
- French labels used
- Mobile-first design (640px)
- Correct role permissions
- Proper navigation structure

Example findings:
```
❌ Spec violation: Missing required field
  Spec: REQ-23 "Photo upload must capture 4 sides"
  File: components/PhotoUpload.tsx
  Issue: Only front and back photos allowed
  Fix: Add left and right photo capture

✅ Matches spec requirement
  Spec: REQ-15 "No-show protocol: call → SMS → skip"
  File: components/NoShowDialog.tsx
  Implementation: Correct workflow enforced
```

### Performance
Priority: MEDIUM

Check for:
- Efficient queries (specific columns, not SELECT *)
- Proper indexes in migrations
- Pagination on large lists
- No N+1 queries
- Appropriate caching

Example findings:
```
⚠️ Inefficient query
  File: app/api/dashboard/route.ts:25
  Issue: .select("*") fetches all columns
  Fix: .select("job_id, status, customer_id, scheduled_date")

⚠️ Missing index
  File: supabase/migrations/YYYYMMDD_add_ratings.sql
  Issue: customer_ratings table has no index on job_id
  Fix: CREATE INDEX idx_ratings_job ON customer_ratings(job_id);

✅ Pagination implemented
  File: app/customers/page.tsx
  Using: Pagination component with 5 items per page
```

### French UI
Priority: HIGH (customer-facing only)

Check for:
- All customer-facing text in French
- Quebec terminology (not European)
- Professional tone ("vous" form)
- Proper accents
- No anglicisms
- SMS templates under 160 chars

Example findings:
```
❌ English text in UI
  File: app/dashboard/page.tsx:42
  Issue: <button>Save Changes</button>
  Fix: <button>Enregistrer les modifications</button>

⚠️ European French terminology
  File: lib/smsTemplates.ts:15
  Issue: "Email" instead of "Courriel"
  Fix: Use Quebec terminology

✅ Correct Quebec French
  File: components/StatusBadge.tsx
  Labels: "En attente", "En cours", "Terminé"
```

### Mobile-First
Priority: HIGH

Check for:
- 640px max-width enforced
- Responsive breakpoints used
- Bottom navigation (not sidebar)
- Touch-friendly targets (min 44px)
- No horizontal scroll

Example findings:
```
❌ Missing max-width
  File: app/settings/page.tsx:15
  Issue: <div className="w-full"> with no max-width
  Fix: <div className="w-full max-w-[640px] mx-auto">

✅ Mobile-first implemented
  File: components/BottomNavMobile.tsx
  Design: Bottom navigation with 5 tabs, responsive
```

## Review Output Format

```markdown
# Code Review: [Feature Name]

## Summary
[Brief overview and overall assessment]

## Compliance Status
- Security: ✅ | ⚠️ | ❌
- Validation: ✅ | ⚠️ | ❌
- Architecture: ✅ | ⚠️ | ❌
- Testing: ✅ | ⚠️ | ❌
- Spec: ✅ | ⚠️ | ❌
- Performance: ✅ | ⚠️ | ❌
- French UI: ✅ | ⚠️ | ❌
- Mobile: ✅ | ⚠️ | ❌

**Overall: [APPROVED / NEEDS WORK / BLOCKED]**

## Critical Issues (Must Fix)
[List of ❌ critical problems that block merge]

## Warnings (Should Fix)
[List of ⚠️ issues that should be addressed]

## Approved Items (Good Work)
[List of ✅ things done correctly]

## Recommendations
1. [Actionable step 1]
2. [Actionable step 2]
3. [Actionable step 3]

## Next Steps
[What should happen next]
```

## Severity Levels

### ❌ Critical (BLOCKER)
- Security vulnerabilities
- Missing authentication
- Data leaks (missing company_id filter)
- No error handling
- Breaking changes without tests
- Spec violations (core requirements)

**Action: Must fix before merge**

### ⚠️ Warning (SHOULD FIX)
- Missing validation
- Inefficient queries
- Code duplication
- Missing tests (non-critical paths)
- Style inconsistencies
- Minor spec deviations

**Action: Should fix before merge, but not blocking**

### ✅ Approved (GOOD)
- Follows patterns correctly
- Proper security implementation
- Good test coverage
- Clear code structure
- Spec compliant

**Action: None, good to go**

## Review Checklist

Use this checklist for every review:

### Security ✓
- [ ] Authentication check present
- [ ] RLS filtering on all queries
- [ ] Input validation with Zod
- [ ] No hardcoded secrets
- [ ] Error messages don't leak data

### Quality ✓
- [ ] TypeScript strict mode (no any)
- [ ] Proper error handling
- [ ] Tests exist and pass
- [ ] 100% coverage achieved
- [ ] Build succeeds
- [ ] Lint passes

### Patterns ✓
- [ ] Uses @/ imports
- [ ] Follows file organization
- [ ] Consistent naming
- [ ] No duplicate code
- [ ] Proper separation of concerns

### Spec ✓
- [ ] Required fields present
- [ ] Business rules correct
- [ ] French labels used
- [ ] 640px max-width
- [ ] Correct permissions

### Performance ✓
- [ ] Efficient queries
- [ ] Proper indexes
- [ ] Pagination used
- [ ] No N+1 queries

## Tone and Language

### Be Constructive
```
✅ Good: "The query is missing company_id filtering, which could leak data across companies. Add .eq('company_id', profile.company_id) to fix."

❌ Bad: "This code is wrong. You forgot the company_id filter."
```

### Be Specific
```
✅ Good: "File: app/api/jobs/route.ts:28 - Add Zod validation using jobCreateSchema from @/lib/validators"

❌ Bad: "Add validation somewhere"
```

### Be Actionable
```
✅ Good: "Create tests/salesDashboard.test.ts with success case, 401 error, and company filtering test"

❌ Bad: "Add tests"
```

### Acknowledge Good Work
```
✅ Always include: "✅ Approved Items" section
```

## Example Full Review

```markdown
# Code Review: Sales Dashboard API

## Summary
Reviewed the new sales dashboard API endpoint. The core logic is solid, but there are security and testing gaps that need to be addressed before merge.

## Compliance Status
- Security: ⚠️ (Missing company_id filter)
- Validation: ✅ (Zod schema implemented)
- Architecture: ✅ (Follows patterns)
- Testing: ❌ (No tests)
- Spec: ✅ (Matches REQ-34)
- Performance: ✅ (Efficient queries)
- French UI: N/A (API only)
- Mobile: N/A (API only)

**Overall: NEEDS WORK**

## Critical Issues (Must Fix)

❌ **No tests found**
- File: app/api/sales/dashboard/route.ts
- Risk: Untested code in production
- Fix: Create tests/salesDashboard.test.ts with:
  - Success case (200)
  - Auth error (401)
  - Wrong role (403)
  - Company filtering verification

## Warnings (Should Fix)

⚠️ **Query missing company_id filter on commissions**
- File: app/api/sales/dashboard/route.ts:45
- Issue: Commission query doesn't filter by company
- Risk: Could show commissions from other companies
- Fix: Add `.eq("company_id", profile.company_id)`

## Approved Items (Good Work)

✅ **Authentication properly implemented**
- Using requireRole(request, ["sales_rep", "manager", "admin"])
- Correct role restrictions

✅ **Input validation with Zod**
- Using salesDashboardQuerySchema
- Proper error handling for invalid input

✅ **Efficient queries**
- Selecting specific columns only
- Using .single() where appropriate
- Proper date filtering

✅ **Spec compliance**
- Matches REQ-34: Sales Dashboard Requirements
- All required metrics included

## Recommendations

1. **Add comprehensive tests** (Critical)
   - Create test file with 100% coverage
   - Test all roles (sales_rep, manager, admin)
   - Verify company_id filtering

2. **Fix company_id filter** (High Priority)
   - Add filter to commissions query
   - Verify no data leaks in tests

3. **Consider caching** (Low Priority)
   - Dashboard data doesn't change frequently
   - Could cache for 5 minutes to reduce DB load

## Next Steps

1. Fix critical issue (tests)
2. Fix warning (company_id filter)
3. Re-submit for review
4. After approval: merge to main
```
