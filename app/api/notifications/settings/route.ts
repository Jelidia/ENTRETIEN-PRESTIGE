import { NextResponse } from "next/server";
import { notificationSettingsSchema } from "@/lib/validators";
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

export async function POST(request: Request) {
  const auth = await requirePermission(request, "notifications");
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = notificationSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error, "Invalid settings");
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, user.id, parsed.data);
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
    .from("users")
    .update({ notification_settings: parsed.data })
    .eq("user_id", user.id);

  if (error) {
    return serverError("Unable to save settings", "notification_settings_save_failed");
  }

  await logAudit(client, user.id, "notification_settings_update", "user", user.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = { ok: true };
  const storedBody = okBody(responseBody, { flatten: true });
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
  return ok(responseBody, { flatten: true });
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, "notifications");
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("users")
    .select("notification_settings")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return serverError("Unable to load settings", "notification_settings_load_failed");
  }

  return ok(data?.notification_settings ?? {});
}
