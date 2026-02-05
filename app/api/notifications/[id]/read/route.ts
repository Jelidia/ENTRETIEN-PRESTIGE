import { NextResponse } from "next/server";
import {
  conflict,
  ok,
  okBody,
  requirePermission,
  serverError,
  validationError,
} from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { idParamSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "notifications");
  if ("response" in auth) {
    return auth.response;
  }
  const paramsResult = idParamSchema.safeParse(params);
  if (!paramsResult.success) {
    return validationError(paramsResult.error, "Invalid request");
  }
  const notifId = paramsResult.data.id;
  const { profile } = auth;
  const ip = getRequestIp(request);
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, { notif_id: notifId });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return conflict("idempotency_conflict", "Idempotency key conflict");
  }
  if (idempotency.action === "in_progress") {
    return conflict("idempotency_in_progress", "Request already in progress");
  }
  const { error } = await client
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString(), status: "read" })
    .eq("notif_id", notifId);

  if (error) {
    return serverError("Unable to update", "notification_update_failed");
  }

  await logAudit(client, profile.user_id, "notification_read", "notification", notifId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = { ok: true };
  const storedBody = okBody(responseBody, { flatten: true });
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
  return ok(responseBody, { flatten: true });
}
