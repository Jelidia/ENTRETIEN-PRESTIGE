import { NextResponse } from "next/server";
import {
  conflict,
  ok,
  okBody,
  requireUser,
  serverError,
  validationError,
} from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { profileUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

// PATCH /api/settings/profile - Update user's own profile
export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    user_id: profile.user_id,
    company_id: profile.company_id,
  });

  try {
    const body = await request.json();
    const result = profileUpdateSchema.safeParse(body);

    if (!result.success) {
      return validationError(result.error, "Invalid input");
    }

    const { fullName, email, phone } = result.data;

    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
    const idempotency = await beginIdempotency(client, request, profile.user_id, result.data);
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return conflict("idempotency_conflict", "Idempotency key conflict");
    }
    if (idempotency.action === "in_progress") {
      return conflict("idempotency_in_progress", "Request already in progress");
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (fullName !== undefined) updateData.full_name = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // Update user profile
    const { data: updatedUser, error } = await client
      .from("users")
      .update(updateData)
      .eq("user_id", profile.user_id)
      .select("user_id, full_name, email, phone")
      .single();

    if (error) {
      await captureError(error, {
        ...requestContext,
        action: "update_profile",
      });
      return serverError("Failed to update profile", "profile_update_failed");
    }

    await logAudit(client, profile.user_id, "profile_update", "user", profile.user_id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: updateData,
    });

    const storedBody = okBody(updatedUser);
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
    return ok(updatedUser);
  } catch (err) {
    await captureError(err, {
      ...requestContext,
      action: "update_profile",
    });
    return serverError("An error occurred", "profile_update_failed");
  }
}
