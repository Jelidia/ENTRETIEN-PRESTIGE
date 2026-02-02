const bucket = new Map<string, { count: number; resetAt: number }>();

// ⚠️ TEMPORARY: Rate limiting disabled for testing
// TODO: Re-enable before production deployment (see RATE_LIMIT_DISABLED.md)
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  // DISABLED: Return allowed immediately for testing
  return { allowed: true, remaining: 999, resetAt: now + windowMs };

  /* ORIGINAL CODE - RE-ENABLE FOR PRODUCTION:
  const existing = bucket.get(key);

  if (!existing || existing.resetAt < now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
  */
}

export function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
