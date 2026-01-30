---
name: test-generator
description: Generate targeted Vitest tests for changed logic in API routes and components. Runs focused tests when needed.
argument-hint: "File path to test (e.g., 'Create tests for app/api/sales/dashboard/route.ts')"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
model: claude-sonnet-4-5-20250929
context: fork
agent: qa-engineer
hooks:
  - type: PostToolUse
    tool: Write
    condition: path.includes('tests/') || path.includes('.test.ts')
    script: !`npm test -- --run ${path}`
  - type: PostToolUse
    tool: Bash
    condition: command.includes('npm test')
    script: !`.claude/hooks/check-coverage.sh`
---

# test-generator Skill
## Generate Vitest tests with 100% coverage

## When to use
After adding logic or fixing behavior where a test adds value

## Example
`/test-generator Create tests for app/api/sales/dashboard/route.ts`

## What it does
1. Reads source file
2. Generates complete Vitest suite
3. Includes success cases, error cases, edge cases
4. Runs targeted tests when requested
5. Reports coverage for touched code

## Quality checks
- Coverage meets repo thresholds for touched code
- All relevant functions tested
- Success AND error paths
- Edge cases included
