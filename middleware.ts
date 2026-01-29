import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestIp, rateLimit } from "./lib/rateLimit";

const protectedPaths = [
  "/admin",
  "/dashboard",
  "/dispatch",
  "/inbox",
  "/jobs",
  "/customers",
  "/invoices",
  "/profile",
  "/sales",
  "/operations",
  "/reports",
  "/settings",
  "/team",
  "/technician",
  "/notifications",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    const rule = resolveApiLimit(pathname, request.method);
    const ip = getRequestIp(request);
    const normalized = normalizePath(pathname);
    const key = `api:${ip}:${request.method}:${normalized}`;
    const result = rateLimit(key, rule.limit, rule.windowMs);

    if (!result.allowed) {
      const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
      return new NextResponse(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rule.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(rule.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.resetAt));
    return response;
  }
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ep_access_token")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

type ApiRateRule = {
  match: (pathname: string, method: string) => boolean;
  limit: number;
  windowMs: number;
};

const apiRateRules: ApiRateRule[] = [
  {
    match: (pathname) => pathname.startsWith("/api/auth/login"),
    limit: 20,
    windowMs: 15 * 60 * 1000,
  },
  {
    match: (pathname) => pathname.startsWith("/api/gps/hourly-ping"),
    limit: 60,
    windowMs: 60 * 1000,
  },
  {
    match: (pathname) => pathname.startsWith("/api/gps"),
    limit: 120,
    windowMs: 60 * 1000,
  },
  {
    match: (pathname) => pathname.startsWith("/api/uploads"),
    limit: 30,
    windowMs: 10 * 60 * 1000,
  },
  {
    match: (pathname) => pathname.startsWith("/api/documents"),
    limit: 120,
    windowMs: 10 * 60 * 1000,
  },
];

const defaultApiLimit = { limit: 300, windowMs: 60 * 1000 };

function resolveApiLimit(pathname: string, method: string) {
  return apiRateRules.find((rule) => rule.match(pathname, method)) ?? defaultApiLimit;
}

function normalizePath(pathname: string) {
  return pathname.replace(/\/[0-9a-f-]{8,}/gi, "/:id");
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/dispatch/:path*",
    "/inbox/:path*",
    "/jobs/:path*",
    "/customers/:path*",
    "/invoices/:path*",
    "/profile/:path*",
    "/sales/:path*",
    "/operations/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/technician/:path*",
    "/notifications/:path*",
  ],
};
