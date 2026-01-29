import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { invoiceCreateSchema } from "@/lib/validators";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "invoices");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("invoices")
    .select("invoice_id, invoice_number, payment_status, total_amount, due_date, customer_id")
    .order("issued_date", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Unable to load invoices" }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "invoices");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = invoiceCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice" }, { status: 400 });
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
    .from("invoices")
    .insert({
      company_id: profile.company_id,
      customer_id: parsed.data.customerId,
      invoice_number: parsed.data.invoiceNumber,
      issued_date: new Date().toISOString(),
      due_date: parsed.data.dueDate,
      total_amount: Number(parsed.data.totalAmount),
      payment_status: parsed.data.status ?? "draft",
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create invoice" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "invoice_create", "invoice", data.invoice_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { invoice_number: data.invoice_number, total_amount: data.total_amount },
  });

  const responseBody = { data };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 201);
  return NextResponse.json(responseBody, { status: 201 });
}
