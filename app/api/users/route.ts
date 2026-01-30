import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { userCreateSchema } from "@/lib/validators";
import { isSmsConfigured } from "@/lib/twilio";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("users")
    .select("user_id, full_name, email, phone, role, status, created_at, access_permissions")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Unable to load users" }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"], "team");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, parsed.data);
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
  const smsConfigured = isSmsConfigured();
  const isAdmin = parsed.data.role === "admin";
  const enableSms2fa = Boolean(isAdmin && parsed.data.phone && smsConfigured);
  const twoFactorMethod = enableSms2fa ? "sms" : "authenticator";
  const twoFactorEnabled = enableSms2fa;
  const { data: userData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName, phone: parsed.data.phone },
  });

  if (authError || !userData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Unable to create auth user" },
      { status: 400 }
    );
  }

  const { error } = await admin.from("users").insert({
    user_id: userData.user.id,
    company_id: profile.company_id,
    email: parsed.data.email,
    phone: parsed.data.phone,
    full_name: parsed.data.fullName,
    role: parsed.data.role,
    status: "active",
    two_factor_enabled: twoFactorEnabled,
    two_factor_method: twoFactorMethod,
    access_permissions: parsed.data.accessPermissions,
    address: parsed.data.address,
    city: parsed.data.city,
    province: parsed.data.province,
    postal_code: parsed.data.postal_code,
    country: parsed.data.country,
    id_document_front_url: parsed.data.id_document_front_url,
    id_document_back_url: parsed.data.id_document_back_url,
    contract_document_url: parsed.data.contract_document_url,
    contract_signature_url: parsed.data.contract_signature_url,
    contract_signed_at: parsed.data.contract_signed_at,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Unable to store user profile" },
      { status: 400 }
    );
  }

  await logAudit(admin, profile.user_id, "admin_create_user", "user", userData.user.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: {
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      role: parsed.data.role,
    },
  });

  const responseBody = { success: true, data: { ok: true }, ok: true };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 201);
  return NextResponse.json(responseBody, { status: 201 });
}
