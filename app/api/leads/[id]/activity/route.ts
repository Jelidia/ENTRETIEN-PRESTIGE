
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { leadActivityCreateSchema } from "@/lib/validators";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

const activitySelect = "audit_id, action, status, new_values, created_at, user_id";
const leadSelect = "lead_id, sales_rep_id";

async function ensureLeadAccess(
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
  const { data: lead, error: leadError } = await ensureLeadAccess(
    client,
    params.id,
    profile.company_id,
    salesRepId
  );

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const { data, error } = await client
    .from("user_audit_log")
    .select(activitySelect)
    .eq("resource_type", "lead")
    .eq("resource_id", params.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Unable to load activity" }, { status: 400 });
  }

  const activities = data ?? [];
  const responseBody = { activities };
  return NextResponse.json({ success: true, data: responseBody, ...responseBody });
}

export async function POST(
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
  const parsed = leadActivityCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid activity" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const salesRepId = profile.role === "sales_rep" ? user.id : null;
  const { data: lead, error: leadError } = await ensureLeadAccess(
    client,
    params.id,
    profile.company_id,
    salesRepId
  );

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const idempotency = await beginIdempotency(client, request, user.id, {
    lead_id: params.id,
    type: parsed.data.type,
    notes: parsed.data.notes ?? null,
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

  const action = "lead_" + parsed.data.type;
  await logAudit(client, user.id, action, "lead", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: {
      type: parsed.data.type,
      notes: parsed.data.notes ?? null,
    },
  });

  const responseBody = { success: true, data: { ok: true }, ok: true };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 201);
  return NextResponse.json(responseBody, { status: 201 });
}
