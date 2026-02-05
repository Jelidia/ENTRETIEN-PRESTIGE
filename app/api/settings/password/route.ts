import { NextResponse } from "next/server";
import {
  badRequest,
  conflict,
  ok,
  okBody,
  requireUser,
  serverError,
  validationError,
} from "@/lib/auth";
import { createAdminClient, createAnonClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

// PATCH /api/settings/password - Change user's own password
export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const requestContext = getRequestContext(request, {
    user_id: profile.user_id,
    company_id: profile.company_id,
  });

  try {
    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return validationError(result.error, "Invalid input");
    }

    const { currentPassword, newPassword } = result.data;

    const anon = createAnonClient();
    const { error: signInError } = await anon.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      return badRequest("invalid_password", "Mot de passe actuel incorrect");
    }

    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "change_password",
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return conflict("idempotency_conflict", "Idempotency key conflict");
    }
    if (idempotency.action === "in_progress") {
      return conflict("idempotency_in_progress", "Request already in progress");
    }
    const { error: updateError } = await client.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      await captureError(updateError, {
        ...requestContext,
        action: "update_password",
      });
      return serverError("Failed to change password", "password_update_failed");
    }

    const admin = createAdminClient();
    await logAudit(admin, profile.user_id, "change_password", "user", profile.user_id, "success", {
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const responseBody = { message: "Password changed successfully" };
    const storedBody = okBody(responseBody, { flatten: true });
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
    return ok(responseBody, { flatten: true });
  } catch (err) {
    await captureError(err, {
      ...requestContext,
      action: "change_password",
    });
    return serverError("An error occurred", "password_update_failed");
  }
}
