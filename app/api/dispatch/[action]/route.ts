import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { dispatchReassignSchema, weatherCancelSchema, dispatchScheduleSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const action = params.action;
  const auth = await requireRole(request, ["admin", "manager", "dispatcher"], "dispatch");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const body = await request.json().catch(() => null);
  const ip = getRequestIp(request);

  if (action === "reassign") {
    const parsed = dispatchReassignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "reassign",
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
      .eq("job_id", parsed.data.jobId);

    if (error) {
      return NextResponse.json({ error: "Unable to reassign" }, { status: 400 });
    }

    await logAudit(client, profile.user_id, "dispatch_reassign", "job", parsed.data.jobId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { technician_id: parsed.data.technicianId },
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "schedule") {
    const parsed = dispatchScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "schedule",
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

    const updates: Record<string, string> = {
      scheduled_date: parsed.data.scheduledDate,
      scheduled_start_time: parsed.data.scheduledStartTime,
      scheduled_end_time: parsed.data.scheduledEndTime,
    };

    if (parsed.data.technicianId) {
      updates.technician_id = parsed.data.technicianId;
    }

    const { error } = await client
      .from("jobs")
      .update(updates)
      .eq("job_id", parsed.data.jobId);

    if (error) {
      return NextResponse.json({ error: "Unable to update schedule" }, { status: 400 });
    }

    await logAudit(client, profile.user_id, "dispatch_schedule", "job", parsed.data.jobId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: updates,
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "auto-assign") {
    const idempotency = await beginIdempotency(client, request, profile.user_id, { action: "auto-assign" });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }
    const { data: technicians } = await client
      .from("users")
      .select("user_id")
      .eq("role", "technician")
      .limit(10);

    const { data: jobs } = await client
      .from("jobs")
      .select("job_id")
      .is("technician_id", null)
      .limit(10);

    if (!technicians || !jobs) {
      return NextResponse.json({ ok: true });
    }

    for (let i = 0; i < jobs.length; i += 1) {
      const tech = technicians[i % technicians.length];
      await client
        .from("jobs")
        .update({ technician_id: tech.user_id, status: "dispatched" })
        .eq("job_id", jobs[i].job_id);
    }

    await logAudit(client, profile.user_id, "dispatch_auto_assign", "job", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { assigned: jobs.length },
    });

    const responseBody = { ok: true, assigned: jobs.length };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "weather-cancel") {
    const parsed = weatherCancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "weather-cancel",
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
      .update({ status: "cancelled" })
      .gte("scheduled_date", parsed.data.startDate)
      .lte("scheduled_date", parsed.data.endDate);

    if (error) {
      return NextResponse.json({ error: "Unable to cancel jobs" }, { status: 400 });
    }

    await logAudit(client, profile.user_id, "dispatch_weather_cancel", "job", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { start_date: parsed.data.startDate, end_date: parsed.data.endDate },
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

export async function GET(
  request: Request,
  { params }: { params: { action: string } }
) {
  const action = params.action;
  const auth = await requireRole(request, ["admin", "manager", "dispatcher"], "dispatch");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  if (action === "conflicts") {
    const { data, error } = await client
      .from("jobs")
      .select("job_id, technician_id, scheduled_date, scheduled_start_time, scheduled_end_time")
      .not("technician_id", "is", null)
      .order("scheduled_date", { ascending: true });

    if (error || !data) {
      return NextResponse.json({ error: "Unable to load conflicts" }, { status: 400 });
    }

    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
