import { NextResponse } from "next/server";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/auth";
import { getAccessTokenFromRequest } from "@/lib/session";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;

  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:disable-2fa:${profile.user_id}:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const userId = body?.userId ?? profile.user_id;

  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const { data: targetUser, error: targetError } = await client
    .from("users")
    .select("user_id, company_id")
    .eq("user_id", userId)
    .single();

  if (targetError || !targetUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ two_factor_enabled: false, two_factor_secret: null })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Unable to disable 2FA" }, { status: 400 });
  }

  await logAudit(admin, profile.user_id, "disable_2fa", "user", userId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({ ok: true });
}
