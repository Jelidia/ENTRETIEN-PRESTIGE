import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";
import { portalInvoiceParamSchema } from "@/lib/validators";
import { validatePortalToken } from "@/lib/security";
import { generateInvoicePdf } from "@/lib/pdf";

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

export async function GET(
  request: Request,
  { params }: { params: { token: string; invoiceId: string } }
) {
  const parsedParams = portalInvoiceParamSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ success: false, error: "Lien invalide" }, { status: 400 });
  }

  const validation = validatePortalToken(parsedParams.data.token);
  if (!validation.ok) {
    const status = validation.reason === "expired" ? 410 : 404;
    const message = validation.reason === "expired" ? "Lien expiré" : "Lien invalide";
    return NextResponse.json({ success: false, error: message }, { status });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
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
    .eq("invoice_id", parsedParams.data.invoiceId)
    .eq("customer_id", validation.payload.customer_id)
    .eq("company_id", validation.payload.company_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Facture introuvable" }, { status: 404 });
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
      "Content-Disposition": `attachment; filename="invoice-${invoiceRecord.invoice_number}.pdf"`,
    },
  });
}
