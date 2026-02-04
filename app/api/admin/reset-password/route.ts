import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabaseServer";
import { adminResetByEmailSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

// POST /api/admin/reset-password - Admin resets password by email
export async function POST(request: Request) {
  // 1. Authenticate as admin
  const auth = await requireRole(request, ["admin"]);
  if ("response" in auth) return auth.response;
  const { profile } = auth;
  const requestContext = getRequestContext(request, {
    user_id: profile.user_id,
    company_id: profile.company_id,
  });

  // 2. Validate input
  const body = await request.json().catch(() => null);
  const result = adminResetByEmailSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ success: false, error: "Données invalides", details: result.error.format() },
      { status: 400 }
    );
  }

  const { email, newPassword } = result.data;

  const userClient = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const idempotency = await beginIdempotency(userClient, request, profile.user_id, result.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }

  // 3. Find user by email within company
  const admin = createAdminClient();
  const { data: targetUser, error: targetError } = await admin
    .from("users")
    .select("user_id, email")
    .eq("email", email)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (targetError || !targetUser) {
    return NextResponse.json({ success: false, error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  // 4. Update password
  const { error: updateError } = await admin.auth.admin.updateUserById(targetUser.user_id, {
    password: newPassword,
  });

  if (updateError) {
    await captureError(updateError, {
      ...requestContext,
      action: "admin_reset_password_by_email",
    });
    return NextResponse.json({ success: false, error: "Impossible de réinitialiser le mot de passe" },
      { status: 500 }
    );
  }

  await logAudit(admin, profile.user_id, "admin_reset_password", "user", targetUser.user_id, "success", {
    newValues: { email: targetUser.email, reset: true },
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = {
    success: true,
    message: "Mot de passe réinitialisé avec succès",
    userId: targetUser.user_id,
    data: {
      message: "Mot de passe réinitialisé avec succès",
      userId: targetUser.user_id,
    },
  };
  await completeIdempotency(userClient, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
