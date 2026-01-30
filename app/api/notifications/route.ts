import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
    return NextResponse.json({ error: "Unable to load notifications" }, { status: 400 });
  }

  return NextResponse.json({ data });
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
    return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
  }
  const { id } = queryResult.data;

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, { notif_id: id });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
  }
  const { error } = await client.from("notifications").delete().eq("notif_id", id);
  if (error) {
    return NextResponse.json({ error: "Unable to delete" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "notification_delete", "notification", id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });
  const responseBody = { ok: true };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
