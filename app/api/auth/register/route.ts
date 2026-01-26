import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators";
import { createAdminClient } from "@/lib/supabaseServer";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { companyName, fullName, email, phone, password } = parsed.data;

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName })
    .select("company_id")
    .single();

  if (companyError || !company) {
    return NextResponse.json({ error: "Unable to create company" }, { status: 400 });
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unable to create user" }, { status: 400 });
  }

  const { error: profileError } = await admin.from("users").insert({
    user_id: authData.user.id,
    company_id: company.company_id,
    email,
    phone,
    full_name: fullName,
    role: "admin",
    status: "active",
    two_factor_enabled: true,
    two_factor_method: "sms",
  });

  if (profileError) {
    return NextResponse.json({ error: "Unable to store profile" }, { status: 400 });
  }

  await logAudit(admin, authData.user.id, "register", "company", company.company_id, "success");

  return NextResponse.json({ ok: true });
}
