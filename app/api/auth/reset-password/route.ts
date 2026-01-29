import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validators";
import { createAdminClient, createAnonClient } from "@/lib/supabaseServer";
import { setSessionCookies } from "@/lib/session";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`auth:reset-password:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  // 1. Validate input
  const body = await request.json().catch(() => null);
  const result = resetPasswordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.format() },
      { status: 400 }
    );
  }

  const { code, newPassword } = result.data;

  // 2. Exchange code for session
  const anon = createAnonClient();
  const { data: exchangeData, error: exchangeError } = await anon.auth.exchangeCodeForSession(code);

  if (exchangeError || !exchangeData.session) {
    return NextResponse.json(
      { error: "Code de réinitialisation invalide ou expiré" },
      { status: 400 }
    );
  }

  // 3. Update password
  const { error: updateError } = await anon.auth.updateUser({ password: newPassword });
  if (updateError) {
    console.error("Password reset failed:", updateError);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le mot de passe" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const userId = exchangeData.session.user.id;
  await logAudit(admin, userId, "reset_password", "user", userId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  // 4. Return success with session cookies
  const response = NextResponse.json({ success: true });
  setSessionCookies(response, exchangeData.session);
  return response;
}
