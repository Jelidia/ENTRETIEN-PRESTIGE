import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { blacklistSchema, complaintSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const action = params.action;
  const body = await request.json().catch(() => null);
  const ip = getRequestIp(request);

  if (action === "blacklist") {
    const parsed = blacklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "blacklist",
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

    const { error } = await client.from("customer_blacklist").insert({
      customer_id: params.id,
      company_id: profile.company_id,
      reason: parsed.data.reason,
      description: parsed.data.description,
      risk_level: parsed.data.riskLevel,
      recommended_action: parsed.data.recommendedAction,
      added_by: user.id,
      date_added: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: "Unable to blacklist" }, { status: 400 });
    }

    await logAudit(client, user.id, "customer_blacklist", "customer", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { risk_level: parsed.data.riskLevel },
    });

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "complaint") {
    const parsed = complaintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid complaint" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "complaint",
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

    const { error } = await client.from("job_quality_issues").insert({
      company_id: profile.company_id,
      customer_id: params.id,
      job_id: parsed.data.jobId,
      complaint_type: parsed.data.complaintType,
      description: parsed.data.description,
      severity: parsed.data.severity,
      reported_by: parsed.data.reportedBy ?? user.id,
      reported_date: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: "Unable to file complaint" }, { status: 400 });
    }

    await logAudit(client, user.id, "customer_complaint", "customer", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { job_id: parsed.data.jobId, complaint_type: parsed.data.complaintType },
    });

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const action = params.action;

  if (action === "jobs") {
    const { data, error } = await client
      .from("jobs")
      .select("job_id, service_type, status, scheduled_date")
      .eq("customer_id", params.id);
    if (error) {
      return NextResponse.json({ error: "Unable to load jobs" }, { status: 400 });
    }
    return NextResponse.json({ success: true, data });
  }

  if (action === "invoices") {
    const { data, error } = await client
      .from("invoices")
      .select("invoice_id, invoice_number, payment_status, total_amount, due_date")
      .eq("customer_id", params.id);
    if (error) {
      return NextResponse.json({ error: "Unable to load invoices" }, { status: 400 });
    }
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
