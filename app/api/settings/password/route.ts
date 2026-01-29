import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient, createAnonClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";

// PATCH /api/settings/password - Change user's own password
export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { profile } = auth;

  try {
    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    const anon = createAnonClient();
    const { error: signInError } = await anon.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 }
      );
    }

    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
    const { error: updateError } = await client.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return NextResponse.json(
        { error: "Failed to change password" },
        { status: 500 }
      );
    }

    const admin = createAdminClient();
    await logAudit(admin, profile.user_id, "change_password", "user", profile.user_id, "success", {
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") ?? null,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Error changing password:", err);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
