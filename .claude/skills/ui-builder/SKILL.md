---
name: ui-builder
description: Generate mobile-first React components with 640px max width, Tailwind CSS, and French labels. Use for creating pages or components.
---

# ui-builder Skill
## Generate mobile-first React components

## When to use
Creating pages (app/*/page.tsx) or components

## Example
`/ui-builder Create PhotoUpload component for jobs`

## What it does
1. Reads system-prompt (640px mobile-first rule)
2. Checks AGENTS.md (French labels)
3. Generates complete component
4. Tailwind CSS only
5. Returns ONLY code

## Quality checks
- 640px max width default
- Responsive (md: breakpoints)
- French labels (dict.locale)
- Zod form validation
- Accessibility (ARIA, keyboard)
