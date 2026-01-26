import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { resolvePermissions } from "@/lib/permissions";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  const { data: company } = await client
    .from("companies")
    .select("role_permissions")
    .eq("company_id", profile.company_id)
    .single();

  const permissions = resolvePermissions(
    profile.role,
    company?.role_permissions ?? null,
    profile.access_permissions ?? null
  );

  return NextResponse.json({
    permissions,
    rolePermissions: company?.role_permissions ?? {},
    userPermissions: profile.access_permissions ?? {},
    role: profile.role,
  });
}
