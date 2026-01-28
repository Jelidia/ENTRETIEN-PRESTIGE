import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { adminResetPasswordSchema } from "@/lib/validators";

// POST /api/admin/users/[user_id]/reset-password - Admin resets user password
export async function POST(
  request: Request,
  { params }: { params: { user_id: string } }
) {
  // 1. Authenticate as admin
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const userId = params.user_id;

  // 2. Validate input
  const body = await request.json().catch(() => null);
  const result = adminResetPasswordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.format() },
      { status: 400 }
    );
  }

  const { newPassword } = result.data;

  // 3. Verify user belongs to same company
  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const { data: targetUser, error: fetchError } = await client
    .from("users")
    .select("user_id, company_id, email")
    .eq("user_id", userId)
    .single();

  if (fetchError || !targetUser) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  if (targetUser.company_id !== profile.company_id) {
    return NextResponse.json(
      { error: "Accès interdit" },
      { status: 403 }
    );
  }

  // 4. Update password using admin client (bypasses RLS for auth operations)
  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    console.error("Admin password reset failed:", updateError);
    return NextResponse.json(
      { error: "Impossible de réinitialiser le mot de passe" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Mot de passe réinitialisé. L'utilisateur peut se connecter avec le nouveau mot de passe.",
  });
}
