import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient, createAdminClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import {
  jobAssignSchema,
  jobCheckInSchema,
  jobCheckOutSchema,
  jobUpsellSchema,
} from "@/lib/validators";
import { createNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  const auth = await requirePermission(request, "jobs");
  if ("response" in auth) {
    return auth.response;
  }
  const { user, profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const admin = createAdminClient();
  const action = params.action;
  const body = await request.json().catch(() => null);
  const ip = getRequestIp(request);

  if (action === "assign") {
    const parsed = jobAssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid assignment" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "assign",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }

    const { error } = await client
      .from("jobs")
      .update({ technician_id: parsed.data.technicianId, status: "dispatched" })
      .eq("job_id", params.id);

    if (error) {
      return NextResponse.json({ error: "Unable to assign job" }, { status: 400 });
    }

    await client.from("job_assignments").insert({
      job_id: params.id,
      technician_id: parsed.data.technicianId,
      assigned_at: new Date().toISOString(),
      assigned_by: user.id,
    });

    await createNotification(admin, {
      userId: parsed.data.technicianId,
      companyId: profile.company_id,
      type: "job_assigned",
      title: "New job assigned",
      body: `Job ${params.id} assigned to you`,
    });

    await logAudit(client, user.id, "job_assign", "job", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { technician_id: parsed.data.technicianId },
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "check-in") {
    const parsed = jobCheckInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid check-in" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "check-in",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }

    await client.from("gps_locations").insert({
      company_id: profile.company_id,
      technician_id: user.id,
      job_id: params.id,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy_meters: parsed.data.accuracyMeters,
      source: "job_start",
      timestamp: new Date().toISOString(),
    });

    await client
      .from("jobs")
      .update({ status: "in_progress", actual_start_time: new Date().toISOString() })
      .eq("job_id", params.id);

    await logAudit(client, user.id, "job_check_in", "job", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "check-out") {
    const parsed = jobCheckOutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid check-out" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "check-out",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }

    await client.from("gps_locations").insert({
      company_id: profile.company_id,
      technician_id: user.id,
      job_id: params.id,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy_meters: parsed.data.accuracyMeters,
      source: "job_end",
      timestamp: new Date().toISOString(),
    });

    await client
      .from("jobs")
      .update({ status: "completed", actual_end_time: new Date().toISOString() })
      .eq("job_id", params.id);

    await logAudit(client, user.id, "job_check_out", "job", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "complete") {
    const idempotency = await beginIdempotency(client, request, user.id, { action: "complete" });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }
    await client
      .from("jobs")
      .update({ status: "completed", updated_by: user.id })
      .eq("job_id", params.id);

    const { data: job } = await client
      .from("jobs")
      .select("customer_id, estimated_revenue, actual_revenue")
      .eq("job_id", params.id)
      .single();

    const invoiceNumber = `INV-${Date.now()}`;
    await client.from("invoices").insert({
      company_id: profile.company_id,
      job_id: params.id,
      customer_id: job?.customer_id ?? null,
      invoice_number: invoiceNumber,
      issued_date: new Date().toISOString(),
      total_amount: job?.actual_revenue ?? job?.estimated_revenue ?? null,
      payment_status: "draft",
    });

    await logAudit(client, user.id, "job_complete", "job", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { invoice_number: invoiceNumber },
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "no-show") {
    const idempotency = await beginIdempotency(client, request, user.id, { action: "no-show" });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }
    await client
      .from("jobs")
      .update({ status: "no_show", updated_by: user.id })
      .eq("job_id", params.id);

    await createNotification(admin, {
      userId: user.id,
      companyId: profile.company_id,
      type: "no_show",
      title: "No-show recorded",
      body: `Job ${params.id} marked as no-show`,
    });

    await logAudit(client, user.id, "job_no_show", "job", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "upsell") {
    const parsed = jobUpsellSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid upsell" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "upsell",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }

    await client
      .from("jobs")
      .update({ upsells: parsed.data.upsells, actual_revenue: parsed.data.actualRevenue })
      .eq("job_id", params.id);

    await logAudit(client, user.id, "job_upsell", "job", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { actual_revenue: parsed.data.actualRevenue },
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
