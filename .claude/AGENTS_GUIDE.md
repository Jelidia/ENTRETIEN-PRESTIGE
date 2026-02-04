# Legacy Claude Code Agents (Archived)

This file is not maintained and may be inaccurate. For current agent guidance, use `docs/ai/codex/AGENTS.md`.

**Last Updated:** 2026-01-28
**Total Agents:** 6

---

## 🤖 What Are Agents?

Agents are specialized autonomous assistants that handle complex, multi-step tasks. Unlike skills (which generate code snippets), agents:
- Work independently to complete entire workflows
- Can use multiple tools and skills
- Make decisions and adjust their approach
- Handle tasks that require several steps
- Report back when complete

---

## 📋 Quick Reference

| Agent | Purpose | Complexity | Duration |
|-------|---------|------------|----------|
| `feature-builder` | End-to-end feature implementation | High | 10-30 min |
| `database-architect` | Database schema & migrations | Medium | 5-15 min |
| `qa-engineer` | Testing & coverage | Medium | 5-20 min |
| `bug-hunter` | Bug investigation & fixing | Medium | 5-15 min |
| `deploy-manager` | Deployment prep & verification | High | 10-20 min |
| `code-reviewer` | Code review & spec compliance | Medium | 5-15 min |

---

## 🚀 How to Use Agents

### In Claude Code Conversation:
Simply describe what you want, and Claude will automatically invoke the appropriate agent:

```
"Use the feature-builder agent to implement customer loyalty points redemption"
```

Or be more direct:
```
"I need to add a new table for tracking technician certifications. Can you help?"
→ Claude will invoke database-architect agent
```

### Agents vs Skills:
- **Skills** = Quick code generation (use `/skill-name`)
- **Agents** = Complex multi-step workflows (invoked automatically or explicitly)

---

## 📖 Detailed Agent Descriptions

### 1. 🏗️ Feature Builder

**Purpose:** Complete feature implementation from spec to tests

**When to use:**
- Implementing features from ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md
- Building complete workflows (backend + frontend + tests)
- Multi-component features requiring coordination

**What it does:**
1. ✅ Reads spec and repo constraints (RLS, validators, French UI, 5 tabs)
2. ✅ Plans implementation approach
3. ✅ Builds API routes (Auth → Validate in lib/validators.ts → RLS → Respond)
4. ✅ Creates UI (French, 640px max, BottomNavMobile, 5 tabs per role)
5. ✅ Writes migrations + RLS policies if needed
6. ✅ Adds targeted tests only when new logic or bug fixes require them
7. ✅ Updates documentation
8. ✅ Verifies against spec

**Example:**
```
"Use feature-builder to implement the subscription management feature with auto-billing and discounts"
```

**Expected Output:**
- API routes (POST, GET, PATCH, DELETE)
- React components with forms
- Database migration (if needed)
- Targeted tests for changed logic
- Updated docs/ai/claude/CLAUDE.md and docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md

**Typical Duration:** 15-30 minutes

---

### 2. 🗄️ Database Architect

**Purpose:** Database design, migrations, and RLS policies

**When to use:**
- Creating new tables
- Modifying existing schema
- Adding columns or indexes
- Setting up RLS policies
- Fixing multi-tenancy issues

**What it does:**
1. ✅ Analyzes database requirements
2. ✅ Designs schema with proper constraints
3. ✅ Generates timestamped migration files
4. ✅ Creates RLS policies with company_id filtering
5. ✅ Adds indexes for performance
6. ✅ Generates type-safe Supabase queries
7. ✅ Validates multi-tenancy isolation

**Example:**
```
"Use database-architect to create a table for tracking employee certifications with expiry dates"
```

**Expected Output:**
- SQL migration file: `supabase/migrations/YYYYMMDD_description.sql`
- RLS policies for multi-tenancy
- Sample Supabase queries
- Rollback statements
- Index recommendations

**Typical Duration:** 5-15 minutes

---

### 3. 🧪 QA Engineer

**Purpose:** Testing, quality assurance, coverage verification

**When to use:**
- Generating tests for new code
- Ensuring required coverage for changed code
- Finding untested edge cases
- Running test suites
- Verifying test quality

**What it does:**
1. ✅ Analyzes code to identify test gaps
2. ✅ Generates comprehensive test suites
3. ✅ Writes unit tests (lib/ functions)
4. ✅ Creates integration tests (API routes)
5. ✅ Writes component tests (React)
6. ✅ Runs targeted tests and reports relevant coverage
7. ✅ Identifies edge cases only where logic changed

**Example:**
```
"Use qa-engineer to generate tests for the admin user management endpoints"
```

**Expected Output:**
- Test files in tests/ directory
- Test execution results
- Suggestions for additional tests

**Typical Duration:** 10-20 minutes

---

### 4. 🔍 Bug Hunter

**Purpose:** Bug investigation, root cause analysis, and fixing

**When to use:**
- 404 errors or broken routes
- Wrong data displayed in UI
- Database queries returning incorrect results
- Permission/RLS issues
- API errors (400, 403, 500)

**What it does:**
1. ✅ Reproduces the bug
2. ✅ Investigates root cause
3. ✅ Identifies the minimal fix
4. ✅ Applies the fix
5. ✅ Verifies fix works
6. ✅ Adds a regression test when behavior changes and it adds value
7. ✅ Updates documentation

**Example:**
```
"Use bug-hunter to investigate why techs can see jobs from other companies"
```

**Expected Output:**
- Root cause analysis
- Code fix (minimal changes)
- Verification results
- Regression test (when appropriate)
- Explanation of what was wrong

**Typical Duration:** 5-15 minutes

---

### 5. 🚀 Deploy Manager

**Purpose:** Deployment preparation and verification

**When to use:**
- Preparing for production deployment
- Running pre-deploy checks
- Verifying deployment readiness
- Generating deployment checklist
- Post-deploy verification

**What it does:**
1. ✅ Runs pre-deploy checks (build, lint, tests)
2. ✅ Verifies environment variables
3. ✅ Checks database migrations
4. ✅ Reviews RLS policies
5. ✅ Validates rate limiting config
6. ✅ Generates deployment checklist
7. ✅ Updates docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md

**Example:**
```
"Use deploy-manager to verify we're ready to deploy to production"
```

**Expected Output:**
- Deployment readiness report
- List of blockers (if any)
- Updated docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md
- Deployment checklist
- Migration execution order
- Environment variable checklist

**Typical Duration:** 10-20 minutes

---

### 6. 👁️ Code Reviewer

**Purpose:** Code review against spec and best practices

**When to use:**
- Before merging features
- Verifying spec compliance
- Checking code quality
- Security audit
- Pattern consistency check

**What it does:**
1. ✅ Reads ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md
2. ✅ Reviews code against spec (48+ requirements)
3. ✅ Checks pattern consistency
4. ✅ Verifies security (RLS, auth, validation)
5. ✅ Ensures validation schemas are centralized in lib/validators.ts
6. ✅ Checks French UI labels
7. ✅ Reviews mobile-first design (640px)
8. ✅ Validates error handling
9. ✅ Generates review report

**Example:**
```
"Use code-reviewer to review the invoice management feature"
```

**Expected Output:**
- Code review report
- Compliance status (✅ ⚠️ ❌)
- List of issues found
- Recommendations for fixes
- Security concerns (if any)

**Typical Duration:** 5-15 minutes

---

## 🔄 Workflow Examples

### Creating a New Feature (Complete Flow):

1. **Plan & Implement:**
   ```
    "Use feature-builder to create a customer referral tracking system"
    ```
    → Agent creates API, UI, migrations, targeted tests

2. **Review:**
   ```
   "Use code-reviewer to verify the referral system matches spec"
   ```
   → Agent checks compliance

3. **Deploy Check:**
   ```
   "Use deploy-manager to verify we can deploy this feature"
   ```
   → Agent runs all checks

### Fixing a Complex Bug:

1. **Investigate:**
   ```
   "Use bug-hunter to find out why SMS messages aren't being sent to customers"
   ```
   → Agent traces the issue, identifies cause

2. **Test the Fix:**
   ```
   "Use qa-engineer to generate regression tests for the SMS fix"
   ```
   → Agent creates tests to prevent recurrence when needed

### Adding Database Tables:

1. **Design Schema:**
   ```
   "Use database-architect to add equipment_maintenance table tracking service dates and costs"
   ```
   → Agent creates migration + RLS + queries

2. **Review:**
   ```
   "Use code-reviewer to check if the RLS policies are correct"
   ```
   → Agent verifies security

---

## 🎯 Best Practices

### 1. Let Agents Work Autonomously
- Don't micromanage - agents make their own decisions
- Trust the agent to choose the right approach
- Review results after completion

### 2. Provide Clear Context
- Mention the feature name or issue clearly
- Reference spec sections if applicable
- Describe expected behavior

### 3. Chain Agents for Complex Tasks
- Use feature-builder → code-reviewer → qa-engineer
- Use database-architect → qa-engineer
- Use bug-hunter → qa-engineer

### 4. Always Review Agent Output
- Agents are powerful but should be reviewed
- Check that changes match your intent
- Run targeted tests after major changes; full suite before deploy

### 5. Use Agents for Multi-Step Tasks
- Single-file changes → Use skills or direct editing
- Multi-file workflows → Use agents
- Complex investigations → Use agents

---

## 📊 Agent vs Skill Decision Matrix

| Task Type | Use | Example |
|-----------|-----|---------|
| Generate single API route | **Skill** (`/api-builder`) | Create one endpoint |
| Generate API + UI + tests (if needed) | **Agent** (`feature-builder`) | Complete feature |
| Create one SQL migration | **Skill** (`/migration-builder`) | Add columns |
| Design schema + RLS + queries | **Agent** (`database-architect`) | New table with policies |
| Generate tests for one file | **Skill** (`/test-generator`) | Single test file |
| Improve coverage for changed areas | **Agent** (`qa-engineer`) | Find relevant gaps |
| Fix one bug | **Skill** (`/bug-fixer`) | Quick fix |
| Investigate complex bug | **Agent** (`bug-hunter`) | Root cause analysis |
| Translate UI text | **Skill** (`/french-ui-helper`) | Quick translations |
| Review entire feature | **Agent** (`code-reviewer`) | Full compliance check |

---

## 🛠️ Agent Locations

All agent definitions are located in:
```
.claude/agents/
├── feature-builder.md
├── database-architect.md
├── qa-engineer.md
├── bug-hunter.md
├── deploy-manager.md
└── code-reviewer.md
```

---

## 🔧 Technical Details

**Agent Capabilities:**
- Access all project files
- Run bash commands (npm, git, tests)
- Invoke skills when needed
- Make multiple file changes
- Run tests and verify results
- Update documentation automatically

**Agent Limitations:**
- Cannot access external APIs without credentials
- Cannot push to remote repositories (you must approve)
- Cannot modify git configuration
- Work within defined scope (no "scope creep")

---

## 📈 When to Create New Agents

Consider creating a new agent when:
1. A multi-step workflow repeats frequently
2. Task requires coordination across 5+ files
3. Decision-making is needed between steps
4. Task takes >15 minutes to complete manually
5. Pattern is complex but consistent

---

## 🆘 Troubleshooting

**Agent not completing:**
- Check that it has necessary permissions
- Verify required files exist (spec, migrations, etc.)
- Look for blocking errors in output

**Agent making wrong decisions:**
- Provide more specific context in prompt
- Reference specific spec sections
- Give examples of expected output

**Agent taking too long:**
- Agent may be waiting for external process (build, tests)
- Check if it's stuck on a failing test
- Consider breaking task into smaller pieces

---

**For more information, see individual agent files in `.claude/agents/[agent-name].md`**

---

## 📚 Related Documentation

- **SKILLS_GUIDE.md** - Quick code generation tools
- **docs/ai/claude/CLAUDE.md** - Project architecture and patterns
- **docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md** - Current deployment status
- **docs/spec/ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md** - Complete requirements
