import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/auth";
import { generateAuthenticatorSecret } from "@/lib/security";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { emptyBodySchema, emptyQuerySchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;

  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const bodyResult = emptyBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:setup-2fa:${user.id}:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const admin = createAdminClient();
  const idempotency = await beginIdempotency(admin, request, user.id, {
    action: "setup_2fa",
  });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }
  const secret = generateAuthenticatorSecret(user.email ?? "user");

  const { error } = await admin
    .from("users")
    .update({
      two_factor_secret: secret.secret,
      two_factor_method: "authenticator",
      two_factor_enabled: true,
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ success: false, error: "Unable to setup 2FA" }, { status: 400 });
  }

  await logAudit(admin, user.id, "setup_2fa", "user", user.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = {
    success: true,
    data: { ok: true, otpauth: secret.otpauth },
    ok: true,
    otpauth: secret.otpauth,
  };
  await completeIdempotency(admin, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
