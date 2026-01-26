import { NextResponse } from "next/server";
import { clearSessionCookies, getAccessTokenFromRequest } from "@/lib/session";
import { createAnonClient, createAdminClient } from "@/lib/supabaseServer";
import { hashCode } from "@/lib/crypto";

export async function POST(request: Request) {
  const token = getAccessTokenFromRequest(request);
  const anon = createAnonClient(token ?? undefined);
  await anon.auth.signOut();

  if (token) {
    const admin = createAdminClient();
    await admin
      .from("user_sessions")
      .update({ is_active: false })
      .eq("token_hash", hashCode(token));
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
