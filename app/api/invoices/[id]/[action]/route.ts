import { NextResponse } from "next/server";
import {
  badRequest,
  conflict,
  errorBody,
  notFound,
  ok,
  okBody,
  requirePermission,
  serverError,
  serviceUnavailable,
  validationError,
} from "@/lib/auth";
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

const toOptionalString = (value?: string | null) => value ?? undefined;

const formatDate = (value?: string | null): string =>
  value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);

function emailUnavailable(error: unknown, requestContext: Record<string, unknown>) {
  logger.error("Email is unavailable", { ...requestContext, error });
  return serviceUnavailable("Email is unavailable", "email_unavailable");
}

function smsUnavailable(error: unknown, requestContext: Record<string, unknown>) {
  logger.error("SMS is unavailable", { ...requestContext, error });
  return serviceUnavailable("SMS is unavailable", "sms_unavailable");
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
      return validationError(parsed.error, "Invalid send request");
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "send",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return conflict("idempotency_conflict", "Idempotency key conflict");
    }
    if (idempotency.action === "in_progress") {
      return conflict("idempotency_in_progress", "Request already in progress");
    }

    let providerId: string | null = null;
    if (parsed.data.channel === "email") {
      try {
        const sendResult = await sendInvoiceEmail(parsed.data.to, parsed.data.subject, parsed.data.body);
        providerId = sendResult.id ?? null;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await logAudit(client, user.id, "invoice_send", "invoice", params.id, "failed", {
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") ?? null,
          newValues: { channel: parsed.data.channel, to: parsed.data.to, error: errorMessage },
        });
        const responseBody = errorBody("email_unavailable", "Email is unavailable");
        await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 503);
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
      newValues: { channel: parsed.data.channel, to: parsed.data.to, provider_id: providerId },
    });

    const responseBody = { ok: true };
    const storedBody = okBody(responseBody, { flatten: true });
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
    return ok(responseBody, { flatten: true });
  }

  if (action === "payment") {
    const parsed = invoicePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error, "Invalid payment");
    }

    const idempotency = await beginIdempotency(client, request, user.id, {
      action: "payment",
      payload: parsed.data,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return conflict("idempotency_conflict", "Idempotency key conflict");
    }
    if (idempotency.action === "in_progress") {
      return conflict("idempotency_in_progress", "Request already in progress");
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
    const storedBody = okBody(responseBody, { flatten: true });
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
    return ok(responseBody, { flatten: true });
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
      return notFound("Invoice not found", "invoice_not_found");
    }

    const invoiceRecord = data as InvoiceRecord;
    const company = pickFirst(invoiceRecord.companies);
    const customer = pickFirst(invoiceRecord.customers);
    const customerName = `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim();
    const invoiceDate = formatDate(invoiceRecord.issued_date);
    const dueDate = formatDate(invoiceRecord.due_date ?? invoiceRecord.issued_date ?? null);

    const pdfBytes = await generateInvoicePdf({
      invoiceNumber: invoiceRecord.invoice_number,
      invoiceDate,
      dueDate,
      totalAmount: invoiceRecord.total_amount ?? 0,
      subtotal: invoiceRecord.subtotal ?? 0,
      notes: toOptionalString(invoiceRecord.notes),
      company: {
        name: company?.name ?? "Entreprise",
        address: toOptionalString(company?.address),
        city: toOptionalString(company?.city),
        province: toOptionalString(company?.province),
        postal_code: toOptionalString(company?.postal_code),
        phone: toOptionalString(company?.phone),
        email: toOptionalString(company?.email),
        gst_number: toOptionalString(company?.gst_number),
        qst_number: toOptionalString(company?.qst_number),
      },
      customer: {
        name: customerName,
        address: toOptionalString(customer?.address),
        city: toOptionalString(customer?.city),
        province: toOptionalString(customer?.province),
        postal_code: toOptionalString(customer?.postal_code),
        phone: toOptionalString(customer?.phone),
        email: toOptionalString(customer?.email),
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

  return badRequest("unsupported_action", "Unsupported action");
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  if (params.action !== "pdf") {
    return badRequest("unsupported_action", "Unsupported action");
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
    return notFound("Invoice not found", "invoice_not_found");
  }

  const invoiceRecord = data as InvoiceRecord;
  const company = pickFirst(invoiceRecord.companies);
  const customer = pickFirst(invoiceRecord.customers);
  const customerName = `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim();
  const invoiceDate = formatDate(invoiceRecord.issued_date);
  const dueDate = formatDate(invoiceRecord.due_date ?? invoiceRecord.issued_date ?? null);

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber: invoiceRecord.invoice_number,
    invoiceDate,
    dueDate,
    totalAmount: invoiceRecord.total_amount ?? 0,
    subtotal: invoiceRecord.subtotal ?? 0,
    notes: toOptionalString(invoiceRecord.notes),
    company: {
      name: company?.name ?? "Entreprise",
      address: toOptionalString(company?.address),
      city: toOptionalString(company?.city),
      province: toOptionalString(company?.province),
      postal_code: toOptionalString(company?.postal_code),
      phone: toOptionalString(company?.phone),
      email: toOptionalString(company?.email),
      gst_number: toOptionalString(company?.gst_number),
      qst_number: toOptionalString(company?.qst_number),
    },
    customer: {
      name: customerName,
      address: toOptionalString(customer?.address),
      city: toOptionalString(customer?.city),
      province: toOptionalString(customer?.province),
      postal_code: toOptionalString(customer?.postal_code),
      phone: toOptionalString(customer?.phone),
      email: toOptionalString(customer?.email),
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
