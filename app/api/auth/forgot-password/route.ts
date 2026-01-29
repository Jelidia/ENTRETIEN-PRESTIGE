import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators";
import { createAnonClient } from "@/lib/supabaseServer";
import { getBaseUrl } from "@/lib/env";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:forgot-password:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

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
