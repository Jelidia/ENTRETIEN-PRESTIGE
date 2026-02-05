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
import { customerUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("customer_id", params.id)
    .eq("company_id", profile.company_id)
    .single();
  if (error || !data) {
    return notFound("Customer not found", "customer_not_found");
  }

  return ok(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = customerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error, "Invalid update");
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, parsed.data);
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
    .from("customers")
    .update(parsed.data)
    .eq("customer_id", params.id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error || !data) {
    return serverError("Unable to update customer", "customer_update_failed");
  }

  await logAudit(client, profile.user_id, "customer_update", "customer", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: parsed.data,
  });

  const storedBody = okBody(data);
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
  return ok(data);
}
