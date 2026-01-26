import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { parse } from "cookie";
import type { Session } from "@supabase/supabase-js";
import { isProd } from "./env";

const ACCESS_COOKIE = "ep_access_token";
const REFRESH_COOKIE = "ep_refresh_token";
const EXPIRES_COOKIE = "ep_expires_at";

export function setSessionCookies(response: NextResponse, session: Session) {
  const options = {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set(ACCESS_COOKIE, session.access_token, options);
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, options);
  response.cookies.set(EXPIRES_COOKIE, String(session.expires_at ?? ""), options);
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(EXPIRES_COOKIE, "", { path: "/", maxAge: 0 });
}

export function getAccessTokenFromRequest(request: Request) {
  const header = request.headers.get("cookie");
  if (!header) {
    return null;
  }
  const parsed = parse(header);
  return parsed[ACCESS_COOKIE] ?? null;
}

export function getRefreshTokenFromRequest(request: Request) {
  const header = request.headers.get("cookie");
  if (!header) {
    return null;
  }
  const parsed = parse(header);
  return parsed[REFRESH_COOKIE] ?? null;
}

export function getAccessTokenFromCookies() {
  const cookieStore = cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
}
