# MCP Integration Setup - Entretien Prestige

Model Context Protocol (MCP) integration for enhanced Claude Code capabilities with Entretien Prestige.

## Overview

MCP allows Claude Code to connect to external tools and services, providing:
- Direct database access via Supabase
- Git operations and repository management
- File search with ripgrep
- TypeScript language server integration
- Test execution via Vitest
- External API integrations (Stripe, Twilio)

## Configuration Files

### `.mcp.json` - Main MCP Configuration
Located in project root, defines all MCP servers and their capabilities.

### `.lsp.json` - Language Server Configuration
Located in project root, configures TypeScript, Tailwind, ESLint, and other language servers.

### `.claude/settings.json` - Claude Code Settings
References MCP configuration and sets permissions.

## Available MCP Servers

### 1. Supabase Local (`supabase-local`)

**Type:** stdio
**Status:** Enabled
**Requires:** Supabase environment variables

**Capabilities:**
- Execute SQL queries
- Get schema information
- Test migrations locally

**Setup:**
```bash
# Install Supabase MCP server
npm install -g supabase-mcp-server

# Verify installation
npx supabase-mcp-server --version

# Test connection
npx supabase-mcp-server \
  --url "$NEXT_PUBLIC_SUPABASE_URL" \
  --key "$SUPABASE_SERVICE_ROLE_KEY"
```

**Usage in Claude Code:**
```bash
# Query database
claude --mcp supabase-local query "SELECT * FROM users LIMIT 5"

# Get schema
claude --mcp supabase-local schema users

# Test migration
claude --mcp supabase-local migrate supabase/migrations/20260129120000_add_customer_rating_tokens.sql
```

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)

### 2. Git Integration (`git-integration`)

**Type:** stdio
**Status:** Enabled

**Capabilities:**
- Get git status
- Show diffs
- View commit history
- Manage branches

**Setup:**
```bash
# Install Git MCP server
npm install -g git-mcp-server

# Test
npx git-mcp-server status
```

**Usage in Claude Code:**
```bash
# Git status
claude --mcp git-integration status

# Show diff
claude --mcp git-integration diff app/api/jobs/route.ts

# Commit history
claude --mcp git-integration log --limit 10

# List branches
claude --mcp git-integration branch
```

### 3. File Search (`file-search`)

**Type:** stdio
**Status:** Enabled

**Capabilities:**
- Fast content search with ripgrep
- File name search with glob patterns

**Setup:**
```bash
# Install ripgrep
# Mac:
brew install ripgrep

# Windows:
choco install ripgrep

# Linux:
sudo apt install ripgrep

# Install MCP server
npm install -g ripgrep-mcp-server
```

**Usage in Claude Code:**
```bash
# Search content
claude --mcp file-search search "requireUser" --fileType ts

# Find files
claude --mcp file-search find "*.test.ts"

# Case-sensitive search
claude --mcp file-search search "TODO" --caseSensitive
```

### 4. TypeScript Language Server (`typescript-language`)

**Type:** http
**Status:** Disabled by default (requires setup)

**Capabilities:**
- Type checking
- Get type definitions
- IntelliSense support

**Setup:**
```bash
# Install TypeScript language server
npm install -g typescript-language-server typescript

# Start server
npx typescript-language-server --stdio

# In separate terminal, start HTTP proxy
# (Or configure direct stdio connection in .mcp.json)
```

**Usage:**
```bash
# Type check file
claude --mcp typescript-language typeCheck app/api/jobs/route.ts

# Get definition
claude --mcp typescript-language getDefinition \
  --file app/api/jobs/route.ts \
  --line 25 \
  --character 10
```

### 5. Testing (`testing`)

**Type:** stdio
**Status:** Enabled

**Capabilities:**
- Run test suites
- Get coverage reports
- Watch mode

**Setup:**
```bash
# Install Vitest MCP server
npm install -g vitest-mcp-server

# Verify Vitest is installed locally
npm list vitest
```

**Usage:**
```bash
# Run all tests
claude --mcp testing runTests

# Run specific file
claude --mcp testing runTests --file tests/dashboardMetrics.test.ts

# Run with pattern
claude --mcp testing runTests --pattern "auth"

# Get coverage
claude --mcp testing getCoverage

# Watch mode
claude --mcp testing watchMode --file tests/dashboardMetrics.test.ts
```

### 6. Stripe Integration (`stripe-integration`)

**Type:** http
**Status:** Enabled
**Requires:** `STRIPE_SECRET_KEY`

**Capabilities:**
- Create payment intents
- Get payment status
- Manage subscriptions

**Setup:**
```bash
# Get API key from Stripe Dashboard
# https://dashboard.stripe.com/apikeys

# Add to .env.local
STRIPE_SECRET_KEY=sk_live_...

# Test connection
curl https://api.stripe.com/v1/balance \
  -u "$STRIPE_SECRET_KEY:"
```

**Usage:**
```bash
# Create payment intent
claude --mcp stripe-integration createPaymentIntent \
  --amount 15000 \
  --currency cad \
  --metadata '{"job_id":"123","customer_id":"456"}'

# Get payment
claude --mcp stripe-integration getPayment pi_123456
```

**Security Note:** Never commit `STRIPE_SECRET_KEY` to git!

### 7. Twilio SMS (`twilio-sms`)

**Type:** http
**Status:** Enabled
**Requires:** Twilio credentials

**Capabilities:**
- Send SMS messages
- Get SMS history

**Setup:**
```bash
# Get credentials from Twilio Console
# https://console.twilio.com/

# Add to .env.local
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX

# Test connection
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

**Usage:**
```bash
# Send SMS
claude --mcp twilio-sms sendSMS \
  --to "+15555555555" \
  --message "Bonjour, votre service est prévu demain." \
  --from "$TWILIO_FROM_NUMBER"

# Get SMS history
claude --mcp twilio-sms getSMSHistory \
  --phone "+15555555555" \
  --limit 20
```

## Language Server Protocol (LSP)

### TypeScript LSP

**Features:**
- Auto-completion
- Type checking
- Hover information
- Go to definition
- Find references
- Rename refactoring

**Configuration:**
```json
// .lsp.json
{
  "servers": {
    "typescript": {
      "language": ["typescript", "typescriptreact"],
      "command": "npx",
      "args": ["typescript-language-server", "--stdio"],
      "enabled": true
    }
  }
}
```

### Tailwind CSS LSP

**Features:**
- Class name completion
- Hover documentation
- Color preview
- Linting for conflicts

**Configuration:**
```json
{
  "servers": {
    "tailwindcss": {
      "language": ["css", "scss", "typescriptreact"],
      "command": "npx",
      "args": ["@tailwindcss/language-server", "--stdio"],
      "enabled": true,
      "settings": {
        "tailwindCSS": {
          "classAttributes": ["class", "className", "classList"]
        }
      }
    }
  }
}
```

### ESLint LSP

**Features:**
- Real-time linting
- Quick fixes
- Rule documentation

**Configuration:**
```json
{
  "servers": {
    "eslint": {
      "language": ["typescript", "typescriptreact"],
      "command": "npx",
      "args": ["vscode-eslint-language-server", "--stdio"],
      "enabled": true,
      "settings": {
        "eslint": {
          "run": "onType",
          "validate": ["typescript", "typescriptreact"]
        }
      }
    }
  }
}
```

## Security Considerations

### Environment Variables

**Required immediately:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Keep secret!
```

**Optional (configure as needed):**
```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
```

### Variable Expansion

MCP configuration supports environment variable expansion:
```json
{
  "env": {
    "SUPABASE_URL": "${NEXT_PUBLIC_SUPABASE_URL}",
    "API_KEY": "${SECRET_KEY}"
  }
}
```

**Security rules:**
- Use `${}` syntax for expansion
- Never hardcode secrets in `.mcp.json`
- Always use `.env.local` for sensitive values
- Add `.env.local` to `.gitignore`

### Rate Limiting

MCP includes rate limiting to prevent abuse:
```json
{
  "security": {
    "rateLimiting": {
      "enabled": true,
      "maxRequestsPerMinute": 60
    }
  }
}
```

### Allowed Origins

Restrict MCP access to trusted origins:
```json
{
  "security": {
    "allowedOrigins": [
      "http://localhost:3000",
      "https://*.vercel.app"
    ]
  }
}
```

### Encryption

MCP communication can be encrypted:
```json
{
  "security": {
    "encryption": {
      "enabled": true,
      "algorithm": "aes-256-gcm"
    }
  }
}
```

## Logging

### Enable MCP Logging

```json
{
  "logging": {
    "enabled": true,
    "level": "info",
    "destination": "./.claude/logs/mcp.log",
    "maxSize": "10mb",
    "maxFiles": 5
  }
}
```

### Log Levels
- `error` - Errors only
- `warn` - Warnings and errors
- `info` - General information (default)
- `debug` - Detailed debugging
- `trace` - Very verbose (all requests/responses)

### View Logs

```bash
# Tail MCP logs
tail -f .claude/logs/mcp.log

# Search for errors
grep ERROR .claude/logs/mcp.log

# View last 100 lines
tail -100 .claude/logs/mcp.log
```

## Error Handling

### Retry Logic

MCP includes automatic retry for transient failures:
```json
{
  "errorHandling": {
    "retryAttempts": 3,
    "retryDelay": 1000,
    "timeout": 30000
  }
}
```

### Common Errors

**"Connection refused"**
- MCP server not running
- Wrong port or URL
- Firewall blocking connection

**"Authentication failed"**
- Wrong API key or credentials
- Environment variable not set
- Key expired or revoked

**"Timeout"**
- Server overloaded
- Network issues
- Query too slow (increase timeout)

**"Rate limit exceeded"**
- Too many requests
- Wait before retrying
- Increase rate limit in config

## Troubleshooting

### Test MCP Server Connection

```bash
# Test stdio server
echo '{"jsonrpc":"2.0","id":1,"method":"ping"}' | npx <server-command>

# Test HTTP server
curl -X POST http://localhost:6789/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"ping"}'
```

### Verify Configuration

```bash
# Validate .mcp.json syntax
cat .mcp.json | jq .

# Validate .lsp.json syntax
cat .lsp.json | jq .

# Check Claude Code MCP status
claude --mcp-status
```

### Debug Mode

```bash
# Enable MCP debug logging
MCP_DEBUG=1 claude --mcp supabase-local query "SELECT 1"

# View detailed errors
claude --mcp supabase-local query "SELECT * FROM invalid_table" --debug
```

### Reset MCP State

```bash
# Clear MCP cache
rm -rf ~/.claude/mcp-cache

# Restart MCP servers
pkill -f "mcp-server"

# Restart Claude Code
claude --restart
```

## Advanced Usage

### Custom MCP Server

Create your own MCP server for project-specific needs:

```typescript
// custom-mcp-server.ts
import { MCPServer } from '@anthropic/mcp-sdk';

const server = new MCPServer({
  name: 'custom-entretien-prestige',
  version: '1.0.0',
  capabilities: {
    tools: true,
    resources: false,
    prompts: false
  }
});

server.addTool({
  name: 'calculatePrice',
  description: 'Calculate job price with all factors',
  parameters: {
    sqft: { type: 'number', required: true },
    windows: { type: 'number', required: true },
    serviceType: { type: 'string', enum: ['basique', 'premium', 'prestige'] },
    datetime: { type: 'string', format: 'date-time' }
  },
  handler: async (params) => {
    // Import your pricing logic
    const { calculatePrice } = await import('./lib/pricing');
    return calculatePrice(params);
  }
});

server.start();
```

Add to `.mcp.json`:
```json
{
  "servers": {
    "custom": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "custom-mcp-server.ts"],
      "enabled": true
    }
  }
}
```

### Chaining MCP Calls

Use multiple MCP servers in sequence:

```bash
# 1. Get schema
claude --mcp supabase-local schema jobs > /tmp/schema.json

# 2. Generate migration based on schema
claude --agent database-architect \
  --context /tmp/schema.json \
  "Add rating_score column to jobs table"

# 3. Test migration
claude --mcp supabase-local migrate supabase/migrations/20260129120000_add_customer_rating_tokens.sql

# 4. Commit changes
claude --mcp git-integration commit -m "Add rating_score to jobs table"
```

## Best Practices

### 1. Security
- Never commit API keys or credentials
- Use environment variables for all secrets
- Enable rate limiting in production
- Restrict allowed origins

### 2. Performance
- Use appropriate timeouts (30s default)
- Enable retry logic for transient failures
- Monitor MCP logs for slow queries
- Cache expensive operations

### 3. Reliability
- Test MCP servers before production use
- Monitor MCP logs for errors
- Have fallback logic if MCP unavailable
- Set appropriate retry limits

### 4. Development
- Use MCP for repetitive tasks
- Integrate with CI/CD pipelines
- Document custom MCP servers
- Share MCP configurations with team

## Resources

### Documentation
- **MCP Specification:** https://modelcontextprotocol.io
- **Claude Code MCP Guide:** https://claude.ai/docs/mcp
- **Supabase API:** https://supabase.com/docs/reference/api
- **Stripe API:** https://stripe.com/docs/api
- **Twilio API:** https://www.twilio.com/docs/usage/api

### Tools
- **Supabase MCP:** `npm install -g supabase-mcp-server`
- **Git MCP:** `npm install -g git-mcp-server`
- **Ripgrep MCP:** `npm install -g ripgrep-mcp-server`
- **Vitest MCP:** `npm install -g vitest-mcp-server`

### Support
- GitHub Issues: Report MCP bugs
- Slack: #entretien-prestige-dev
- Email: dev@entretien-prestige.com

---

**Last Updated:** 2026-01-28
**Version:** 1.0.0
