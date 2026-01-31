import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestIp, rateLimit } from "./lib/rateLimit";
import { REQUEST_ID_HEADER, generateRequestId } from "./lib/requestId";
import { createClient } from "@supabase/supabase-js";

const ORIGINAL_PATH_HEADER = "x-original-path";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  requestHeaders.set(ORIGINAL_PATH_HEADER, pathname);

  // Handle API routes - rate limiting only
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
          [REQUEST_ID_HEADER]: requestId,
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rule.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      });
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    response.headers.set("X-RateLimit-Limit", String(rule.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.resetAt));
    return response;
  }

  // Protected routes - check authentication and role
  const protectedRoutes = [
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
    "/admin",
  ];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Get access token from cookies
    const accessToken = request.cookies.get("access_token")?.value;

    // No token - redirect to login
    if (!accessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Create client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Invalid token - redirect to login
    if (userError || !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("message", "session-expired");
      return NextResponse.redirect(loginUrl);
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const userRole = profile?.role;

    // Role-based route protection
    if (userRole === "technician") {
      // Technicians can only access /technician, /profile, /notifications
      const allowedPaths = ["/technician", "/profile", "/notifications"];
      const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));

      if (!isAllowed) {
        return NextResponse.redirect(new URL("/technician", request.url));
      }
    } else if (userRole === "sales_rep") {
      // Sales reps can access /sales, /customers, /profile, /notifications
      const allowedPaths = ["/sales", "/customers", "/profile", "/notifications"];
      const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));

      if (!isAllowed) {
        return NextResponse.redirect(new URL("/sales/dashboard", request.url));
      }
    } else if (userRole === "manager" || userRole === "admin") {
      // Managers and admins have full access
      // No restrictions
    } else {
      // Unknown role - redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
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
