---
name: test-generator
description: Generate Vitest tests with 100% coverage for API routes and components. Auto-runs tests and reports coverage.
---

# test-generator Skill
## Generate Vitest tests with 100% coverage

## When to use
After creating any API route or component

## Example
`/test-generator Create tests for app/api/sales/dashboard/route.ts`

## What it does
1. Reads source file
2. Generates complete Vitest suite
3. Includes success cases, error cases, edge cases
4. Runs npm run test automatically
5. Reports coverage %

## Quality checks
- 100% coverage
- All functions tested
- Success AND error paths
- Edge cases included
