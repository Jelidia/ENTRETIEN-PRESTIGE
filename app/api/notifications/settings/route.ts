import { NextResponse } from "next/server";
import { notificationSettingsSchema } from "@/lib/validators";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;
  const body = await request.json().catch(() => null);
  const parsed = notificationSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { error } = await client
    .from("users")
    .update({ notification_settings: parsed.data })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Unable to save settings" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
