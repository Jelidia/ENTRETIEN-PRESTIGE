# Troubleshooting Guide - Entretien Prestige

This guide covers common issues and their solutions for the Entretien Prestige project.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Database Issues](#database-issues)
- [Authentication & Authorization](#authentication--authorization)
- [Build & TypeScript Errors](#build--typescript-errors)
- [Testing Issues](#testing-issues)
- [Claude Code Issues](#claude-code-issues)
- [Environment & Configuration](#environment--configuration)
- [Development Server Issues](#development-server-issues)
- [Integration Issues](#integration-issues)
- [Windows-Specific Issues](#windows-specific-issues)
- [WSL-Specific Issues](#wsl-specific-issues)

## Quick Diagnostics

### Run the Doctor Command

Claude Code includes a diagnostic tool:

```bash
claude /doctor
```

This will check:
- Node and npm versions
- Project dependencies
- Configuration files
- Environment variables
- Git status

### Common Quick Fixes

```bash
# Clear all caches and reinstall
rm -rf node_modules .next coverage
npm install
npm run build
npm run lint
npm run typecheck

# Reset database connection
# Check Supabase dashboard for active connections

# Clear test cache
rm -rf node_modules/.vitest
npm test

# Fix permissions (Linux/Mac)
chmod +x .claude/hooks/*.sh
```

## Database Issues

### Issue: "Column access_permissions does not exist"

**Cause:** Migration not run or old schema

**Solution:**
```sql
-- Run in Supabase SQL Editor
-- File: supabase/schema.sql (access_permissions + role_permissions already defined)
-- Reapply schema and the latest supabase/migrations/* if missing

ALTER TABLE users ADD COLUMN IF NOT EXISTS access_permissions JSONB DEFAULT NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS role_permissions JSONB DEFAULT NULL;
```

**Verify:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'access_permissions';
```

### Issue: "Operator does not exist: user_role = text"

**Cause:** Enum type mismatch (old schema had `user_role` enum, new uses text)

**Solution:**
```sql
-- Drop old enum type
DROP TYPE IF EXISTS user_role CASCADE;

-- Update column to text
ALTER TABLE users ALTER COLUMN role TYPE TEXT;
```

**Verify:**
```sql
SELECT data_type FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';
-- Should return: "text"
```

### Issue: RLS Policy Denies Access

**Symptoms:** Queries return empty results or 403 errors

**Debug steps:**

1. Check user's company_id:
```sql
SELECT user_id, email, company_id, role
FROM users
WHERE user_id = 'YOUR_USER_ID';
```

2. Check resource company_id:
```sql
SELECT job_id, company_id, status
FROM jobs
WHERE job_id = 'YOUR_JOB_ID';
```

3. Verify RLS policies exist:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'jobs';
```

4. Test policy directly:
```sql
-- Set user context
SELECT set_config('request.jwt.claims', '{"sub": "YOUR_USER_ID"}', true);

-- Try query
SELECT * FROM jobs WHERE job_id = 'YOUR_JOB_ID';
```

**Common fixes:**
- User and resource have mismatched company_id values
- RLS policy not created for table
- User role doesn't have permission in policy

### Issue: Migration Fails to Apply

**Symptoms:** SQL errors when running migration

**Debug:**
```bash
# Test migration syntax locally
psql -U postgres -d your_db -f supabase/migrations/YYYYMMDD_migration.sql

# Or use Supabase CLI
# Requires Supabase CLI (not included in package.json)
supabase db reset --local
```

**Common errors:**
1. **Constraint violation:** Remove conflicting data first
2. **Column already exists:** Add `IF NOT EXISTS` clause
3. **Foreign key error:** Ensure referenced tables/columns exist
4. **Syntax error:** Check PostgreSQL version compatibility (Supabase uses 15.x)

**Solution pattern:**
```sql
-- Safe migration template
BEGIN;

-- Add columns with IF NOT EXISTS
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE;

-- Drop columns safely
ALTER TABLE table_name DROP COLUMN IF EXISTS old_column;

-- Update data before adding constraints
UPDATE table_name SET column_name = default_value WHERE column_name IS NULL;

-- Add constraints
ALTER TABLE table_name ALTER COLUMN column_name SET NOT NULL;

COMMIT;
```

## Authentication & Authorization

### Issue: "Unauthorized" on All Requests

**Symptoms:** All API calls return 401

**Check:**
1. Cookie is being set:
```javascript
// In browser dev tools > Application > Cookies
// Look for: ep_access_token
```

2. Middleware is running:
```typescript
// middleware.ts should log on each request
console.log("Middleware checking:", request.nextUrl.pathname);
```

3. Token is valid:
```bash
# Decode JWT (copy token from cookie)
echo "YOUR_TOKEN" | base64 -d
```

**Solutions:**
- Re-login to get fresh token
- Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Verify Supabase project URL is correct
- Clear cookies and cache

### Issue: "Forbidden" (403) Despite Being Logged In

**Cause:** User doesn't have required role or permission

**Debug:**
1. Check user's role:
```sql
SELECT user_id, email, role, access_permissions
FROM users
WHERE email = 'user@example.com';
```

2. Check route requirements:
```typescript
// In API route
const auth = await requireRole(request, ["admin", "manager"]);
// User must have admin OR manager role
```

3. Check permission overrides:
```sql
-- Check if user has blocking override
SELECT access_permissions
FROM users
WHERE user_id = 'USER_ID';

-- Check company role overrides
SELECT role_permissions
FROM companies
WHERE company_id = 'COMPANY_ID';
```

**Solutions:**
- Update user role: `UPDATE users SET role = 'admin' WHERE user_id = '...'`
- Remove blocking override: `UPDATE users SET access_permissions = NULL WHERE user_id = '...'`
- Grant permission: `UPDATE users SET access_permissions = '{"jobs": true}' WHERE user_id = '...'`

### Issue: Rate Limit Errors in Development

**Symptoms:** "Too many requests" (429) errors

**Cause:** In-memory rate limit state persists during development

**Solutions:**
```bash
# Restart dev server (clears rate limit state)
npm run dev

# Adjust limits for development
# In middleware.ts, update apiRateRules or defaultApiLimit
```

## Build & TypeScript Errors

### Issue: "Cannot find module '@/...'"

**Cause:** Path alias not configured

**Solution:**
```json
// tsconfig.json (should already have this)
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"

# Or rebuild
rm -rf .next
npm run build
```

### Issue: "Type 'any' is not allowed"

**Cause:** TypeScript strict mode enabled (required by project)

**Solution:** Replace `any` with proper types:

```typescript
// ❌ Wrong
const getData = (): any => { ... }

// ✅ Correct
const getData = (): User | null => { ... }

// For unknown types:
const data: unknown = await response.json();
if (typeof data === 'object' && data !== null && 'user_id' in data) {
  // Now TypeScript knows data has user_id
}
```

### Issue: Build Fails with "Module not found"

**Symptoms:** `npm run build` fails, `npm run dev` works

**Causes:**
1. Dev-only import in production code
2. Missing dependency
3. Case-sensitive path (Linux/production vs Windows dev)

**Solutions:**
```bash
# Check for dev-only imports
grep -r "import.*from.*test" app/ lib/

# Verify all dependencies are in package.json (not devDependencies)
npm install <package-name> --save

# Fix case-sensitive paths
# Ensure import paths match actual file names exactly
import { Component } from './Component' // Not './component'
```

## Testing Issues

Prefer targeted test runs while debugging (e.g., `npx vitest run <file>`); reserve full-suite runs for broad changes or pre-deploy verification.

### Issue: Tests Pass Locally, Fail in CI

**Common causes:**
1. **Environment variables:** CI doesn't have `.env.local`
2. **Timezone differences:** Dates/times may differ
3. **Port conflicts:** CI may use different ports
4. **Race conditions:** Tests may run in parallel

**Solutions:**
```javascript
// Use environment-agnostic date testing
import { beforeEach } from 'vitest';

beforeEach(() => {
  vi.setSystemTime(new Date('2026-01-28T12:00:00Z'));
});

// Ensure tests are independent
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

// Use CI environment variables
// In CI config:
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  NODE_ENV: test
```

### Issue: Coverage Below 100%

**Find uncovered code:**
```bash
# Run tests with coverage
npm test -- --coverage

# View HTML report
open coverage/index.html

# Check specific file
npx vitest run --coverage tests/dashboardMetrics.test.ts
```

**Common missed branches:**
1. **Error handling:** Add test that throws error
2. **Edge cases:** Empty arrays, null values, boundary conditions
3. **Early returns:** Test conditions that cause early exit
4. **Ternaries:** Test both true and false branches

**Solution template:**
```typescript
describe('function with 100% coverage', () => {
  it('success case', () => { ... });
  it('handles null input', () => { ... });
  it('handles empty array', () => { ... });
  it('handles error', () => { ... });
  it('handles boundary (min)', () => { ... });
  it('handles boundary (max)', () => { ... });
});
```

### Issue: Mocks Not Working

**Symptoms:** Tests call real Supabase instead of mock

**Solution:**
```typescript
// vitest.setup.ts
import { vi } from 'vitest';

// Mock Supabase before any imports
vi.mock('@/lib/supabaseServer', () => ({
  createUserClient: vi.fn(() => mockSupabaseClient),
  createAnonClient: vi.fn(() => mockSupabaseClient),
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

// In test file
import { createUserClient } from '@/lib/supabaseServer';

beforeEach(() => {
  vi.mocked(createUserClient).mockClear();
});
```

## Claude Code Issues

### Issue: Claude Code Commands Not Found

**Symptoms:** `claude: command not found`

**Solutions:**
```bash
# Check if Claude Code is installed
which claude

# Install/reinstall Claude Code
npm install -g @anthropic/claude-code

# Add to PATH (if installed but not in PATH)
export PATH="$PATH:$HOME/.npm-global/bin"

# Or use npx
npx @anthropic/claude-code
```

### Issue: Agents/Skills Not Loading

**Symptoms:** `/agent feature-builder` not recognized

**Check:**
```bash
# Verify directory structure
ls .claude/agents/
ls .claude/skills/

# Check agent file format
cat .claude/agents/feature-builder.md
# Should have YAML frontmatter at top

# Verify settings
cat .claude/settings.json
```

**Solutions:**
```bash
# Reinstall plugin
claude plugins uninstall entretien-prestige-dev
claude plugins install entretien-prestige-dev

# Clear Claude cache
rm -rf ~/.claude/cache

# Restart Claude Code
claude --restart
```

### Issue: Hooks Not Running

**Symptoms:** Expected validation doesn't happen

**Check:**
```bash
# Verify hooks are executable
ls -la .claude/hooks/
# Should show: -rwxr-xr-x (executable)

# Make executable if needed
chmod +x .claude/hooks/*.sh

# Test hook manually
bash .claude/hooks/validate-migration.sh supabase/migrations/test.sql
```

**Windows fix:**
```bash
# In Git Bash or WSL
dos2unix .claude/hooks/*.sh

# Or re-save files with LF line endings
# In VS Code: View > Command Palette > "Change End of Line Sequence" > LF
```

### Issue: Output Styles Not Applied

**Symptoms:** Output doesn't follow Quebec French or production-ready style

**Solutions:**
```bash
# Explicitly specify style
claude --output-style quebec-french

# Set default in settings
echo '{"outputStyles": {"default": "production-ready"}}' > .claude/settings.local.json

# Verify style is loaded
claude --list-output-styles
```

## Environment & Configuration

### Issue: Environment Variables Not Loading

**Symptoms:** Undefined values for `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, `process.env.SUPABASE_SERVICE_ROLE_KEY`, `process.env.APP_ENCRYPTION_KEY`, etc.

**Check:**
```bash
# Verify .env.local exists
ls -la .env.local

# Check file contents (hide sensitive values)
cat .env.local | sed 's/=.*/=***/'

# Verify Next.js loads it
npm run dev
# Should see: "Loaded env from .env.local"
```

**Solutions:**
```bash
# Create .env.local from example
cp .env.example .env.local

# Edit with your values
nano .env.local

# Restart dev server
npm run dev

# For tests, create .env.test
cp .env.local .env.test

# Note: Vitest does not load .env.test by default; use .env.local or load explicitly.
```

**Note:** `NEXT_PUBLIC_*` variables are available in browser, others are server-only.

### Issue: Supabase Connection Fails

**Symptoms:** "Failed to fetch" or timeout errors

**Check:**
1. Supabase project is running (check dashboard)
2. URL and keys are correct
3. Network connectivity

**Solutions:**
```bash
# Test connection with curl
curl -H "apikey: YOUR_ANON_KEY" "NEXT_PUBLIC_SUPABASE_URL/rest/v1/"

# Should return: {"message":"..."}

# Verify keys match
# Supabase Dashboard > Settings > API
# Copy "Project URL" and "anon public" key

# Test with Supabase client
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient('URL', 'KEY');
client.from('users').select('count').then(console.log);
"
```

## Development Server Issues

### Issue: Port 3000 Already in Use

**Symptoms:** "Port 3000 is already in use"

**Solutions:**
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=3001 npm run dev
```

### Issue: Hot Reload Not Working

**Symptoms:** Changes don't appear without manual refresh

**Solutions:**
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev

# Check file watchers limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Disable fast refresh temporarily
# next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    disableReactRefresh: true  // Only for debugging
  }
}
```

## Integration Issues

### Issue: Twilio SMS Not Sending

**Symptoms:** No SMS received, no errors in logs

**Check:**
1. Twilio credentials in `.env.local`
2. Phone number format (must be E.164: +1XXXXXXXXXX)
3. Twilio account balance
4. Twilio console logs

**Solutions:**
```bash
# Test Twilio connection
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "Body=Test message" \
  --data-urlencode "From=$TWILIO_FROM_NUMBER" \
  --data-urlencode "To=+15555555555" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Check Twilio logs
# https://console.twilio.com/us1/monitor/logs/sms

# Verify phone number is verified (trial accounts)
# https://console.twilio.com/us1/develop/phone-numbers/manage/verified
```

### Issue: Stripe Webhook Fails

**Symptoms:** Payments work but webhooks return errors

**Check:**
```bash
# Verify webhook secret matches
# Stripe Dashboard > Developers > Webhooks > Select endpoint > Signing secret

# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/payments/callback

# Send test event
stripe trigger payment_intent.succeeded
```

**Common issues:**
1. **Wrong secret:** Copy from webhook settings, not API keys
2. **Signature verification fails:** Check request body is raw (not parsed)
3. **Timeout:** Webhook must respond in 10 seconds

**Solution:**
```typescript
// app/api/payments/[action]/route.ts
const payload = await request.text();
const signature = request.headers.get("stripe-signature") ?? "";
const result = await handleStripeWebhook(payload, signature);
```

## Deployment Checks

**Before deploy:**
```bash
npm run build
npm run lint
npm test
npm run typecheck
```

**Database:**
- Apply `supabase/schema.sql` and all files in `supabase/migrations/` in order.

**Required env vars (deploy):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ENCRYPTION_KEY`
- `NEXT_PUBLIC_BASE_URL`

**Storage:**
- Supabase bucket `user-documents` must exist for uploads.

## Windows-Specific Issues

### Issue: Line Ending Issues (CRLF vs LF)

**Symptoms:** Scripts fail with `\r: command not found`

**Solutions:**
```bash
# Configure Git to use LF
git config --global core.autocrlf input

# Convert existing files
dos2unix .claude/hooks/*.sh

# Or in VS Code
# View > Command Palette > "Change End of Line Sequence" > LF

# Set VS Code default to LF
# File > Preferences > Settings > Search "eol" > Set to "\n"
```

### Issue: Path Separators (\ vs /)

**Symptoms:** File paths not working in scripts

**Solutions:**
```javascript
// Use path.join() or path.resolve()
import path from 'path';

const filePath = path.join(process.cwd(), 'supabase', 'migrations', 'file.sql');
// Works on Windows and Unix

// Or use forward slashes (Node.js accepts on Windows)
const filePath = './supabase/migrations/file.sql';
```

### Issue: Bash Scripts Don't Run

**Symptoms:** `.sh` files don't execute

**Solutions:**
```bash
# Install Git Bash (includes bash)
# https://git-scm.com/download/win

# Or use WSL
wsl --install

# Or convert to PowerShell
# scripts/claude-automation.ps1

# Or use Node.js instead of bash
node scripts/claude-automation.js
```

## WSL-Specific Issues

### Issue: File Permissions in WSL

**Symptoms:** All files show as executable (777 permissions)

**Solutions:**
```bash
# Fix WSL mount options
# In /etc/wsl.conf
[automount]
options = "metadata,umask=22,fmask=11"

# Restart WSL
wsl --shutdown
```

### Issue: Performance Issues

**Symptoms:** Slow file operations, hot reload delays

**Solutions:**
```bash
# Work in WSL filesystem (not /mnt/c/)
cd ~/projects/entretien-prestige

# Clone repo in WSL
git clone https://github.com/... ~/projects/entretien-prestige

# Access from Windows
# \\wsl$\Ubuntu\home\username\projects\entretien-prestige
```

### Issue: Can't Access Windows Environment Variables

**Symptoms:** `process.env.NEXT_PUBLIC_SUPABASE_URL` undefined in WSL

**Solutions:**
```bash
# Create .env.local in WSL project directory
cp /mnt/c/Users/YourName/project/.env.local ./.env.local

# Or symlink
ln -s /mnt/c/Users/YourName/project/.env.local ./.env.local

# Or set in WSL
export NEXT_PUBLIC_SUPABASE_URL="..."
```

## Getting More Help

### Enable Debug Logging

```bash
# Claude Code debug mode
claude --debug --log-file debug.log

# Next.js debug mode
DEBUG=* npm run dev

# Vitest debug mode
npx vitest --reporter=verbose

# Supabase debug mode
# In code:
import { createClient } from '@supabase/supabase-js';
const client = createClient(url, key, {
  auth: { debug: true }
});
```

### Useful Log Locations

```bash
# Next.js logs
.next/trace
.next/server/app-paths-manifest.json

# Test logs
coverage/index.html

# Claude Code logs
.claude/logs/

# Browser console
# Chrome DevTools > Console
# Look for: errors, network failures, CORS issues
```

### Report an Issue

Include:
1. **Error message:** Exact text
2. **Steps to reproduce:** How to trigger the error
3. **Expected behavior:** What should happen
4. **Actual behavior:** What actually happens
5. **Environment:**
   ```bash
   node --version
   npm --version
   claude --version
   cat package.json | grep "next"
   ```
6. **Logs:** Relevant error logs
7. **Code snippet:** Minimal reproducible example

### Documentation Locations

- **Project docs:** `docs/ai/claude/CLAUDE.md`, `README.md`
- **Spec:** `docs/spec/ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md`
- **Agents:** `/.claude/AGENTS_GUIDE.md`
- **Skills:** `/.claude/SKILLS_GUIDE.md`
- **Migrations:** `/supabase/migrations/`
- **Deployment:** `docs/spec/ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md`

### Community Support

- GitHub Issues: Report bugs and feature requests
- Slack: #entretien-prestige-dev
- Email: dev@entretien-prestige.com

---

**Last Updated:** 2026-01-28
**Version:** 1.0.0
