import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { customerCreateSchema } from "@/lib/validators";
import { requirePermission } from "@/lib/auth";
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
    .select("customer_id, first_name, last_name, status, customer_type, last_service_date, account_balance")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Unable to load customers" }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
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
    return NextResponse.json({ error: "Invalid customer" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, parsed.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
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
    return NextResponse.json({ error: "Unable to create customer" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "customer_create", "customer", data.customer_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { first_name: data.first_name, last_name: data.last_name },
  });

  const responseBody = { success: true, data };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 201);
  return NextResponse.json(responseBody, { status: 201 });
}
