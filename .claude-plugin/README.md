# Entretien Prestige Development Plugin

Complete Claude Code development environment for Entretien Prestige - a mobile-first ERP system for Quebec cleaning companies.

## 🚀 Quick Start

### Installation

1. Ensure Claude Code is installed and configured
2. Install the plugin:
   ```bash
   claude plugins install entretien-prestige-dev
   ```
3. Activate the plugin:
   ```bash
   claude plugins activate entretien-prestige-dev
   ```
4. Run setup:
   ```bash
   npm install
   npm run build
   ```

### First Session

Start Claude Code and the session hook will display available commands:

```bash
claude
```

You'll see:
- 🤖 6 Specialized Agents
- 🔧 10 Custom Skills
- 📋 Project quick commands
- 📖 Key documentation links

## 🤖 Agents

### `/agent feature-builder`
**End-to-end feature implementation**
- Reads spec and analyzes requirements
- Generates API routes with validation
- Creates UI components with French labels
- Writes database migrations
- Generates tests with 100% coverage
- Updates documentation

**Example:**
```
Use the feature-builder agent to implement customer loyalty points redemption
```

### `/agent database-architect`
**Database schema and RLS policies**
- Designs schema with proper constraints
- Generates migration SQL files
- Creates RLS policies for multi-tenancy
- Adds indexes for performance

**Example:**
```
Use the database-architect agent to add a loyalty_rewards table
```

### `/agent qa-engineer`
**Testing and quality assurance**
- Analyzes code to identify test gaps
- Generates comprehensive test suites
- Achieves 100% test coverage
- Tests success, error, and edge cases

**Example:**
```
Use the qa-engineer agent to generate tests for the admin user management endpoints
```

### `/agent bug-hunter`
**Bug investigation and fixing**
- Reproduces the bug
- Investigates root cause
- Applies minimal fixes
- Generates regression tests

**Example:**
```
Use the bug-hunter agent to investigate why the sales dashboard shows 0 for revenue
```

### `/agent deploy-manager`
**Deployment preparation**
- Runs pre-deploy checks (build, lint, tests)
- Verifies environment variables
- Checks database migrations
- Reviews RLS policies
- Updates docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md

**Example:**
```
Use the deploy-manager agent to verify the project is ready for production
```

### `/agent code-reviewer`
**Code review and compliance**
- Reviews against spec requirements
- Checks pattern consistency
- Verifies security (RLS, auth, validation)
- Validates French UI labels
- Reviews mobile-first design

**Example:**
```
Use the code-reviewer agent to review the new invoice management feature
```

## 🔧 Skills

### `/api-builder`
Generate production-ready Next.js API routes

```
/api-builder Create /api/sales/dashboard with fields: leads_count, revenue
```

### `/ui-builder`
Generate mobile-first React components

```
/ui-builder Create PhotoUpload component for jobs
```

### `/test-generator`
Generate Vitest tests with 100% coverage

```
/test-generator Create tests for app/api/sales/dashboard/route.ts
```

### `/bug-fixer`
Debug and fix bugs with minimal changes

```
/bug-fixer Fix: admin dashboard shows fake data
```

### `/migration-builder`
Generate SQL migrations with RLS policies

```
/migration-builder Add loyalty_rewards table with points tracking
```

### `/french-ui-helper`
Generate French UI labels and SMS templates

```
/french-ui-helper Translate: "Customer not found"
```

### `/rls-policy-builder`
Generate Row Level Security policies

```
/rls-policy-builder Create RLS policies for invoices table
```

### `/supabase-query-builder`
Generate type-safe Supabase queries

```
/supabase-query-builder Query all jobs for technician with status pending
```

### `/docs-updater`
Update project documentation

```
/docs-updater Update docs: added loyalty points redemption feature
```

### `/spec-enforcer`
Verify code matches spec requirements

```
/spec-enforcer Verify that photo upload matches spec
```

## 🎨 Output Styles

### Quebec French
```bash
claude --output-style quebec-french
```
Enforces proper Quebec French grammar, idioms, and terminology for UI development.

### Production Ready
```bash
claude --output-style production-ready
```
Zero-tolerance enforcement: no mock data, no TODOs, no shortcuts. Production-grade only.

### Code Review
```bash
claude --output-style code-review
```
Structured code review format with compliance checks and actionable recommendations.

## 🔗 Hooks

The plugin includes comprehensive hooks that automatically:

### PreToolUse Hooks
- ⚠️ Warn about destructive commands (`rm -rf`, `DROP TABLE`)
- 🔐 Check for missing authentication in API routes
- 📝 Suggest migrations instead of editing base schema
- 🔒 Confirm before writing sensitive files

### PostToolUse Hooks
- ✨ Auto-format TypeScript/TSX files with Prettier
- 🧹 Auto-lint API routes
- 🧪 Auto-run tests after changes
- 📊 Check test coverage
- 🛡️ Verify RLS filtering in queries

### Session Hooks
- 👋 Display welcome message and quick commands (SessionStart)
- 📊 Show session summary with modified files (SessionEnd)
- 🔧 Run project setup checks (Setup)
- 🧹 Clean up temporary files (Stop)

## 🔌 MCP Integration

The plugin configures Model Context Protocol servers for:

### Supabase Local
- Direct integration with local Supabase instance
- Query execution and schema inspection
- Migration testing

### Git Integration
- Repository operations
- Commit history analysis
- Branch management

## 📋 Quality Standards

### Required by Plugin

✅ **100% Test Coverage**
- All statements, branches, functions, lines

✅ **Authentication on All Routes**
- requireUser(), requireRole(), or requirePermission()

✅ **RLS Filtering**
- All queries must filter by company_id

✅ **Zod Validation**
- All API inputs validated

✅ **French UI**
- All customer-facing text in Quebec French

✅ **Mobile-First**
- 640px max-width on all components

✅ **TypeScript Strict**
- No `any` types allowed

✅ **Error Handling**
- Comprehensive try-catch and error responses

## 🛠️ Project Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint

# Testing
npm test                 # Run all tests with coverage
npm run test:watch       # Watch mode
npx vitest run auth      # Run specific tests

# Filtering
npx vitest run --grep "login"           # Pattern matching
npx vitest run tests/dashboardMetrics.test.ts      # Specific file
```

Prefer targeted runs while iterating; reserve full-suite runs for broad changes or pre-deploy verification.

## 📖 Documentation

### Core Documentation
- **docs/ai/claude/CLAUDE.md** - Complete architecture and patterns guide
- **docs/spec/ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md** - Full project specification
- **docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md** - Deployment readiness status

### Guides
- **AGENTS_GUIDE.md** - Detailed agent documentation
- **SKILLS_GUIDE.md** - Complete skills reference
- **docs/ops/TROUBLESHOOTING.md** - Database migration troubleshooting

### Quick References
- **README.md** - Quick start for developers
- **.claude/README.md** - Claude Code quick reference

## 🔧 Configuration

### Environment Variables

**Required immediately:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
APP_ENCRYPTION_KEY=xxxxx==
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

**Configure as you obtain credentials:**
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyxxxxx
```

### Plugin Settings

The plugin respects settings in `.claude/settings.json`:

```json
{
  "outputStyles": {
    "default": "production-ready"
  },
  "permissions": {
    "autoApprove": ["npm test", "npm run build", "npm run lint"]
  }
}
```

## 🚨 Troubleshooting

### Plugin not loading
```bash
claude plugins list           # Check if installed
claude plugins activate entretien-prestige-dev  # Activate
```

### Hooks not running
Check that hook scripts are executable:
```bash
chmod +x .claude/hooks/*.sh
```

### Tests failing
```bash
npm test                      # Run full test suite
npm test -- --run --coverage  # Check coverage
```

### Build errors
```bash
npm run build                 # See detailed errors
npm run typecheck            # Type-check only
```

## 📞 Support

- 📖 Documentation: See guides in project root
- 🐛 Issues: GitHub Issues
- 💬 Slack: #entretien-prestige-dev
- 📧 Email: dev@entretien-prestige.com

## 📄 License

UNLICENSED - Internal use only

---

**Version:** 1.0.0
**Last Updated:** 2026-01-28
**Compatible with:** Claude Code 4.5+
