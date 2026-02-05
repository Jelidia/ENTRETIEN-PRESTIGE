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
import { invoiceCreateSchema } from "@/lib/validators";
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
    return serverError("Unable to load invoices", "invoices_load_failed");
  }

  return ok(data);
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
    return validationError(parsed.error, "Invalid invoice");
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
    return serverError("Unable to create invoice", "invoice_create_failed");
  }

  await logAudit(client, profile.user_id, "invoice_create", "invoice", data.invoice_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { invoice_number: data.invoice_number, total_amount: data.total_amount },
  });

  const storedBody = okBody(data);
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 201);
  return ok(data, { status: 201 });
}
