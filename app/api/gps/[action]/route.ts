import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { geofenceCreateSchema, gpsCheckinSchema, gpsPingSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const auth = await requirePermission(request, ["technician", "dispatch"]);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const action = params.action;
  const body = await request.json().catch(() => null);
  const ip = getRequestIp(request);

  if (action === "checkin" || action === "checkout") {
    const parsed = gpsCheckinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action,
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
      job_id: parsed.data.jobId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy_meters: parsed.data.accuracyMeters,
      source: action === "checkin" ? "manual_checkin" : "job_end",
      timestamp: new Date().toISOString(),
    });

    await logAudit(client, user.id, action === "checkin" ? "gps_checkin" : "gps_checkout", "job", parsed.data.jobId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "hourly-ping") {
    const parsed = gpsPingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "hourly-ping",
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
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy_meters: parsed.data.accuracyMeters,
      source: "hourly_ping",
      timestamp: new Date().toISOString(),
    });

    await logAudit(client, user.id, "gps_ping", "gps_location", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "history") {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const { data, error } = await client
      .from("gps_locations")
      .select("*")
      .gte("timestamp", start ?? "1970-01-01")
      .lte("timestamp", end ?? new Date().toISOString());

    if (error) {
      return NextResponse.json({ error: "Unable to load history" }, { status: 400 });
    }
    return NextResponse.json({ data });
  }

  if (action === "geofence") {
    const parsed = geofenceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid geofence" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "geofence",
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
    await client.from("geofences").insert({
      company_id: profile.company_id,
      job_id: parsed.data.jobId,
      customer_id: parsed.data.customerId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      radius_meters: parsed.data.radiusMeters ?? 50,
    });
    await logAudit(client, user.id, "geofence_create", "job", parsed.data.jobId ?? null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { customer_id: parsed.data.customerId },
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
  if (params.action !== "history") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const auth = await requirePermission(request, ["technician", "dispatch"]);
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const { data, error } = await client
    .from("gps_locations")
    .select("*")
    .gte("timestamp", start ?? "1970-01-01")
    .lte("timestamp", end ?? new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: "Unable to load history" }, { status: 400 });
  }

  return NextResponse.json({ data });
}
