import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import { createAnonClient, createAdminClient } from "@/lib/supabaseServer";
import { setSessionCookies } from "@/lib/session";
import { createChallenge } from "@/lib/security";
import { isSmsConfigured } from "@/lib/twilio";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { hashCode } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid login request" }, { status: 400 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: "Too many attempts" }, { status: 429 });
  }

  const admin = createAdminClient();
  const anon = createAnonClient();
  const idempotency = await beginIdempotency(admin, request, null, {
    action: "login",
    email: parsed.data.email,
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

  const { data: userRecord } = await admin
    .from("users")
    .select(
      "user_id, failed_login_attempts, last_failed_login, status, two_factor_enabled, two_factor_method, login_count"
    )
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (userRecord?.status === "suspended") {
    await logAudit(admin, userRecord.user_id ?? null, "login", "user", userRecord.user_id ?? null, "denied", {
      reason: "account_suspended",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { email: parsed.data.email },
    });
    return NextResponse.json({ success: false, error: "Account suspended" }, { status: 403 });
  }

  if (userRecord?.failed_login_attempts && userRecord.failed_login_attempts >= 5) {
    const lastFailed = userRecord.last_failed_login
      ? new Date(userRecord.last_failed_login).getTime()
      : 0;
    if (Date.now() - lastFailed < 30 * 60 * 1000) {
      await logAudit(admin, userRecord.user_id ?? null, "login", "user", userRecord.user_id ?? null, "denied", {
        reason: "account_locked",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? null,
        newValues: { email: parsed.data.email },
      });
      return NextResponse.json({ success: false, error: "Account locked" }, { status: 403 });
    }
  }

  const { data, error } = await anon.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.session || !data.user) {
    if (userRecord?.user_id) {
      await admin
        .from("users")
        .update({
          failed_login_attempts: (userRecord.failed_login_attempts ?? 0) + 1,
          last_failed_login: new Date().toISOString(),
        })
        .eq("user_id", userRecord.user_id);
    }
    await logAudit(admin, userRecord?.user_id ?? null, "login", "user", userRecord?.user_id ?? null, "failed", {
      reason: "invalid_credentials",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { email: parsed.data.email },
    });
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
  }

  const { data: profile } = await admin
    .from("users")
    .select("role, two_factor_enabled, two_factor_method, phone")
    .eq("user_id", data.user.id)
    .single();

  await admin
    .from("users")
    .update({
      last_login: new Date().toISOString(),
      login_count: (userRecord?.login_count ?? 0) + 1,
      failed_login_attempts: 0,
    })
    .eq("user_id", data.user.id);

  await logAudit(admin, data.user.id, "login", "user", data.user.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  if (profile?.role === "admin" && profile?.two_factor_enabled) {
    if (profile.two_factor_method === "sms") {
      if (!profile.phone) {
        return NextResponse.json({ success: false, error: "SMS 2FA requires a phone number" }, { status: 400 });
      }
      if (!isSmsConfigured()) {
        return NextResponse.json({ success: false, error: "SMS 2FA is not configured" }, { status: 400 });
      }
    }
    try {
      const challenge = await createChallenge(admin, {
        userId: data.user.id,
        method: profile.two_factor_method ?? "sms",
        session: data.session,
      });
      const responseBody = {
        success: true,
        data: { mfaRequired: true, challengeId: challenge.challenge_id },
        mfaRequired: true,
        challengeId: challenge.challenge_id,
      };
      await completeIdempotency(admin, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
      return NextResponse.json(responseBody);
    } catch (error) {
      return NextResponse.json({ success: false, error: "Unable to send verification code" }, { status: 500 });
    }
  }

  await admin.from("user_sessions").insert({
    user_id: data.user.id,
    ip_address: ip === "unknown" ? null : ip,
    user_agent: request.headers.get("user-agent") ?? "",
    device_type: "web",
    token_hash: data.session.access_token ? hashCode(data.session.access_token) : null,
    expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
    last_activity: new Date().toISOString(),
  });

  const responseBody = { success: true, data: { ok: true, role: profile?.role }, ok: true, role: profile?.role };
  const response = NextResponse.json(responseBody);
  setSessionCookies(response, data.session);
  await completeIdempotency(admin, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return response;
}
