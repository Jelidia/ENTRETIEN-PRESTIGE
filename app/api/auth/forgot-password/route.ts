import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators";
import { createAdminClient, createAnonClient } from "@/lib/supabaseServer";
import { getBaseUrl } from "@/lib/env";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:forgot-password:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const anon = createAnonClient();
  const idempotency = await beginIdempotency(anon, request, null, {
    action: "forgot_password",
    email: parsed.data.email,
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
  const { error } = await anon.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getBaseUrl()}/reset-password`,
  });

  if (error) {
    const admin = createAdminClient();
    await logAudit(admin, null, "forgot_password", "user", null, "failed", {
      reason: "reset_email_failed",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { email: parsed.data.email },
    });
    return NextResponse.json({ error: "Unable to send reset link" }, { status: 400 });
  }

  const admin = createAdminClient();
  await logAudit(admin, null, "forgot_password", "user", null, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { email: parsed.data.email },
  });

  const responseBody = { success: true, data: { ok: true }, ok: true };
  await completeIdempotency(anon, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
