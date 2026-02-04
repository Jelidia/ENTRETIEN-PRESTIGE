
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { leadCreateSchema, leadsQuerySchema } from "@/lib/validators";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { mapLeadRow, splitCustomerName, type LeadRow } from "@/lib/leads";

const leadSelect =
  "lead_id, first_name, last_name, phone, email, address, status, estimated_job_value, follow_up_date, notes, created_at, sales_rep_id";
const defaultPageSize = 100;

export async function GET(request: Request) {
  const auth = await requirePermission(request, "sales");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { searchParams } = new URL(request.url);
  const parsed = leadsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const page = parsed.data.page ?? 1;
  const pageSize = parsed.data.page_size ?? defaultPageSize;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = client
    .from("leads")
    .select(leadSelect, { count: "exact" })
    .eq("company_id", profile.company_id);

  if (profile.role === "sales_rep") {
    query = query.eq("sales_rep_id", user.id);
  }

  if (parsed.data.status) {
    query = query.eq("status", parsed.data.status);
  }

  const search = parsed.data.search?.trim();
  if (search) {
    const like = "%" + search + "%";
    query = query.or(
      [
        "first_name.ilike." + like,
        "last_name.ilike." + like,
        "email.ilike." + like,
        "phone.ilike." + like,
        "address.ilike." + like,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    return NextResponse.json({ error: "Unable to load leads" }, { status: 400 });
  }

  const leads = (data ?? []).map((lead) => mapLeadRow(lead as LeadRow));
  const total = count ?? leads.length;
  const responseBody = { leads, page, page_size: pageSize, total };
  return NextResponse.json({ success: true, data: responseBody, ...responseBody });
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "sales");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = leadCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
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

  const { firstName, lastName } = splitCustomerName(parsed.data.customer_name);
  const salesRepId = profile.role === "sales_rep" ? user.id : parsed.data.sales_rep_id ?? null;
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("leads")
    .insert({
      company_id: profile.company_id,
      first_name: firstName,
      last_name: lastName,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      estimated_job_value: parsed.data.estimated_value ?? null,
      follow_up_date: parsed.data.follow_up_date ?? null,
      notes: parsed.data.notes ?? null,
      status: parsed.data.status ?? "new",
      sales_rep_id: salesRepId,
      created_at: now,
      updated_at: now,
    })
    .select(leadSelect)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create lead" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "lead_create", "lead", data.lead_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: {
      status: data.status,
      sales_rep_id: data.sales_rep_id ?? null,
    },
  });

  const lead = mapLeadRow(data as LeadRow);
  const responseBody = { lead };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 201);
  return NextResponse.json({ success: true, data: responseBody, ...responseBody }, { status: 201 });
}
