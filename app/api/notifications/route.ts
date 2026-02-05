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
import { emptyQuerySchema, notificationDeleteQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "notifications");
  if ("response" in auth) {
    return auth.response;
  }
  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return validationError(queryResult.error, "Invalid request");
  }
  const { user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("notifications")
    .select("notif_id, title, body, status, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return serverError("Unable to load notifications", "notifications_load_failed");
  }

  return ok(data);
}

export async function DELETE(request: Request) {
  const auth = await requirePermission(request, "notifications");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const { searchParams } = new URL(request.url);
  const queryResult = notificationDeleteQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryResult.success) {
    return validationError(queryResult.error, "Invalid notification id");
  }
  const { id } = queryResult.data;

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, { notif_id: id });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return conflict("idempotency_conflict", "Idempotency key conflict");
  }
  if (idempotency.action === "in_progress") {
    return conflict("idempotency_in_progress", "Request already in progress");
  }
  const { error } = await client.from("notifications").delete().eq("notif_id", id);
  if (error) {
    return serverError("Unable to delete", "notification_delete_failed");
  }

  await logAudit(client, profile.user_id, "notification_delete", "notification", id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });
  const responseBody = { ok: true };
  const storedBody = okBody(responseBody, { flatten: true });
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
  return ok(responseBody, { flatten: true });
}
