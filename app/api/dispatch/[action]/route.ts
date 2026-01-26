import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { dispatchReassignSchema, weatherCancelSchema } from "@/lib/validators";

export async function POST(
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
  const body = await request.json().catch(() => null);

  if (action === "reassign") {
    const parsed = dispatchReassignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { error } = await client
      .from("jobs")
      .update({ technician_id: parsed.data.technicianId, status: "dispatched" })
      .eq("job_id", parsed.data.jobId);

    if (error) {
      return NextResponse.json({ error: "Unable to reassign" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "auto-assign") {
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

    return NextResponse.json({ ok: true, assigned: jobs.length });
  }

  if (action === "weather-cancel") {
    const parsed = weatherCancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { error } = await client
      .from("jobs")
      .update({ status: "cancelled" })
      .gte("scheduled_date", parsed.data.startDate)
      .lte("scheduled_date", parsed.data.endDate);

    if (error) {
      return NextResponse.json({ error: "Unable to cancel jobs" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
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
