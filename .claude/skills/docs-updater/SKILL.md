---
name: docs-updater
description: Update CLAUDE.md, README.md, and READY_TO_DEPLOY.md after completing features. Keeps documentation synchronized with codebase changes.
---

# docs-updater Skill
## Update project documentation after changes

## When to use
After completing features, fixing bugs, or making significant changes to the codebase

## Example
`/docs-updater Update docs: completed admin user management panel, settings page with file uploads, and phone auto-login`

## What it does
1. Reads current documentation files
2. Updates relevant sections with completed work
3. Increments progress percentages in READY_TO_DEPLOY.md
4. Adds new API endpoints to CLAUDE.md
5. Updates feature status from ⚠️ to ✅
6. Maintains consistent formatting

## Quality checks
- Update "Current Status" date to today
- Increment completion percentage if features added
- Mark incomplete features as ⚠️ or ❌
- Mark completed features as ✅
- Update API endpoint counts
- Add new routes to "Critical Files" section
- Keep examples concise and accurate

## Files to update

### CLAUDE.md
- Architecture section (new routes, components)
- API endpoint list
- Critical Files section
- Current Status percentage

### README.md (if exists)
- Feature list
- Setup instructions
- New environment variables

### READY_TO_DEPLOY.md
- Progress percentage (~XX% complete)
- Feature completion status
- New completed items marked ✅
- Known issues or blockers

## Example output
```markdown
## Current Status (2026-01-28)

**Overall Progress:** ~80% Complete ✅ (+10% from last update)

**Foundation:** 100% complete ✅
- Authentication, database, RLS, rate limiting, permissions all working

**Newly Completed:** ✅
- Admin user management panel (CRUD with French UI)
- User settings page (documents, security, profile tabs)
- File upload API (contract, ID photo, profile photo)
- Password change with strength indicator
- Phone auto-login with localStorage caching
- Logout with confirmation modal

**Critical Issues:** (none - all addressed)

**Next Steps:**
- Test file uploads with Supabase Storage
- Add navigation link to /profile page
- Deploy to staging environment
```
