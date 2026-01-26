import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { userCreateSchema } from "@/lib/validators";

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

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"], "team");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const body = await request.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: userData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName, phone: parsed.data.phone },
  });

  if (authError || !userData.user) {
    return NextResponse.json({ error: "Unable to create auth user" }, { status: 400 });
  }

  const { error } = await admin.from("users").insert({
    user_id: userData.user.id,
    company_id: profile.company_id,
    email: parsed.data.email,
    phone: parsed.data.phone,
    full_name: parsed.data.fullName,
    role: parsed.data.role,
    status: "active",
    two_factor_enabled: true,
    two_factor_method: "sms",
    access_permissions: parsed.data.accessPermissions,
  });

  if (error) {
    return NextResponse.json({ error: "Unable to store user profile" }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
