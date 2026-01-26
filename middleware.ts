import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/dispatch",
  "/jobs",
  "/customers",
  "/invoices",
  "/sales",
  "/operations",
  "/reports",
  "/settings",
  "/technician",
  "/notifications",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dispatch/:path*",
    "/jobs/:path*",
    "/customers/:path*",
    "/invoices/:path*",
    "/sales/:path*",
    "/operations/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/technician/:path*",
    "/notifications/:path*",
  ],
};
