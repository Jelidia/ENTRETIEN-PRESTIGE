# Claude Code Configuration

**Project:** Entretien Prestige
**Last Updated:** 2026-01-28

This directory contains all Claude Code automation configurations for the project.

---

## 📁 Directory Structure

```
.claude/
├── README.md                    # This file
├── SKILLS_GUIDE.md              # Skills documentation
├── AGENTS_GUIDE.md              # Agents documentation
├── system-prompt.txt            # System instructions
├── settings.json                # Shared settings
├── settings.local.json          # Local settings
├── hooks/                       # Session + validation hooks
├── output-styles/               # Output style templates
├── skills/                      # Skill definitions (10 total)
│   ├── api-builder/
│   ├── bug-fixer/
│   ├── spec-enforcer/
│   ├── test-generator/
│   ├── ui-builder/
│   ├── migration-builder/
│   ├── french-ui-helper/
│   ├── rls-policy-builder/
│   ├── supabase-query-builder/
│   └── docs-updater/
├── agents/                      # Agent definitions (6 total)
│   ├── feature-builder.md
│   ├── database-architect.md
│   ├── qa-engineer.md
│   ├── bug-hunter.md
│   ├── deploy-manager.md
│   └── code-reviewer.md
```

---

## 🎯 Quick Start

### For Quick Code Generation (Skills):
```bash
/skills                          # List all available skills
/api-builder Create endpoint     # Generate API route
/ui-builder Create component     # Generate React component
/test-generator Generate tests   # Generate test files
```

### For Complex Tasks (Agents):
```
"Use the feature-builder agent to implement [feature]"
"Use the bug-hunter agent to investigate [issue]"
"Use the deploy-manager agent to verify deployment readiness"
```

---

## ✅ Repo Constraints (Keep in Mind)

- API routes: Auth → Validate (lib/validators.ts) → RLS client → Respond
- Multi-tenancy: company_id isolation enforced by RLS
- UI: French (Québec) labels, max width 640px, BottomNavMobile always present
- Navigation: exactly 5 tabs per role in BottomNavMobile

---

## 📚 Documentation

| File | Description | Use Case |
|------|-------------|----------|
| `SKILLS_GUIDE.md` | Skills reference | Quick code generation |
| `AGENTS_GUIDE.md` | Agents reference | Multi-step workflows |
| `system-prompt.txt` | Claude instructions | Auto-loaded context |

---

## 🛠️ Skills (10)

**Quick code generation for common patterns:**

### Backend:
1. **api-builder** - Generate API routes with validation
2. **migration-builder** - Generate SQL migrations
3. **rls-policy-builder** - Generate RLS policies
4. **supabase-query-builder** - Generate database queries

### Frontend:
5. **ui-builder** - Generate React components
6. **french-ui-helper** - Generate French translations

### Quality:
7. **test-generator** - Generate Vitest tests
8. **bug-fixer** - Quick bug fixes
9. **spec-enforcer** - Verify spec compliance
10. **docs-updater** - Update documentation

**Usage:** `/skill-name [description]`

---

## 🤖 Agents (6)

**Autonomous workflows for complex tasks:**

### Implementation:
1. **feature-builder** - End-to-end feature creation
2. **database-architect** - Database design & migrations

### Quality:
3. **qa-engineer** - Testing & coverage
4. **bug-hunter** - Bug investigation & fixing
5. **code-reviewer** - Code review & compliance

### Deployment:
6. **deploy-manager** - Deployment preparation

**Usage:** "Use the [agent-name] agent to [task]"

---

## 🔄 Typical Workflows

### Building a New Feature:
1. `feature-builder` agent → Complete implementation
2. `code-reviewer` agent → Verify compliance
3. `qa-engineer` agent → Add targeted tests when needed
4. `deploy-manager` agent → Pre-deploy checks

### Fixing a Bug:
1. `bug-hunter` agent → Investigate & fix
2. `/test-generator` skill → Regression tests when behavior changes
3. `/docs-updater` skill → Update docs

### Database Changes:
1. `database-architect` agent → Schema + RLS
2. `/migration-builder` skill → Migration file
3. `code-reviewer` agent → Security review

---

## 📊 Skills vs Agents

| Criteria | Skills | Agents |
|----------|--------|--------|
| **Duration** | Seconds | Minutes |
| **Complexity** | Single task | Multi-step workflow |
| **Files Modified** | 1-2 | 3-10+ |
| **Decision Making** | Template-based | Autonomous |
| **Use Case** | Code generation | Feature implementation |
| **Invocation** | `/skill-name` | Natural language |

---

## 🎓 Learning Resources

### Start Here:
1. Read `SKILLS_GUIDE.md` - Learn skills
2. Read `AGENTS_GUIDE.md` - Learn agents
3. Try `/skills` command - See available skills
4. Try a simple skill - `/french-ui-helper Translate: Save, Cancel`
5. Try a simple agent - "Use bug-hunter to check for missing RLS policies"

### Project Context:
- `../CLAUDE.md` - Project architecture
- `../ENTRETIEN_PRESTIGE_MASTER_PRODUCTION_READY_BACKLOG.md` - Current status
- `../ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md` - Requirements

---

## 🔧 Configuration

### System Prompt:
`system-prompt.txt` contains instructions that Claude reads automatically. It includes:
- Project context
- Coding standards
- Common patterns
- Security requirements

### Settings:
`settings.local.json` contains local overrides:
- Bash command permissions
- Git command permissions
- Custom tool permissions

---

## 📝 Best Practices

### When to Use Skills:
- ✅ Generating single files (routes, components, tests)
- ✅ Quick translations or validations
- ✅ Template-based code generation
- ✅ When you know exactly what you need

### When to Use Agents:
- ✅ Building complete features
- ✅ Complex investigations
- ✅ Multi-file changes
- ✅ Tasks requiring decisions
- ✅ When scope is complex

### General Tips:
1. **Use skills/agents** for repeatable patterns, keep changes minimal
2. **Run targeted tests only**; avoid full-suite runs unless requested or pre-deploy
3. **Use docs-updater** after every feature completion
4. **Use code-reviewer** before merging features
5. **Use deploy-manager** before production deploys

---

## 🆘 Troubleshooting

### Skills Not Showing:
```bash
/skills                          # Should show 10 skills
ls .claude/skills/               # Verify directory structure
```

### Agent Not Working:
- Provide more specific task description
- Reference spec sections explicitly
- Break complex tasks into smaller parts

### Updates Not Applying:
- Restart Claude Code session
- Check file permissions
- Verify syntax in skill/agent files

---

## 📈 Statistics

**Current Configuration:**
- **10 Skills** - Quick generation
- **6 Agents** - Complex workflows
- **16 Total Automation Tools**

**Code Patterns Automated:**
- ✅ API routes (auth, validation, RLS)
- ✅ React components (mobile-first, French)
- ✅ Database migrations (RLS, indexes)
- ✅ Targeted test suites for changed logic
- ✅ Documentation updates
- ✅ Deployment checks

**Time Savings:**
- API route: ~15 min → 30 sec (skill)
- Complete feature: ~2 hours → 20 min (agent)
- Test coverage: ~30 min → 5 min (agent)
- Deployment prep: ~45 min → 15 min (agent)

---

## 🔮 Future Enhancements

Potential new skills/agents:
- **performance-optimizer** - Analyze and optimize slow queries
- **security-auditor** - Deep security scanning
- **ui-translator** - Batch translate all UI text
- **api-documenter** - Generate OpenAPI/Swagger docs
- **mobile-tester** - Mobile-specific test scenarios

---

## 📞 Support

For issues or questions:
1. Check `SKILLS_GUIDE.md` or `AGENTS_GUIDE.md`
2. Review examples in this README
3. Check project docs (`../CLAUDE.md`)
4. Ask Claude Code directly

---

**Last Updated:** 2026-01-28
**Version:** 1.0
**Status:** Production Ready ✅
