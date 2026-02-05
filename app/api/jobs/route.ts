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
import { jobCreateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "jobs");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  let query = client
    .from("jobs")
    .select(
      "job_id, service_type, status, scheduled_date, scheduled_start_time, scheduled_end_time, address, estimated_revenue, actual_revenue, customer_id"
    )
    .order("scheduled_date", { ascending: true })
    .limit(100);

  if (profile.role === "technician") {
    query = query.eq("technician_id", user.id);
  } else if (profile.role === "sales_rep") {
    query = query.eq("sales_rep_id", user.id);
  }

  const { data, error } = await query;
  if (error) {
    return serverError("Unable to load jobs", "jobs_load_failed");
  }

  return ok(data);
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "jobs");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = jobCreateSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error, "Invalid job payload");
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
  const { data, error } = await client
    .from("jobs")
    .insert({
      company_id: profile.company_id,
      customer_id: parsed.data.customerId,
      service_type: parsed.data.serviceType,
      service_package: parsed.data.servicePackage,
      description: parsed.data.description,
      scheduled_date: parsed.data.scheduledDate,
      scheduled_start_time: parsed.data.scheduledStartTime,
      scheduled_end_time: parsed.data.scheduledEndTime,
      address: parsed.data.address,
      city: parsed.data.city,
      postal_code: parsed.data.postalCode,
      estimated_revenue: parsed.data.estimatedRevenue
        ? Number(parsed.data.estimatedRevenue)
        : null,
      created_by: user.id,
      updated_by: user.id,
      status: "created",
    })
    .select()
    .single();

  if (error || !data) {
    return serverError("Unable to create job", "job_create_failed");
  }

  await logAudit(client, user.id, "create_job", "job", data.job_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { customer_id: data.customer_id, service_type: data.service_type },
  });

  const storedBody = okBody(data);
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 201);
  return ok(data, { status: 201 });
}
