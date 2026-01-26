import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabaseServer";
import { getRefreshTokenFromRequest, setSessionCookies } from "@/lib/session";

export async function POST(request: Request) {
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
