import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { jobCreateSchema } from "@/lib/validators";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  let query = client
    .from("jobs")
    .select("job_id, service_type, status, scheduled_date, estimated_revenue, actual_revenue, customer_id")
    .order("scheduled_date", { ascending: true })
    .limit(100);

  if (profile.role === "technician") {
    query = query.eq("technician_id", user.id);
  } else if (profile.role === "sales_rep") {
    query = query.eq("sales_rep_id", user.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Unable to load jobs" }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const body = await request.json().catch(() => null);
  const parsed = jobCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job payload" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
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
    return NextResponse.json({ error: "Unable to create job" }, { status: 400 });
  }

  await logAudit(client, user.id, "create_job", "job", data.job_id, "success");
  return NextResponse.json({ data }, { status: 201 });
}
