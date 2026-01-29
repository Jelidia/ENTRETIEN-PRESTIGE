import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabaseServer";
import { adminResetByEmailSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";

// POST /api/admin/reset-password - Admin resets password by email
export async function POST(request: Request) {
  // 1. Authenticate as admin
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;
  const { profile } = auth;

  // 2. Validate input
  const body = await request.json().catch(() => null);
  const result = adminResetByEmailSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.format() },
      { status: 400 }
    );
  }

  const { email, newPassword } = result.data;

  // 3. Find user by email within company
  const admin = createAdminClient();
  const { data: targetUser, error: targetError } = await admin
    .from("users")
    .select("user_id, email")
    .eq("email", email)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (targetError || !targetUser) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  // 4. Update password
  const { error: updateError } = await admin.auth.admin.updateUserById(targetUser.user_id, {
    password: newPassword,
  });

  if (updateError) {
    console.error("Failed to reset password:", updateError);
    return NextResponse.json(
      { error: "Impossible de réinitialiser le mot de passe" },
      { status: 500 }
    );
  }

  await logAudit(admin, profile.user_id, "admin_reset_password", "user", targetUser.user_id, "success", {
    newValues: { email: targetUser.email, reset: true },
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({
    success: true,
    message: "Mot de passe réinitialisé avec succès",
    userId: targetUser.user_id,
  });
}
