import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { userUpdateSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("users")
    .update(parsed.data)
    .eq("user_id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update user" }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("users")
    .select(
      "user_id, full_name, email, phone, role, status, address, city, province, postal_code, country, id_document_front_url, id_document_back_url, contract_document_url, contract_signature_url, contract_signed_at"
    )
    .eq("user_id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to load user" }, { status: 400 });
  }

  return NextResponse.json({ data });
}
