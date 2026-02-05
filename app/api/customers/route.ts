import { NextResponse } from "next/server";
import {
  conflict,
  ok,
  okBody,
  requirePermission,
  serverError,
  validationError,
} from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { customerCreateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("customers")
    .select("customer_id, first_name, last_name, phone, status, customer_type, last_service_date, account_balance")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return serverError("Unable to load customers", "customers_load_failed");
  }

  return ok(data);
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = customerCreateSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error, "Invalid customer");
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
    .insert({
      company_id: profile.company_id,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      customer_type: parsed.data.type,
      address: parsed.data.address,
      city: parsed.data.city,
      postal_code: parsed.data.postalCode,
    })
    .select()
    .single();

  if (error || !data) {
    return serverError("Unable to create customer", "customer_create_failed");
  }

  await logAudit(client, profile.user_id, "customer_create", "customer", data.customer_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { first_name: data.first_name, last_name: data.last_name },
  });

  const storedBody = okBody(data);
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 201);
  return ok(data, { status: 201 });
}
