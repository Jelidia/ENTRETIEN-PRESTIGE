import { NextResponse } from "next/server";
import { verify2faSchema } from "@/lib/validators";
import { createAdminClient } from "@/lib/supabaseServer";
import { consumeChallenge } from "@/lib/security";
import { setSessionCookies } from "@/lib/session";
import { hashCode } from "@/lib/crypto";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verify2faSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const session = await consumeChallenge(admin, parsed.data.challengeId, parsed.data.code);

  if (!session) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  const { data: userData } = await admin.auth.getUser(session.access_token);
  if (userData?.user) {
    await admin.from("user_sessions").insert({
      user_id: userData.user.id,
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: request.headers.get("user-agent") ?? "",
      device_type: "web",
      token_hash: session.access_token ? hashCode(session.access_token) : null,
      expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      last_activity: new Date().toISOString(),
    });
  }

  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, session);
  return response;
}
