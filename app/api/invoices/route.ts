import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { invoiceCreateSchema } from "@/lib/validators";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireUser(request);
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
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const body = await request.json().catch(() => null);
  const parsed = invoiceCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
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

  return NextResponse.json({ data }, { status: 201 });
}
