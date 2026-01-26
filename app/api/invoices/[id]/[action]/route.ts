import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient, createAdminClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { invoicePaymentSchema, invoiceSendSchema } from "@/lib/validators";
import { sendInvoiceEmail } from "@/lib/resend";
import { sendSms } from "@/lib/twilio";
import { generateInvoicePdf } from "@/lib/pdf";

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const admin = createAdminClient();
  const action = params.action;
  const body = await request.json().catch(() => null);

  if (action === "send") {
    const parsed = invoiceSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid send request" }, { status: 400 });
    }

    if (parsed.data.channel === "email") {
      await sendInvoiceEmail(parsed.data.to, parsed.data.subject, parsed.data.body);
    } else {
      await sendSms(parsed.data.to, parsed.data.body);
    }

    await admin
      .from("invoices")
      .update({ payment_status: "sent", email_sent_date: new Date().toISOString() })
      .eq("invoice_id", params.id);

    return NextResponse.json({ ok: true });
  }

  if (action === "payment") {
    const parsed = invoicePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
    }

    await client
      .from("invoices")
      .update({
        payment_status: parsed.data.status,
        paid_amount: parsed.data.paidAmount,
        paid_date: new Date().toISOString(),
      })
      .eq("invoice_id", params.id);

    return NextResponse.json({ ok: true });
  }

  if (action === "pdf") {
    const { data, error } = await client
      .from("invoices")
      .select("invoice_number, total_amount, due_date")
      .eq("invoice_id", params.id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const pdfBytes = await generateInvoicePdf({
      invoiceNumber: data.invoice_number,
      totalAmount: data.total_amount ?? 0,
      dueDate: data.due_date,
    });

    return new NextResponse(pdfBytes, {
      headers: { "Content-Type": "application/pdf" },
    });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  if (params.action !== "pdf") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("invoices")
    .select("invoice_number, total_amount, due_date")
    .eq("invoice_id", params.id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber: data.invoice_number,
    totalAmount: Number(data.total_amount ?? 0),
    dueDate: data.due_date,
  });

  return new NextResponse(pdfBytes, {
    headers: { "Content-Type": "application/pdf" },
  });
}
