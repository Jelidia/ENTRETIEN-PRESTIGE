import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { paymentInitSchema, paymentRefundSchema } from "@/lib/validators";
import { createPaymentIntent, handleStripeWebhook, refundPayment } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabaseServer";

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const action = params.action;

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
  const body = await request.json().catch(() => null);

  if (action === "init") {
    const parsed = paymentInitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
    }

    const intent = await createPaymentIntent({
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      metadata: { invoiceId: parsed.data.invoiceId },
    });
    return NextResponse.json({ data: intent });
  }

  if (action === "interac") {
    const { invoiceId, amount } = body ?? {};
    await client
      .from("invoices")
      .update({ payment_status: "paid", paid_amount: amount, paid_date: new Date().toISOString() })
      .eq("invoice_id", invoiceId);
    return NextResponse.json({ ok: true });
  }

  if (action === "refund") {
    const parsed = paymentRefundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid refund" }, { status: 400 });
    }

    const result = await refundPayment(parsed.data.paymentIntentId, parsed.data.amount);
    return NextResponse.json({ data: result });
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
