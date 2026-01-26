import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const body = await request.json().catch(() => null);
  const userId = body?.userId ?? profile.user_id;

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ two_factor_enabled: false, two_factor_secret: null })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Unable to disable 2FA" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
