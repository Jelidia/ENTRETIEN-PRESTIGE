# Bug Hunter Agent

**Purpose:** Bug investigation, root cause analysis, and fixing

**Agent Type:** general-purpose

**When to use:**
- 404 errors or broken routes
- UI components not rendering correctly
- Database queries returning wrong data
- Permission/RLS issues
- API errors (400, 403, 500)
- Performance problems

**What it does:**
1. Reproduces the bug
2. Investigates root cause (searches code, logs, config)
3. Identifies the fix (minimal changes)
4. Applies the fix
5. Verifies the fix works
6. Generates regression tests
7. Updates documentation if needed

**Example usage:**
```bash
# In Claude Code conversation:
"Use the bug-hunter agent to investigate why the sales dashboard shows 0 for revenue even though there are completed jobs"
```

**Capabilities:**
- Searches codebase for error sources
- Reads logs and error messages
- Traces execution paths
- Identifies incorrect queries, missing filters, wrong calculations
- Can use bug-fixer skill
- Runs tests to verify fixes
- Creates tests to prevent regression

**Expected output:**
- Root cause analysis
- Code fix (minimal changes)
- Verification that bug is fixed
- Regression test added
- Explanation of what was wrong

**Tools available:**
- All tools (Read, Write, Edit, Bash, Glob, Grep)
- Can invoke /bug-fixer skill
- Can run npm test, npm run dev
- Can execute specific API calls for testing

**Quality checks:**
- ✅ Root cause identified and documented
- ✅ Fix is minimal (no unnecessary refactoring)
- ✅ Tests pass after fix
- ✅ Regression test added
- ✅ No new bugs introduced
- ✅ Documentation updated if behavior changed
