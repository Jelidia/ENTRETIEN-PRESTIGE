import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { customerCreateSchema } from "@/lib/validators";
import { requirePermission } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("customers")
    .select("customer_id, first_name, last_name, status, customer_type, last_service_date, account_balance")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Unable to load customers" }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const body = await request.json().catch(() => null);
  const parsed = customerCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid customer" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("customers")
    .insert({
      company_id: profile.company_id,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      customer_type: parsed.data.type,
      address: parsed.data.address,
      city: parsed.data.city,
      postal_code: parsed.data.postalCode,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create customer" }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
