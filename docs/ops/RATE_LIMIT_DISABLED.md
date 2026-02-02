# ⚠️ RATE LIMITING TEMPORARILY DISABLED

## Status: DISABLED FOR TESTING

Rate limiting has been **temporarily disabled** to allow for extensive testing without hitting rate limits.

## What Was Changed

### File: `lib/rateLimit.ts`
The `rateLimit()` function now immediately returns `{ allowed: true }` instead of enforcing limits.

**Original code is preserved in comments** - ready to be uncommented when testing is complete.

## Why This Was Done

During comprehensive testing with Playwright, multiple login attempts in quick succession were triggering rate limits:
- Login API: 20 requests per 15 minutes
- Other APIs: Various limits per endpoint

This prevented testing from completing successfully.

## ⚠️ BEFORE DEPLOYING TO PRODUCTION

**CRITICAL:** You MUST re-enable rate limiting before deploying to production!

### Steps to Re-enable:

1. Open `lib/rateLimit.ts`
2. Locate the `rateLimit()` function
3. **Remove** the line:
   ```typescript
   return { allowed: true, remaining: 999, resetAt: now + windowMs };
   ```
4. **Uncomment** the original code block (marked with `/* ORIGINAL CODE - RE-ENABLE FOR PRODUCTION: */`)
5. **Remove** the warning comments at the top of the function
6. **Delete** this file (`docs/ops/RATE_LIMIT_DISABLED.md`)
7. Test that rate limiting works:
   ```bash
   # Try to login 6 times quickly - should get rate limited
   for i in {1..6}; do curl -X POST http://localhost:3000/api/auth/login -d '{"email":"test@test.com","password":"test"}' -H "Content-Type: application/json"; done
   ```

### Verification Checklist

Before production deployment, verify:
- [ ] Rate limiting re-enabled in `lib/rateLimit.ts`
- [ ] Login endpoint rate limits working (test with 6+ rapid attempts)
- [ ] API endpoint rate limits working
- [ ] Middleware rate limits working
- [ ] This file (`docs/ops/RATE_LIMIT_DISABLED.md`) deleted

## Current Rate Limits (When Re-enabled)

From `middleware.ts`:
- `/api/auth/login`: 20 requests per 15 minutes
- `/api/gps/hourly-ping`: 60 requests per minute
- `/api/gps/*`: 120 requests per minute
- `/api/uploads`: 30 requests per 10 minutes
- `/api/documents`: 120 requests per 10 minutes
- Default API: 300 requests per minute

From `app/api/auth/login/route.ts`:
- Login attempts per IP: 5 per 15 minutes

## Security Impact

**Without rate limiting, the application is vulnerable to:**
- Brute force password attacks
- API abuse and DoS attacks
- Resource exhaustion
- Credential stuffing attacks

**DO NOT deploy to production without re-enabling rate limiting!**

## Related Files

- `lib/rateLimit.ts` - Main rate limiting implementation
- `middleware.ts` - API route rate limiting
- `app/api/auth/login/route.ts` - Login-specific rate limiting

---

**Date Disabled:** 2026-01-31
**Reason:** Testing and debugging
**Remember to re-enable before production!**
