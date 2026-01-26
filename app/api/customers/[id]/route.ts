import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { customerUpdateSchema } from "@/lib/validators";
import { requireUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client.from("customers").select("*").eq("customer_id", params.id).single();
  if (error || !data) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const body = await request.json().catch(() => null);
  const parsed = customerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("customers")
    .update(parsed.data)
    .eq("customer_id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update customer" }, { status: 400 });
  }

  return NextResponse.json({ data });
}
