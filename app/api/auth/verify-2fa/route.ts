import { NextResponse } from "next/server";
import { verify2faSchema } from "@/lib/validators";
import { createAdminClient } from "@/lib/supabaseServer";
import { consumeChallenge } from "@/lib/security";
import { setSessionCookies } from "@/lib/session";
import { hashCode } from "@/lib/crypto";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:verify-2fa:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = verify2faSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const idempotency = await beginIdempotency(admin, request, null, {
    action: "verify_2fa",
    challengeId: parsed.data.challengeId,
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
  const session = await consumeChallenge(admin, parsed.data.challengeId, parsed.data.code);

  if (!session) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  const { data: userData } = await admin.auth.getUser(session.access_token);
  let userRole: string | undefined;

  if (userData?.user) {
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("user_id", userData.user.id)
      .single();

    userRole = profile?.role;

    await admin.from("user_sessions").insert({
      user_id: userData.user.id,
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: request.headers.get("user-agent") ?? "",
      device_type: "web",
      token_hash: session.access_token ? hashCode(session.access_token) : null,
      expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      last_activity: new Date().toISOString(),
    });

    await logAudit(admin, userData.user.id, "verify_2fa", "user", userData.user.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });
  }

  const responseBody = { success: true, data: { ok: true, role: userRole }, ok: true, role: userRole };
  const response = NextResponse.json(responseBody);
  setSessionCookies(response, session);
  await completeIdempotency(admin, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return response;
}
