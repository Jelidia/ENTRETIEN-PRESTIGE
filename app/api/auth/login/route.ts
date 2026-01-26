import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import { createAnonClient, createAdminClient } from "@/lib/supabaseServer";
import { setSessionCookies } from "@/lib/session";
import { createChallenge, sendTwoFactorCode } from "@/lib/security";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { hashCode } from "@/lib/crypto";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login request" }, { status: 400 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: userRecord } = await admin
    .from("users")
    .select(
      "user_id, failed_login_attempts, last_failed_login, status, two_factor_enabled, two_factor_method, login_count"
    )
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (userRecord?.status === "suspended") {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  if (userRecord?.failed_login_attempts && userRecord.failed_login_attempts >= 5) {
    const lastFailed = userRecord.last_failed_login
      ? new Date(userRecord.last_failed_login).getTime()
      : 0;
    if (Date.now() - lastFailed < 30 * 60 * 1000) {
      return NextResponse.json({ error: "Account locked" }, { status: 403 });
    }
  }

  const anon = createAnonClient();
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
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { data: profile } = await admin
    .from("users")
    .select("two_factor_enabled, two_factor_method")
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

  if (profile?.two_factor_enabled) {
    const challenge = await createChallenge(admin, {
      userId: data.user.id,
      method: profile.two_factor_method ?? "sms",
      session: data.session,
    });
    await sendTwoFactorCode(admin, data.user.id, challenge);
    return NextResponse.json({ mfaRequired: true, challengeId: challenge.challenge_id });
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

  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, data.session);
  return response;
}
