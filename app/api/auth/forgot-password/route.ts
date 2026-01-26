import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators";
import { createAnonClient } from "@/lib/supabaseServer";
import { getBaseUrl } from "@/lib/env";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const anon = createAnonClient();
  const { error } = await anon.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getBaseUrl()}/reset-password`,
  });

  if (error) {
    return NextResponse.json({ error: "Unable to send reset link" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
