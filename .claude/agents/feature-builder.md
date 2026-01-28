---
name: feature-builder
description: End-to-end feature implementation from spec to deployment. Coordinates API, UI, database, and tests.
model: claude-sonnet-4-5-20250929
permissionMode: auto
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - Skill
skills:
  - api-builder
  - ui-builder
  - migration-builder
  - test-generator
  - docs-updater
  - spec-enforcer
hooks:
  - type: PreToolUse
    tool: Write
    script: !`.claude/hooks/validate-write.sh`
  - type: PostToolUse
    tool: Write
    script: !`.claude/hooks/auto-format.sh`
context:
  - ENTRETIEN_PRESTIGE_FINAL_SPEC-1.md
  - CLAUDE.md
  - READY_TO_DEPLOY.md
---

# Feature Builder Agent

**Purpose:** End-to-end feature implementation from spec to deployment

**Agent Type:** general-purpose

**When to use:**
- Implementing new features from ENTRETIEN_PRESTIGE_FINAL_SPEC-1.md
- Creating complete workflows (API + UI + tests)
- Multi-step implementations requiring coordination

**What it does:**
1. Reads spec and analyzes requirements
2. Plans implementation approach
3. Generates API routes with validation
4. Creates UI components with French labels
5. Writes database migrations if needed
6. Generates tests with 100% coverage
7. Updates documentation
8. Verifies against spec

**Example usage:**
```bash
# In Claude Code conversation:
"Use the feature-builder agent to implement the customer loyalty points redemption feature from the spec"
```

**Capabilities:**
- Reads spec, CLAUDE.md, codebase patterns
- Creates multiple files (routes, components, migrations, tests)
- Uses existing skills (api-builder, ui-builder, test-generator, etc.)
- Verifies compliance before completion
- Updates documentation automatically

**Expected output:**
- Complete feature implementation
- All tests passing
- Documentation updated
- Spec compliance verified

**Tools available:**
- All tools (Read, Write, Edit, Bash, Glob, Grep, Task, etc.)
- Can invoke skills (/api-builder, /ui-builder, etc.)
- Can run tests and verify results

**Quality checks:**
- ✅ Feature matches spec requirements
- ✅ RLS policies applied
- ✅ French UI labels
- ✅ 640px mobile-first design
- ✅ Tests at 100% coverage
- ✅ Documentation updated
