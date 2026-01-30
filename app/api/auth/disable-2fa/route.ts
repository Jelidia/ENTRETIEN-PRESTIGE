import { NextResponse } from "next/server";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/auth";
import { getAccessTokenFromRequest } from "@/lib/session";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { disable2faBodySchema, emptyQuerySchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;

  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:disable-2fa:${profile.user_id}:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const bodyResult = disable2faBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const userId = bodyResult.data.userId ?? profile.user_id;

  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const { data: targetUser, error: targetError } = await client
    .from("users")
    .select("user_id, company_id")
    .eq("user_id", userId)
    .single();

  if (targetError || !targetUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const idempotency = await beginIdempotency(client, request, profile.user_id, {
    action: "disable_2fa",
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

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ two_factor_enabled: false, two_factor_secret: null })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Unable to disable 2FA" }, { status: 400 });
  }

  await logAudit(admin, profile.user_id, "disable_2fa", "user", userId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = { ok: true };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
