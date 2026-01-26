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

  if (action === "assign") {
    const parsed = jobAssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid assignment" }, { status: 400 });
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

    return NextResponse.json({ ok: true });
  }

  if (action === "check-in") {
    const parsed = jobCheckInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid check-in" }, { status: 400 });
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

    return NextResponse.json({ ok: true });
  }

  if (action === "check-out") {
    const parsed = jobCheckOutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid check-out" }, { status: 400 });
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

    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
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

    return NextResponse.json({ ok: true });
  }

  if (action === "no-show") {
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

    return NextResponse.json({ ok: true });
  }

  if (action === "upsell") {
    const parsed = jobUpsellSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid upsell" }, { status: 400 });
    }

    await client
      .from("jobs")
      .update({ upsells: parsed.data.upsells, actual_revenue: parsed.data.actualRevenue })
      .eq("job_id", params.id);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
