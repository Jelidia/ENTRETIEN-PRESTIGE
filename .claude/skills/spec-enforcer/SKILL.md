---
name: spec-enforcer
description: Verify code matches ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md requirements. Use before completing features or deploying.
argument-hint: "What to verify (e.g., 'Verify that photo upload matches spec')"
user-invocable: true
disable-model-invocation: false
allowed-tools:
  - Read
  - Grep
  - Glob
model: claude-sonnet-4-5-20250929
context: fork
agent: code-reviewer
hooks:
  - type: PreToolUse
    tool: Read
    condition: path.includes('ENTRETIEN_PRESTIGE_FINAL_SPEC')
    message: "Analyzing spec requirements..."
---

# spec-enforcer Skill
## Verify code matches ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md

## When to use
Before completing a feature, before deploying

## Example
`/spec-enforcer Verify that photo upload matches spec`

## What it does
1. Reads ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md
2. Checks your implementation
3. Lists what matches (✅), what's missing (⚠️), what's wrong (❌)
4. Suggests fixes if needed

## Quality checks
- All required fields present
- Validation matches spec
- French labels correct
- Mobile responsive
- Tests present where required by spec or changes
