import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabaseServer";
import { getRefreshTokenFromRequest, setSessionCookies } from "@/lib/session";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:refresh:${ip}`, 30, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const refreshToken = getRefreshTokenFromRequest(request);
  if (!refreshToken) {
    return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
  }

  const anon = createAnonClient();
  const { data, error } = await anon.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    return NextResponse.json({ error: "Unable to refresh session" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, data.session);
  return response;
}
