import { NextResponse } from "next/server";
import { clearSessionCookies, getAccessTokenFromRequest } from "@/lib/session";
import { createAnonClient, createAdminClient } from "@/lib/supabaseServer";
import { hashCode } from "@/lib/crypto";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { emptyBodySchema, emptyQuerySchema } from "@/lib/validators";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:logout:${ip}`, 30, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const bodyResult = emptyBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const admin = createAdminClient();
  const { data: userData } = token ? await admin.auth.getUser(token) : { data: null };
  const userId = userData?.user?.id ?? null;
  const anon = createAnonClient(token ?? undefined);
  const idempotency = await beginIdempotency(anon, request, userId, {
    action: "logout",
  });
  if (idempotency.action === "replay") {
    const response = NextResponse.json(idempotency.body, { status: idempotency.status });
    clearSessionCookies(response);
    return response;
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
  }
  await anon.auth.signOut();

  if (token) {
    await admin
      .from("user_sessions")
      .update({ is_active: false })
      .eq("token_hash", hashCode(token));
  }

  if (userId) {
    await logAudit(admin, userId, "logout", "user", userId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });
  }

  const responseBody = { ok: true };
  const response = NextResponse.json(responseBody);
  clearSessionCookies(response);
  await completeIdempotency(anon, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return response;
}
