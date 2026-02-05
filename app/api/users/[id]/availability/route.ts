import { NextResponse } from "next/server";
import {
  conflict,
  forbidden,
  notFound,
  ok,
  okBody,
  requireRole,
  serverError,
  validationError,
} from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { availabilityUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

// GET /api/users/[id]/availability - Get user's availability
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager", "technician", "sales_rep"], [
    "team",
    "sales",
    "technician",
  ]);
  if ("response" in auth) return auth.response;

  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const requestContext = getRequestContext(request, {
    user_id: user.id,
    company_id: profile.company_id,
    target_user_id: params.id,
  });

  // Sales reps and technicians can only view their own availability
  if ((profile.role === "technician" || profile.role === "sales_rep") && params.id !== user.id) {
    return forbidden(
      "Vous ne pouvez voir que votre propre disponibilité",
      "availability_forbidden"
    );
  }

  // Verify user exists and belongs to the same company
  const { data: targetUser, error: userError } = await client
    .from("users")
    .select("user_id, company_id")
    .eq("user_id", params.id)
    .maybeSingle();

  if (userError || !targetUser) {
    return notFound("Utilisateur introuvable", "user_not_found");
  }

  if (targetUser.company_id !== profile.company_id) {
    return notFound("Utilisateur introuvable", "user_not_found");
  }

  // Get availability
  const { data: availability, error } = await client
    .from("employee_availability")
    .select("availability_id, day_of_week, hour, is_available")
    .eq("user_id", params.id)
    .eq("company_id", profile.company_id)
    .order("day_of_week", { ascending: true })
    .order("hour", { ascending: true });

  if (error) {
    await captureError(error, {
      ...requestContext,
      action: "fetch_availability",
    });
    return serverError("Échec du chargement de la disponibilité", "availability_load_failed");
  }

  return ok({ availability: availability ?? [] }, { flatten: true });
}

// POST /api/users/[id]/availability - Update user's availability
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager", "technician", "sales_rep"], [
    "team",
    "sales",
    "technician",
  ]);
  if ("response" in auth) return auth.response;

  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    user_id: user.id,
    company_id: profile.company_id,
    target_user_id: params.id,
  });

  // Sales reps and technicians can only update their own availability
  if ((profile.role === "technician" || profile.role === "sales_rep") && params.id !== user.id) {
    return forbidden(
      "Vous ne pouvez modifier que votre propre disponibilité",
      "availability_forbidden"
    );
  }

  // Verify user exists and belongs to the same company
  const { data: targetUser, error: userError } = await client
    .from("users")
    .select("user_id, company_id")
    .eq("user_id", params.id)
    .maybeSingle();

  if (userError || !targetUser) {
    return notFound("Utilisateur introuvable", "user_not_found");
  }

  if (targetUser.company_id !== profile.company_id) {
    return notFound("Utilisateur introuvable", "user_not_found");
  }

  // Validate input
  const body = await request.json();
  const validation = availabilityUpdateSchema.safeParse(body);

  if (!validation.success) {
    return validationError(validation.error, "Données invalides");
  }

  const { availability } = validation.data;
  const idempotency = await beginIdempotency(client, request, user.id, validation.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return conflict("idempotency_conflict", "Idempotency key conflict");
  }
  if (idempotency.action === "in_progress") {
    return conflict("idempotency_in_progress", "Request already in progress");
  }

  // Delete existing availability
  await client
    .from("employee_availability")
    .delete()
    .eq("user_id", params.id)
    .eq("company_id", profile.company_id);

  // Insert new availability (only for slots marked as available)
  const availableSlots = availability
    .filter((slot) => slot.is_available)
    .map((slot) => ({
      company_id: profile.company_id,
      user_id: params.id,
      day_of_week: slot.day_of_week,
      hour: slot.hour,
      is_available: true,
    }));

  if (availableSlots.length > 0) {
    const { error: insertError } = await client
      .from("employee_availability")
      .insert(availableSlots);

    if (insertError) {
      await captureError(insertError, {
        ...requestContext,
        action: "save_availability",
      });
      return serverError("Échec de l'enregistrement de la disponibilité", "availability_save_failed");
    }
  }

  await logAudit(client, user.id, "availability_update", "user", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { slots: availableSlots.length },
  });

  const responseBody = { count: availableSlots.length };
  const storedBody = okBody(responseBody, { flatten: true });
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
  return ok(responseBody, { flatten: true });
}
