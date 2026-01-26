import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validators";
import { createAnonClient } from "@/lib/supabaseServer";
import { setSessionCookies } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const anon = createAnonClient();
  const { data: exchangeData, error: exchangeError } = await anon.auth.exchangeCodeForSession(
    parsed.data.code
  );

  if (exchangeError || !exchangeData.session) {
    return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
  }

  const { error } = await anon.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return NextResponse.json({ error: "Unable to update password" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, exchangeData.session);
  return response;
}
