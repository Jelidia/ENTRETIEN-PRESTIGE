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
import { logger } from "@/lib/logger";
import { getRequestContext } from "@/lib/requestId";

type InvoiceCompany = {
  name?: string | null;
  legal_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  gst_number?: string | null;
  qst_number?: string | null;
};

type InvoiceCustomer = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
};

type InvoiceRecord = {
  invoice_id: string;
  invoice_number: string;
  issued_date?: string | null;
  due_date?: string | null;
  total_amount?: number | null;
  subtotal?: number | null;
  notes?: string | null;
  companies?: InvoiceCompany | InvoiceCompany[] | null;
  customers?: InvoiceCustomer | InvoiceCustomer[] | null;
};

const pickFirst = <T,>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

function emailUnavailable(error: unknown, requestContext: Record<string, unknown>) {
  logger.error("Email is unavailable", { ...requestContext, error });
  return NextResponse.json({ success: false, error: "Email is unavailable" }, { status: 503 });
}

function smsUnavailable(error: unknown, requestContext: Record<string, unknown>) {
  logger.error("SMS is unavailable", { ...requestContext, error });
  return NextResponse.json({ success: false, error: "SMS is unavailable" }, { status: 503 });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  const auth = await requirePermission(request, "invoices");
  if ("response" in auth) {
    return auth.response;
  }
  const { user, profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const action = params.action;
  const body = await request.json().catch(() => null);
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    action,
    invoice_id: params.id,
    ip,
    user_id: user.id,
    company_id: profile.company_id,
  });

  if (action === "send") {
    const parsed = invoiceSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid send request" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "send",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
    }

    if (parsed.data.channel === "email") {
      try {
        await sendInvoiceEmail(parsed.data.to, parsed.data.subject, parsed.data.body);
      } catch (error) {
        return emailUnavailable(error, requestContext);
      }
    } else {
      try {
        await sendSms(parsed.data.to, parsed.data.body);
      } catch (error) {
        return smsUnavailable(error, requestContext);
      }
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

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "payment") {
    const parsed = invoicePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payment" }, { status: 400 });
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "payment",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
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

    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  if (action === "pdf") {
    const { data, error } = await client
      .from("invoices")
      .select(`
        invoice_id,
        invoice_number,
        issued_date,
        due_date,
        total_amount,
        subtotal,
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
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const invoiceRecord = data as InvoiceRecord;
    const company = pickFirst(invoiceRecord.companies);
    const customer = pickFirst(invoiceRecord.customers);
    const customerName = `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim();

    const pdfBytes = await generateInvoicePdf({
      invoiceNumber: invoiceRecord.invoice_number,
      invoiceDate: invoiceRecord.issued_date
        ? invoiceRecord.issued_date.split("T")[0]
        : new Date().toISOString().split("T")[0],
      dueDate: invoiceRecord.due_date,
      totalAmount: invoiceRecord.total_amount ?? 0,
      subtotal: invoiceRecord.subtotal ?? 0,
      notes: invoiceRecord.notes,
      company: {
        name: company?.name ?? "Entretien Prestige",
        address: company?.address,
        city: company?.city,
        province: company?.province,
        postal_code: company?.postal_code,
        phone: company?.phone,
        email: company?.email,
        gst_number: company?.gst_number,
        qst_number: company?.qst_number,
      },
      customer: {
        name: customerName,
        address: customer?.address,
        city: customer?.city,
        province: customer?.province,
        postal_code: customer?.postal_code,
        phone: customer?.phone,
        email: customer?.email,
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

  return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  if (params.action !== "pdf") {
    return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
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
      issued_date,
      due_date,
      total_amount,
      subtotal,
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
    return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
  }

  const invoiceRecord = data as InvoiceRecord;
  const company = pickFirst(invoiceRecord.companies);
  const customer = pickFirst(invoiceRecord.customers);
  const customerName = `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim();

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber: invoiceRecord.invoice_number,
    invoiceDate: invoiceRecord.issued_date
      ? invoiceRecord.issued_date.split("T")[0]
      : new Date().toISOString().split("T")[0],
    dueDate: invoiceRecord.due_date,
    totalAmount: invoiceRecord.total_amount ?? 0,
    subtotal: invoiceRecord.subtotal ?? 0,
    notes: invoiceRecord.notes,
    company: {
      name: company?.name ?? "Entretien Prestige",
      address: company?.address,
      city: company?.city,
      province: company?.province,
      postal_code: company?.postal_code,
      phone: company?.phone,
      email: company?.email,
      gst_number: company?.gst_number,
      qst_number: company?.qst_number,
    },
    customer: {
      name: customerName,
      address: customer?.address,
      city: customer?.city,
      province: customer?.province,
      postal_code: customer?.postal_code,
      phone: customer?.phone,
      email: customer?.email,
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
