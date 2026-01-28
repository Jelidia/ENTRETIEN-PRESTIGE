import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { z } from "zod";
import bcrypt from "bcryptjs";

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Minimum 8 caractères")
    .max(128, "Maximum 128 caractères")
    .regex(/[A-Z]/, "Minimum 1 lettre majuscule (A-Z)")
    .regex(/[0-9]/, "Minimum 1 chiffre (0-9)")
    .regex(/[!@#$%^&*]/, "Minimum 1 caractère spécial (!@#$%^&*)"),
});

// POST /api/admin/users/[user_id]/reset-password - Admin resets user password
export async function POST(
  request: Request,
  { params }: { params: { user_id: string } }
) {
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const userId = params.user_id;

  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid password", details: result.error.format() },
        { status: 400 }
      );
    }

    const { newPassword } = result.data;

    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");

    // Verify user belongs to same company
    const { data: existingUser } = await client
      .from("users")
      .select("user_id, company_id")
      .eq("user_id", userId)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.company_id !== profile.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error } = await client
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to reset password:", error);
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset. User can login with new password.",
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
