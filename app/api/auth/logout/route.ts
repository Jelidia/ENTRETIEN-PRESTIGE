import { NextResponse } from "next/server";
import { clearSessionCookies, getAccessTokenFromRequest } from "@/lib/session";
import { createAnonClient, createAdminClient } from "@/lib/supabaseServer";
import { hashCode } from "@/lib/crypto";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:logout:${ip}`, 30, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const token = getAccessTokenFromRequest(request);
  const admin = createAdminClient();
  const { data: userData } = token ? await admin.auth.getUser(token) : { data: null };
  const userId = userData?.user?.id ?? null;
  const anon = createAnonClient(token ?? undefined);
  await anon.auth.signOut();

  if (token) {
    await admin
      .from("user_sessions")
      .update({ is_active: false })
      .eq("token_hash", hashCode(token));
  }

  if (userId) {
    await logAudit(admin, userId, "logout", "user", userId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
