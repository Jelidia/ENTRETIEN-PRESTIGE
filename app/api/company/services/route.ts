import { requirePermission, requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { companyServiceCreateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { NextResponse } from "next/server";

type ServicePayload = {
  name: string;
  description?: string;
  defaultDurationMinutes?: number;
  defaultPrice?: number;
  active?: boolean;
  sortOrder?: number;
};

function buildServiceInsert(profileCompanyId: string, payload: ServicePayload) {
  return {
    company_id: profileCompanyId,
    name: payload.name.trim(),
    description: payload.description ?? null,
    default_duration_minutes: payload.defaultDurationMinutes ?? null,
    default_price: payload.defaultPrice ?? null,
    active: payload.active ?? true,
    sort_order: payload.sortOrder ?? 0,
  };
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  const { data, error } = await client
    .from("company_services")
    .select("service_id, name, description, default_duration_minutes, default_price, active, sort_order, created_at, updated_at")
    .eq("company_id", profile.company_id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: "Unable to load services" }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "settings");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = companyServiceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid service" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const insertPayload = buildServiceInsert(profile.company_id, parsed.data);
  const idempotency = await beginIdempotency(client, request, profile.user_id, insertPayload);
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
    .insert(insertPayload)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Unable to create service" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "company_service_create", "company_service", data.service_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: insertPayload,
  });

  const responseBody = { success: true, data };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 201);
  return NextResponse.json(responseBody, { status: 201 });
}
