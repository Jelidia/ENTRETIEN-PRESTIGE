import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAnonClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  // 1. Authenticate
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { user, profile } = auth;

  // 2. Validate input
  const body = await request.json().catch(() => null);
  const result = changePasswordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.format() },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = result.data;

  // 3. Verify current password by attempting to sign in
  const anonClient = createAnonClient();
  const { error: signInError } = await anonClient.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });

  if (signInError) {
    return NextResponse.json(
      { error: "Mot de passe actuel incorrect" },
      { status: 401 }
    );
  }

  // 4. Update password
  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const { error: updateError } = await client.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Password update failed:", updateError);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le mot de passe" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
