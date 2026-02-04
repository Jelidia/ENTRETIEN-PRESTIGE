
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { leadUpdateSchema } from "@/lib/validators";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { mapLeadRow, splitCustomerName, type LeadRow } from "@/lib/leads";

const leadSelect =
  "lead_id, first_name, last_name, phone, email, address, status, estimated_job_value, follow_up_date, notes, created_at, sales_rep_id";

async function fetchLead(
  client: ReturnType<typeof createUserClient>,
  leadId: string,
  companyId: string,
  salesRepId?: string | null
) {
  let query = client
    .from("leads")
    .select(leadSelect)
    .eq("lead_id", leadId)
    .eq("company_id", companyId);

  if (salesRepId) {
    query = query.eq("sales_rep_id", salesRepId);
  }

  return query.maybeSingle();
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "sales");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const salesRepId = profile.role === "sales_rep" ? user.id : null;
  const { data, error } = await fetchLead(client, params.id, profile.company_id, salesRepId);

  if (error || !data) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const lead = mapLeadRow(data as LeadRow);
  return NextResponse.json({ success: true, data: { lead }, lead });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "sales");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = leadUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  if (profile.role === "sales_rep" && parsed.data.sales_rep_id !== undefined) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const salesRepId = profile.role === "sales_rep" ? user.id : null;
  const { data: existing, error: existingError } = await fetchLead(
    client,
    params.id,
    profile.company_id,
    salesRepId
  );

  if (existingError || !existing) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const idempotency = await beginIdempotency(client, request, user.id, parsed.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.customer_name !== undefined) {
    const split = splitCustomerName(parsed.data.customer_name);
    updates.first_name = split.firstName;
    updates.last_name = split.lastName;
  }
  if (parsed.data.phone !== undefined) {
    updates.phone = parsed.data.phone;
  }
  if (parsed.data.email !== undefined) {
    updates.email = parsed.data.email;
  }
  if (parsed.data.address !== undefined) {
    updates.address = parsed.data.address;
  }
  if (parsed.data.estimated_value !== undefined) {
    updates.estimated_job_value = parsed.data.estimated_value;
  }
  if (parsed.data.follow_up_date !== undefined) {
    updates.follow_up_date = parsed.data.follow_up_date;
  }
  if (parsed.data.notes !== undefined) {
    updates.notes = parsed.data.notes;
  }
  if (parsed.data.status !== undefined) {
    updates.status = parsed.data.status;
  }
  if (parsed.data.lost_reason !== undefined) {
    updates.lost_reason = parsed.data.lost_reason;
  }
  if (parsed.data.sales_rep_id !== undefined) {
    updates.sales_rep_id = parsed.data.sales_rep_id;
  }

  let updateQuery = client
    .from("leads")
    .update(updates)
    .eq("lead_id", params.id)
    .eq("company_id", profile.company_id);

  if (salesRepId) {
    updateQuery = updateQuery.eq("sales_rep_id", salesRepId);
  }

  const { data: updated, error } = await updateQuery.select(leadSelect).single();

  if (error || !updated) {
    return NextResponse.json({ error: "Unable to update lead" }, { status: 400 });
  }

  const action =
    parsed.data.status && parsed.data.status !== existing.status
      ? "lead_status_change"
      : "lead_update";
  await logAudit(client, profile.user_id, action, "lead", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    oldValues: {
      status: existing.status,
      sales_rep_id: existing.sales_rep_id ?? null,
    },
    newValues: {
      status: updated.status,
      sales_rep_id: updated.sales_rep_id ?? null,
    },
  });

  const lead = mapLeadRow(updated as LeadRow);
  const responseBody = { lead };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json({ success: true, data: responseBody, ...responseBody });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "sales");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const ip = getRequestIp(request);
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const salesRepId = profile.role === "sales_rep" ? user.id : null;
  const idempotency = await beginIdempotency(client, request, user.id, { action: "delete" });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
  }

  const { data: existing, error: existingError } = await fetchLead(
    client,
    params.id,
    profile.company_id,
    salesRepId
  );

  if (existingError || !existing) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  let deleteQuery = client
    .from("leads")
    .delete()
    .eq("lead_id", params.id)
    .eq("company_id", profile.company_id);

  if (salesRepId) {
    deleteQuery = deleteQuery.eq("sales_rep_id", salesRepId);
  }

  const { error } = await deleteQuery;
  if (error) {
    return NextResponse.json({ error: "Unable to delete lead" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "lead_delete", "lead", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    oldValues: { status: existing.status },
  });

  const responseBody = { success: true, data: { ok: true }, ok: true };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
