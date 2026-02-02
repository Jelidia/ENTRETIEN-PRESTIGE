---
name: ui-builder
description: Generate mobile-first React components with 640px max width, Tailwind CSS, and French labels. Use for creating pages or components.
argument-hint: "Component description (e.g., 'Create PhotoUpload component for jobs')"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
model: claude-sonnet-4-5-20250929
context: fork
agent: feature-builder
hooks:
  - type: PreToolUse
    tool: Write
    condition: path.includes('components/') || path.includes('/page.tsx')
    message: "Remember: 640px max-width, French labels, BottomNavMobile, 5 tabs per role"
  - type: PostToolUse
    tool: Write
    condition: path.includes('components/') || path.includes('/page.tsx')
    script: !`.claude/hooks/validate-ui-component.sh`
  - type: PostToolUse
    tool: Write
    script: !`npx prettier --write ${path}`
---

# ui-builder Skill
## Generate mobile-first React components

## When to use
Creating pages (app/*/page.tsx) or components

## Example
`/ui-builder Create PhotoUpload component for jobs`

## What it does
1. Reads system-prompt (640px mobile-first rule)
2. Checks docs/ai/claude/CLAUDE.md (French labels, BottomNavMobile)
3. Preserves BottomNavMobile and 5-tab constraint when touching navigation
4. Generates complete component
5. Tailwind CSS only
6. Returns ONLY code

## Quality checks
- 640px max width default
- Responsive (md: breakpoints)
- French labels (dict.locale)
- Zod form validation
- Accessibility (ARIA, keyboard)
- BottomNavMobile present on pages
- Navigation stays at exactly 5 tabs per role
