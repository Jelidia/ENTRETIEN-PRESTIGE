import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { invoiceUpdateSchema } from "@/lib/validators";
import { requirePermission } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "invoices");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client.from("invoices").select("*").eq("invoice_id", params.id).single();
  if (error || !data) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, "invoices");
  if ("response" in auth) {
    return auth.response;
  }
  const body = await request.json().catch(() => null);
  const parsed = invoiceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("invoices")
    .update(parsed.data)
    .eq("invoice_id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update invoice" }, { status: 400 });
  }

  return NextResponse.json({ data });
}
