# Claude Code Skills Guide

**Last Updated:** 2026-01-28
**Total Skills:** 10

This document lists all available skills for the Entretien Prestige project and how to use them.

---

## 📋 Quick Reference

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `api-builder` | Generate API routes | Creating new endpoints |
| `bug-fixer` | Debug and fix bugs | 404 errors, broken features, fake data |
| `spec-enforcer` | Verify spec compliance | Before deploying features |
| `test-generator` | Generate tests | After creating routes/components |
| `ui-builder` | Generate React components | Creating pages or forms |
| `migration-builder` | Generate SQL migrations | Adding/modifying database tables |
| `french-ui-helper` | Generate French translations | Creating UI text, validation messages |
| `rls-policy-builder` | Generate RLS policies | Adding access control to tables |
| `supabase-query-builder` | Generate database queries | Writing Supabase queries |
| `docs-updater` | Update documentation | After completing features |

---

## 🚀 Usage

### In Claude Code CLI:
```bash
/skill-name [description]
```

### Example:
```bash
/api-builder Create GET /api/sales/dashboard with fields: leads_count, closed_this_month, revenue
```

---

## 📖 Detailed Skill Descriptions

### 1. api-builder
**Generate production-ready Next.js API routes**

**Features:**
- Zod validation
- RLS filtering by company_id
- Error handling with status codes
- TypeScript strict mode
- Auth checks (requireUser, requireRole, requirePermission)

**Example:**
```bash
/api-builder Create POST /api/invoices endpoint with fields: customer_id, amount, due_date. Admin/Manager only.
```

**Output:**
- Complete route.ts file with auth, validation, DB query, error handling
- Follows 4-step pattern: Auth → Validate → Query → Respond

---

### 2. bug-fixer
**Debug and fix bugs including 404 errors, fake data, broken features**

**Features:**
- Root cause analysis
- Minimal fixes (no refactoring)
- Replaces mock data with real Supabase queries
- Tests the fix

**Example:**
```bash
/bug-fixer Fix: admin dashboard shows fake data - replace with real queries
```

**Output:**
- Analysis of the bug
- Code changes to fix it
- Explanation of what was wrong

---

### 3. spec-enforcer
**Verify code matches ENTRETIEN_PRESTIGE_FINAL_SPEC-1.md requirements**

**Features:**
- Checks implementation against spec
- Lists what matches (✅), what's missing (⚠️), what's wrong (❌)
- Suggests fixes

**Example:**
```bash
/spec-enforcer Verify that photo upload component matches spec requirements
```

**Output:**
- Compliance report with status indicators
- List of missing/incorrect features
- Recommended fixes

---

### 4. test-generator
**Generate Vitest tests with 100% coverage**

**Features:**
- Unit tests for lib/ functions
- Integration tests for API routes
- Component tests for React components
- Auto-runs `npm test`

**Example:**
```bash
/test-generator Create tests for app/api/admin/users/route.ts
```

**Output:**
- Complete test file with success, error, and edge cases
- Coverage report

---

### 5. ui-builder
**Generate mobile-first React components with Tailwind CSS**

**Features:**
- 640px max width (mobile-first)
- Tailwind CSS styling
- French labels
- Zod form validation
- Accessibility (ARIA, keyboard nav)

**Example:**
```bash
/ui-builder Create PhotoUpload component for job completion workflow
```

**Output:**
- Complete React component with TypeScript
- French UI labels
- Responsive design

---

### 6. migration-builder
**Generate SQL migration files with RLS policies for Supabase**

**Features:**
- Timestamped migration files (YYYYMMDD_description.sql)
- ALTER TABLE statements
- RLS policies with company_id filtering
- Indexes for performance
- Rollback statements

**Example:**
```bash
/migration-builder Add contract_url, contract_status, id_photo_url, profile_photo_url to users table
```

**Output:**
- SQL migration file
- RLS policies for new columns
- Comments explaining changes

---

### 7. french-ui-helper
**Generate Quebec French UI labels and validation messages**

**Features:**
- Converts English to Quebec French
- Proper accents (é, è, ê, à, ù, ô)
- Quebec-specific terms (not France French)
- Professional tone for business context

**Example:**
```bash
/french-ui-helper Translate these button labels: Save, Cancel, Delete, Edit, Create User, Reset Password
```

**Output:**
- JSON format translations
- Common UI text patterns
- Validation messages

---

### 8. rls-policy-builder
**Generate Row Level Security policies for Supabase tables**

**Features:**
- Multi-tenancy isolation by company_id
- Role-based access control
- Separate policies per operation (SELECT, INSERT, UPDATE, DELETE)
- Uses auth.uid() for user-specific policies

**Example:**
```bash
/rls-policy-builder Create RLS policies for invoices table: admins see all, managers see own company, techs see assigned jobs only
```

**Output:**
- SQL policy statements
- Enable RLS command
- Comments explaining each policy

---

### 9. supabase-query-builder
**Generate type-safe Supabase queries with RLS filtering**

**Features:**
- ALWAYS filters by company_id
- Uses createUserClient() for RLS
- Proper query methods (.single(), .maybeSingle(), .select())
- Error handling

**Example:**
```bash
/supabase-query-builder Get all active jobs for today with customer info, ordered by scheduled time
```

**Output:**
- TypeScript Supabase query code
- Client initialization
- Error handling

---

### 10. docs-updater
**Update CLAUDE.md, README.md, READY_TO_DEPLOY.md after changes**

**Features:**
- Updates "Current Status" date
- Increments completion percentage
- Marks features as ✅ or ⚠️
- Adds new API endpoints to lists
- Updates Critical Files section

**Example:**
```bash
/docs-updater Update docs: completed admin user management and settings pages
```

**Output:**
- Updated documentation files
- New completion percentages
- Feature status updates

---

## 🔄 Workflow Examples

### Creating a New Feature (Complete Flow):

1. **Plan the feature** (manually or with `/spec-enforcer`)
2. **Generate API routes:**
   ```bash
   /api-builder Create POST /api/feature endpoint
   ```
3. **Generate UI component:**
   ```bash
   /ui-builder Create FeatureForm component
   ```
4. **Generate tests:**
   ```bash
   /test-generator Create tests for app/api/feature/route.ts
   ```
5. **Verify against spec:**
   ```bash
   /spec-enforcer Verify feature implementation
   ```
6. **Update docs:**
   ```bash
   /docs-updater Update docs: completed feature X
   ```

### Fixing a Bug:

1. **Identify the bug** (user report or testing)
2. **Use bug-fixer:**
   ```bash
   /bug-fixer Fix: dashboard shows wrong revenue numbers
   ```
3. **Generate tests to prevent regression:**
   ```bash
   /test-generator Create tests for lib/dashboardMetrics.ts
   ```

### Adding Database Tables:

1. **Generate migration:**
   ```bash
   /migration-builder Add new_table with columns: field1, field2
   ```
2. **Generate RLS policies:**
   ```bash
   /rls-policy-builder Create RLS policies for new_table
   ```
3. **Run migration in Supabase SQL Editor**

---

## 📝 Best Practices

1. **Always use skills for repetitive tasks** - Don't manually write code that follows patterns
2. **Use docs-updater after every feature** - Keep documentation synchronized
3. **Use spec-enforcer before deploying** - Catch compliance issues early
4. **Chain skills together** - Example: api-builder → test-generator → docs-updater
5. **Use french-ui-helper for all UI text** - Maintain consistent Quebec French

---

## 🛠️ Skill Locations

All skills are located in:
```
.claude/skills/
├── api-builder/SKILL.md
├── bug-fixer/SKILL.md
├── spec-enforcer/SKILL.md
├── test-generator/SKILL.md
├── ui-builder/SKILL.md
├── migration-builder/SKILL.md
├── french-ui-helper/SKILL.md
├── rls-policy-builder/SKILL.md
├── supabase-query-builder/SKILL.md
└── docs-updater/SKILL.md
```

---

## 📊 Skill Usage Statistics

Skills automatically track usage and maintain consistency across the codebase by:
- Reading project context (CLAUDE.md, spec)
- Following established patterns
- Generating code that matches existing style
- Ensuring all features work together

---

**For more information, see individual skill files in `.claude/skills/[skill-name]/SKILL.md`**
