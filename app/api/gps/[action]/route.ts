import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { geofenceCreateSchema, gpsCheckinSchema, gpsPingSchema } from "@/lib/validators";

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

  if (action === "checkin" || action === "checkout") {
    const parsed = gpsCheckinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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

    return NextResponse.json({ ok: true });
  }

  if (action === "hourly-ping") {
    const parsed = gpsPingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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

    return NextResponse.json({ ok: true });
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
    await client.from("geofences").insert({
      company_id: profile.company_id,
      job_id: parsed.data.jobId,
      customer_id: parsed.data.customerId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      radius_meters: parsed.data.radiusMeters ?? 50,
    });
    return NextResponse.json({ ok: true });
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
