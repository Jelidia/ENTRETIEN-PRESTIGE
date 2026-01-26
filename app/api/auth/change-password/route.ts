import { NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validators";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createUserClient(token);
  const { error } = await client.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return NextResponse.json({ error: "Unable to update password" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
