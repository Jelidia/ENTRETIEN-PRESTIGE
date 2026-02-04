import crypto from "crypto";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getAccessTokenFromRequest } from "@/lib/session";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { seedAccountsSchema } from "@/lib/validators";
import { isSmsConfigured } from "@/lib/twilio";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";

function generatePassword() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"], "settings");
  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = seedAccountsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid seed data" }, { status: 400 });
  }

  const { profile } = auth;
  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, parsed.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }

  const admin = createAdminClient();
  const smsConfigured = isSmsConfigured();
  const results: {
    role: string;
    email: string;
    status: "created" | "exists" | "failed";
    password?: string;
    error?: string;
  }[] = [];

  for (const account of parsed.data.accounts) {
    const { data: existing } = await admin
      .from("users")
      .select("user_id")
      .eq("email", account.email)
      .maybeSingle();

    if (existing) {
      results.push({ role: account.role, email: account.email, status: "exists" });
      continue;
    }

    const password = generatePassword();
    const { data: userData, error: authError } = await admin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: account.fullName,
        phone: account.phone,
      },
    });

    if (authError || !userData.user) {
      results.push({
        role: account.role,
        email: account.email,
        status: "failed",
        error: authError?.message ?? "Unable to create auth user",
      });
      continue;
    }

    const enableSms2fa = Boolean(account.role === "admin" && account.phone && smsConfigured);
    const { error: insertError } = await admin.from("users").insert({
      user_id: userData.user.id,
      company_id: profile.company_id,
      email: account.email,
      phone: account.phone,
      full_name: account.fullName,
      role: account.role,
      status: "active",
      two_factor_enabled: enableSms2fa,
      two_factor_method: enableSms2fa ? "sms" : "authenticator",
    });

    if (insertError) {
      results.push({
        role: account.role,
        email: account.email,
        status: "failed",
        error: insertError.message ?? "Unable to store user profile",
      });
      continue;
    }

    await logAudit(admin, profile.user_id, "admin_seed_user", "user", userData.user.id, "success", {
      newValues: {
        email: account.email,
        full_name: account.fullName,
        role: account.role,
      },
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") ?? null,
    });

    results.push({ role: account.role, email: account.email, status: "created", password });
  }

  const responseBody = { success: true, data: { results }, results };
  await completeIdempotency(
    client,
    request,
    idempotency.scope,
    idempotency.requestHash,
    responseBody,
    200
  );
  return NextResponse.json(responseBody);
}
