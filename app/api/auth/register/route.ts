import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators";
import { createAdminClient } from "@/lib/supabaseServer";
import { logAudit } from "@/lib/audit";
import { isSmsConfigured } from "@/lib/twilio";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:register:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid registration" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { companyName, fullName, email, phone, password } = parsed.data;
  const idempotency = await beginIdempotency(admin, request, null, {
    action: "register",
    email,
    companyName,
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

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName })
    .select("company_id")
    .single();

  if (companyError || !company) {
    return NextResponse.json({ success: false, error: "Unable to create company" }, { status: 400 });
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ success: false, error: "Unable to create user" }, { status: 400 });
  }

  const smsConfigured = isSmsConfigured();
  const enableSms2fa = Boolean(phone && smsConfigured);
  const { error: profileError } = await admin.from("users").insert({
    user_id: authData.user.id,
    company_id: company.company_id,
    email,
    phone,
    full_name: fullName,
    role: "admin",
    status: "active",
    two_factor_enabled: enableSms2fa,
    two_factor_method: enableSms2fa ? "sms" : "authenticator",
  });

  if (profileError) {
    return NextResponse.json({ success: false, error: "Unable to store profile" }, { status: 400 });
  }

  await logAudit(admin, authData.user.id, "register", "company", company.company_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: {
      company_name: companyName,
      email,
    },
  });

  const responseBody = { success: true, data: { ok: true }, ok: true };
  await completeIdempotency(admin, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
