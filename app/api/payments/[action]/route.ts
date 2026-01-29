import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { paymentInitSchema, paymentRefundSchema } from "@/lib/validators";
import { createPaymentIntent, handleStripeWebhook, refundPayment } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabaseServer";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const action = params.action;
  const ip = getRequestIp(request);

  if (action === "callback") {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    const result = await handleStripeWebhook(payload, signature);

    if ("event" in result && result.event) {
      const event: any = result.event;
      if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object;
        const invoiceId = intent.metadata?.invoiceId;
        if (invoiceId) {
          const admin = createAdminClient();
          await admin
            .from("invoices")
            .update({ payment_status: "paid", paid_amount: intent.amount_received / 100, paid_date: new Date().toISOString() })
            .eq("invoice_id", invoiceId);
          await logAudit(admin, null, "payment_webhook", "invoice", invoiceId, "success", {
            ipAddress: ip,
            userAgent: request.headers.get("user-agent") ?? null,
            newValues: { event: event.type },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  }

  const auth = await requireRole(request, ["admin", "manager", "sales_rep"], "invoices");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { profile } = auth;
  const body = await request.json().catch(() => null);

  if (action === "init") {
    const parsed = paymentInitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "init",
      payload: parsed.data,
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

    const intent = await createPaymentIntent({
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      metadata: { invoiceId: parsed.data.invoiceId },
    });
    await logAudit(client, auth.profile.user_id, "payment_init", "invoice", parsed.data.invoiceId, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { amount: parsed.data.amount, currency: parsed.data.currency },
    });
    const responseBody = { data: intent };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "interac") {
    const { invoiceId, amount } = body ?? {};
    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "interac",
      payload: { invoiceId, amount },
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
    await client
      .from("invoices")
      .update({ payment_status: "paid", paid_amount: amount, paid_date: new Date().toISOString() })
      .eq("invoice_id", invoiceId);
    await logAudit(client, auth.profile.user_id, "payment_interac", "invoice", invoiceId ?? null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { amount },
    });
    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "refund") {
    const parsed = paymentRefundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid refund" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "refund",
      payload: parsed.data,
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

    const result = await refundPayment(parsed.data.paymentIntentId, parsed.data.amount);
    await logAudit(client, auth.profile.user_id, "payment_refund", "payment", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { payment_intent_id: parsed.data.paymentIntentId, amount: parsed.data.amount },
    });
    const responseBody = { data: result };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

export async function GET(
  request: Request,
  { params }: { params: { action: string } }
) {
  if (params.action !== "history") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const auth = await requireRole(request, ["admin", "manager"], "invoices");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("invoices")
    .select("invoice_id, invoice_number, payment_status, total_amount, paid_date")
    .order("issued_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load payments" }, { status: 400 });
  }

  return NextResponse.json({ data });
}
