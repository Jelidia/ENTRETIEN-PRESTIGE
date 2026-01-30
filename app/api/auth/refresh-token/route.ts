import { NextResponse } from "next/server";
import { createAdminClient, createAnonClient } from "@/lib/supabaseServer";
import { getRefreshTokenFromRequest, setSessionCookies } from "@/lib/session";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

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
  const idempotency = await beginIdempotency(anon, request, null, {
    action: "refresh_token",
  });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
  }
  const { data, error } = await anon.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    return NextResponse.json({ error: "Unable to refresh session" }, { status: 401 });
  }

  const admin = createAdminClient();
  await logAudit(admin, data.session.user.id, "refresh_session", "user", data.session.user.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = { ok: true };
  const response = NextResponse.json(responseBody);
  setSessionCookies(response, data.session);
  await completeIdempotency(anon, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return response;
}
