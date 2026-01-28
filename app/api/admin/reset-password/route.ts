import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabaseServer";
import { adminResetByEmailSchema } from "@/lib/validators";

// POST /api/admin/reset-password - Admin resets password by email
export async function POST(request: Request) {
  // 1. Authenticate as admin
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;

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

  // 3. Find user by email
  const admin = createAdminClient();
  const { data: users, error: listError } = await admin.auth.admin.listUsers();

  if (listError) {
    console.error("Failed to list users:", listError);
    return NextResponse.json(
      { error: "Impossible de lister les utilisateurs" },
      { status: 500 }
    );
  }

  const targetUser = users.users.find((u) => u.email === email);

  if (!targetUser) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  // 4. Update password
  const { error: updateError } = await admin.auth.admin.updateUserById(targetUser.id, {
    password: newPassword,
  });

  if (updateError) {
    console.error("Failed to reset password:", updateError);
    return NextResponse.json(
      { error: "Impossible de réinitialiser le mot de passe" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Mot de passe réinitialisé avec succès",
    userId: targetUser.id,
  });
}
