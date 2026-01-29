import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { invoicePaymentSchema, invoiceSendSchema } from "@/lib/validators";
import { sendInvoiceEmail } from "@/lib/resend";
import { sendSms } from "@/lib/twilio";
import { generateInvoicePdf } from "@/lib/pdf";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  const auth = await requirePermission(request, "invoices");
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const action = params.action;
  const body = await request.json().catch(() => null);
  const ip = getRequestIp(request);

  if (action === "send") {
    const parsed = invoiceSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid send request" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "send",
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

    if (parsed.data.channel === "email") {
      await sendInvoiceEmail(parsed.data.to, parsed.data.subject, parsed.data.body);
    } else {
      await sendSms(parsed.data.to, parsed.data.body);
    }

    await client
      .from("invoices")
      .update({ payment_status: "sent", email_sent_date: new Date().toISOString() })
      .eq("invoice_id", params.id);

    await logAudit(client, user.id, "invoice_send", "invoice", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { channel: parsed.data.channel },
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "payment") {
    const parsed = invoicePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "payment",
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

    await client
      .from("invoices")
      .update({
        payment_status: parsed.data.status,
        paid_amount: parsed.data.paidAmount,
        paid_date: new Date().toISOString(),
      })
      .eq("invoice_id", params.id);

    await logAudit(client, user.id, "invoice_payment_update", "invoice", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { status: parsed.data.status, paid_amount: parsed.data.paidAmount },
    });

    const responseBody = { ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "pdf") {
    const { data, error } = await client
      .from("invoices")
      .select(`
        invoice_id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        subtotal,
        gst_amount,
        qst_amount,
        notes,
        customers (
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          province,
          postal_code
        ),
        companies (
          name,
          legal_name,
          email,
          phone,
          address,
          city,
          province,
          postal_code,
          gst_number,
          qst_number
        )
      `)
      .eq("invoice_id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const pdfBytes = await generateInvoicePdf({
      invoiceNumber: data.invoice_number,
      invoiceDate: data.invoice_date || new Date().toISOString().split("T")[0],
      dueDate: data.due_date,
      totalAmount: data.total_amount ?? 0,
      subtotal: data.subtotal ?? 0,
      gst_amount: data.gst_amount,
      qst_amount: data.qst_amount,
      notes: data.notes,
      company: {
        name: (data.companies as any)?.[0]?.name || (data.companies as any)?.name || "Entretien Prestige",
        address: (data.companies as any)?.[0]?.address || (data.companies as any)?.address,
        city: (data.companies as any)?.[0]?.city || (data.companies as any)?.city,
        province: (data.companies as any)?.[0]?.province || (data.companies as any)?.province,
        postal_code: (data.companies as any)?.[0]?.postal_code || (data.companies as any)?.postal_code,
        phone: (data.companies as any)?.[0]?.phone || (data.companies as any)?.phone,
        email: (data.companies as any)?.[0]?.email || (data.companies as any)?.email,
        gst_number: (data.companies as any)?.[0]?.gst_number || (data.companies as any)?.gst_number,
        qst_number: (data.companies as any)?.[0]?.qst_number || (data.companies as any)?.qst_number,
      },
      customer: {
        name: `${(data.customers as any)?.[0]?.first_name || (data.customers as any)?.first_name || ""} ${(data.customers as any)?.[0]?.last_name || (data.customers as any)?.last_name || ""}`.trim(),
        address: (data.customers as any)?.[0]?.address || (data.customers as any)?.address,
        city: (data.customers as any)?.[0]?.city || (data.customers as any)?.city,
        province: (data.customers as any)?.[0]?.province || (data.customers as any)?.province,
        postal_code: (data.customers as any)?.[0]?.postal_code || (data.customers as any)?.postal_code,
        phone: (data.customers as any)?.[0]?.phone || (data.customers as any)?.phone,
        email: (data.customers as any)?.[0]?.email || (data.customers as any)?.email,
      },
      lineItems: [], // Line items would need to be fetched from invoice_line_items table
    });

    const body = Buffer.from(pdfBytes);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${data.invoice_number}.pdf"`,
      },
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

  const auth = await requirePermission(request, "invoices");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("invoices")
    .select(`
      invoice_id,
      invoice_number,
      invoice_date,
      due_date,
      total_amount,
      subtotal,
      gst_amount,
      qst_amount,
      notes,
      customers (
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        province,
        postal_code
      ),
      companies (
        name,
        email,
        phone,
        address,
        city,
        province,
        postal_code,
        gst_number,
        qst_number
      )
    `)
    .eq("invoice_id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber: data.invoice_number,
    invoiceDate: data.invoice_date || new Date().toISOString().split("T")[0],
    dueDate: data.due_date,
    totalAmount: data.total_amount ?? 0,
    subtotal: data.subtotal ?? 0,
    gst_amount: data.gst_amount,
    qst_amount: data.qst_amount,
    notes: data.notes,
    company: {
      name: (data.companies as any)?.[0]?.name || (data.companies as any)?.name || "Entretien Prestige",
      address: (data.companies as any)?.[0]?.address || (data.companies as any)?.address,
      city: (data.companies as any)?.[0]?.city || (data.companies as any)?.city,
      province: (data.companies as any)?.[0]?.province || (data.companies as any)?.province,
      postal_code: (data.companies as any)?.[0]?.postal_code || (data.companies as any)?.postal_code,
      phone: (data.companies as any)?.[0]?.phone || (data.companies as any)?.phone,
      email: (data.companies as any)?.[0]?.email || (data.companies as any)?.email,
      gst_number: (data.companies as any)?.[0]?.gst_number || (data.companies as any)?.gst_number,
      qst_number: (data.companies as any)?.[0]?.qst_number || (data.companies as any)?.qst_number,
    },
    customer: {
      name: `${(data.customers as any)?.[0]?.first_name || (data.customers as any)?.first_name || ""} ${(data.customers as any)?.[0]?.last_name || (data.customers as any)?.last_name || ""}`.trim(),
      address: (data.customers as any)?.[0]?.address || (data.customers as any)?.address,
      city: (data.customers as any)?.[0]?.city || (data.customers as any)?.city,
      province: (data.customers as any)?.[0]?.province || (data.customers as any)?.province,
      postal_code: (data.customers as any)?.[0]?.postal_code || (data.customers as any)?.postal_code,
      phone: (data.customers as any)?.[0]?.phone || (data.customers as any)?.phone,
      email: (data.customers as any)?.[0]?.email || (data.customers as any)?.email,
    },
    lineItems: [],
  });

  const body = Buffer.from(pdfBytes);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${data.invoice_number}.pdf"`,
    },
  });
}
