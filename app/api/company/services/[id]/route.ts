import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { companyServiceUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { NextResponse } from "next/server";

type ServiceUpdatePayload = {
  name?: string;
  description?: string;
  defaultDurationMinutes?: number;
  defaultPrice?: number;
  active?: boolean;
  sortOrder?: number;
};

function buildServiceUpdate(payload: ServiceUpdatePayload) {
  const update: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    update.name = payload.name.trim();
  }
  if (payload.description !== undefined) {
    update.description = payload.description;
  }
  if (payload.defaultDurationMinutes !== undefined) {
    update.default_duration_minutes = payload.defaultDurationMinutes;
  }
  if (payload.defaultPrice !== undefined) {
    update.default_price = payload.defaultPrice;
  }
  if (payload.active !== undefined) {
    update.active = payload.active;
  }
  if (payload.sortOrder !== undefined) {
    update.sort_order = payload.sortOrder;
  }
  if (Object.keys(update).length) {
    update.updated_at = new Date().toISOString();
  }
  return update;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "settings");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = companyServiceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid service" }, { status: 400 });
  }

  const updatePayload = buildServiceUpdate(parsed.data);
  if (!Object.keys(updatePayload).length) {
    return NextResponse.json({ success: false, error: "No changes provided" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, updatePayload);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }

  const { data, error } = await client
    .from("company_services")
    .update(updatePayload)
    .eq("service_id", params.id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Unable to update service" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "company_service_update", "company_service", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: updatePayload,
  });

  const responseBody = { success: true, data };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "settings");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  const idempotency = await beginIdempotency(client, request, profile.user_id, {
    serviceId: params.id,
  });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }

  const { data, error } = await client
    .from("company_services")
    .delete()
    .eq("service_id", params.id)
    .eq("company_id", profile.company_id)
    .select("service_id")
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Unable to delete service" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "company_service_delete", "company_service", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = { success: true, data };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
