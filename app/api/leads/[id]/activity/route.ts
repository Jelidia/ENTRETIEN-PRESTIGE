
import { NextResponse } from "next/server";
import {
  conflict,
  notFound,
  ok,
  okBody,
  requirePermission,
  serverError,
  validationError,
} from "@/lib/auth";
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
    return notFound("Lead not found", "lead_not_found");
  }

  const { data, error } = await client
    .from("user_audit_log")
    .select(activitySelect)
    .eq("resource_type", "lead")
    .eq("resource_id", params.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return serverError("Unable to load activity", "lead_activity_load_failed");
  }

  const activities = data ?? [];
  const responseBody = { activities };
  return ok(responseBody, { flatten: true });
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
    return validationError(parsed.error, "Invalid activity");
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
    return notFound("Lead not found", "lead_not_found");
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
    return conflict("idempotency_conflict", "Idempotency key conflict");
  }
  if (idempotency.action === "in_progress") {
    return conflict("idempotency_in_progress", "Request already in progress");
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

  const responseBody = { ok: true };
  const storedBody = okBody(responseBody, { flatten: true });
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 201);
  return ok(responseBody, { status: 201, flatten: true });
}
