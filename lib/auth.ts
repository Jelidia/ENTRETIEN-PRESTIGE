import { NextResponse } from "next/server";
import { createUserClient } from "./supabaseServer";
import { getAccessTokenFromRequest } from "./session";

export async function requireUser(request: Request) {
  const token = getAccessTokenFromRequest(request);
  if (!token) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const client = createUserClient(token);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await client
    .from("users")
    .select("user_id, company_id, role, phone, two_factor_enabled, two_factor_method, full_name, email")
    .eq("user_id", data.user.id)
    .single();

  if (!profile) {
    return { response: NextResponse.json({ error: "Profile missing" }, { status: 403 }) };
  }

  return { user: data.user, profile };
}

export async function requireRole(request: Request, roles: string[]) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth;
  }

  if (!roles.includes(auth.profile.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return auth;
}
