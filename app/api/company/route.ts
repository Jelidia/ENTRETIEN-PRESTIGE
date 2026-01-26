import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { companyUpdateSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("companies")
    .select("*")
    .eq("company_id", profile.company_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const body = await request.json().catch(() => null);
  const parsed = companyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const update = { ...parsed.data } as Record<string, unknown>;
  if (parsed.data.rolePermissions !== undefined) {
    update.role_permissions = parsed.data.rolePermissions;
    delete update.rolePermissions;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("companies")
    .update(update)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update company" }, { status: 400 });
  }

  return NextResponse.json({ data });
}
