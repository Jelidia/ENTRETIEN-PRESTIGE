import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/auth";
import { generateAuthenticatorSecret } from "@/lib/security";

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;
  const admin = createAdminClient();
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
    return NextResponse.json({ error: "Unable to setup 2FA" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, otpauth: secret.otpauth });
}
