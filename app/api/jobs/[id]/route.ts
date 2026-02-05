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
import { jobUpdateSchema } from "@/lib/validators";
import { logAudit, logJobHistory } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "jobs");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  const { data, error } = await client
    .from("jobs")
    .select("*")
    .eq("job_id", params.id)
    .eq("company_id", profile.company_id)
    .single();
  if (error || !data) {
    return notFound("Job not found", "job_not_found");
  }

  return ok(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "jobs");
  if ("response" in auth) {
    return auth.response;
  }
  const { user, profile } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = jobUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error, "Invalid update");
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data: existing } = await client
    .from("jobs")
    .select("status, technician_id, notes, actual_revenue")
    .eq("job_id", params.id)
    .eq("company_id", profile.company_id)
    .single();
  const idempotency = await beginIdempotency(client, request, user.id, parsed.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return conflict("idempotency_conflict", "Idempotency key conflict");
  }
  if (idempotency.action === "in_progress") {
    return conflict("idempotency_in_progress", "Request already in progress");
  }
  const { data, error } = await client
    .from("jobs")
    .update({ ...parsed.data, updated_by: user.id })
    .eq("job_id", params.id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error || !data) {
    return serverError("Unable to update job", "job_update_failed");
  }

  const historyEntries: Array<{
    fieldName: string;
    oldValue?: string | null;
    newValue?: string | null;
  }> = [];
  if (parsed.data.status !== undefined) {
    historyEntries.push({
      fieldName: "status",
      oldValue: existing?.status ?? null,
      newValue: parsed.data.status ?? null,
    });
  }
  if (parsed.data.technician_id !== undefined) {
    historyEntries.push({
      fieldName: "technician_id",
      oldValue: existing?.technician_id ?? null,
      newValue: parsed.data.technician_id ?? null,
    });
  }
  if (parsed.data.notes !== undefined) {
    historyEntries.push({
      fieldName: "notes",
      oldValue: existing?.notes ?? null,
      newValue: parsed.data.notes ?? null,
    });
  }
  if (parsed.data.actual_revenue !== undefined) {
    historyEntries.push({
      fieldName: "actual_revenue",
      oldValue:
        existing?.actual_revenue !== null && existing?.actual_revenue !== undefined
          ? String(existing.actual_revenue)
          : null,
      newValue:
        parsed.data.actual_revenue !== null && parsed.data.actual_revenue !== undefined
          ? String(parsed.data.actual_revenue)
          : null,
    });
  }

  await logJobHistory(client, params.id, user.id, historyEntries);

  await logAudit(client, user.id, "job_update", "job", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: parsed.data,
  });

  const storedBody = okBody(data);
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
  return ok(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "jobs");
  if ("response" in auth) {
    return auth.response;
  }
  const { user, profile } = auth;
  const ip = getRequestIp(request);
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, user.id, { action: "delete" });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return conflict("idempotency_conflict", "Idempotency key conflict");
  }
  if (idempotency.action === "in_progress") {
    return conflict("idempotency_in_progress", "Request already in progress");
  }
  const deletedAt = new Date().toISOString();
  const { error } = await client
    .from("jobs")
    .update({ deleted_at: deletedAt })
    .eq("job_id", params.id)
    .eq("company_id", profile.company_id);

  if (error) {
    return serverError("Unable to delete job", "job_delete_failed");
  }

  await logJobHistory(client, params.id, user.id, [
    { fieldName: "deleted_at", oldValue: null, newValue: deletedAt, reason: "delete" },
  ]);

  await logAudit(client, user.id, "job_delete", "job", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = { ok: true };
  const storedBody = okBody(responseBody, { flatten: true });
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
  return ok(responseBody, { flatten: true });
}
