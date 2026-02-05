---
name: docs-updater
description: Update docs/ai/codex/AGENTS.md, README.md, and docs/tasks/DOCS_TASK_LIST.md after completing features. Keeps documentation synchronized with codebase changes.
argument-hint: "What changed (e.g., 'Update docs: added loyalty points redemption feature')"
user-invocable: true
disable-model-invocation: false
allowed-tools:
  - Read
  - Edit
  - Bash
  - Grep
  - Glob
model: claude-sonnet-4-5-20250929
context: fork
agent: deploy-manager
hooks:
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
3. Updates task status in docs/tasks/DOCS_TASK_LIST.md
4. Updates architecture and repo rules in docs/ai/codex/AGENTS.md
5. Updates feature status from pending to completed
6. Maintains consistent formatting

## Quality checks
- Update "Current Status" date to today
- Increment completion percentage if features added
- Mark completed features appropriately
- Update API endpoint counts
- Add new routes to "Critical Files" section
- Keep examples concise and accurate

## Files to update

### docs/ai/codex/AGENTS.md
- Architecture section (new routes, components)
- Repo rules and non-negotiables
- Key entry points and diagnostics

### README.md (if exists)
- Feature list
- Setup instructions
- New environment variables

### docs/tasks/DOCS_TASK_LIST.md
- Task completion status
- New completed items
- Known issues or blockers

## Example output
```markdown
## Current Status (2026-01-28)

**Overall Progress:** ~80% Complete (+10% from last update)

**Foundation:** 100% complete
- Authentication, database, RLS, rate limiting, permissions all working

**Newly Completed:**
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
