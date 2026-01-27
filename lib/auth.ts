import { NextResponse } from "next/server";
import { createAdminClient, createUserClient } from "./supabaseServer";
import { getAccessTokenFromRequest } from "./session";
import { resolvePermissions, type PermissionKey } from "./permissions";

async function loadPermissions(request: Request, profile: { company_id: string; role: string; access_permissions?: any }) {
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data: company } = await client
    .from("companies")
    .select("role_permissions")
    .eq("company_id", profile.company_id)
    .single();

  return resolvePermissions(profile.role, company?.role_permissions ?? null, profile.access_permissions ?? null);
}

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

  const selectFields =
    "user_id, company_id, role, phone, two_factor_enabled, two_factor_method, full_name, email, access_permissions";
  let { data: profile, error: profileError } = await client
    .from("users")
    .select(selectFields)
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profileError?.message?.includes("access_permissions")) {
    const fallback = await client
      .from("users")
      .select("user_id, company_id, role, phone, two_factor_enabled, two_factor_method, full_name, email")
      .eq("user_id", data.user.id)
      .maybeSingle();
    profile = fallback.data ?? null;
    profileError = fallback.error;
  }

  if (!profile) {
    const admin = createAdminClient();
    let { data: adminProfile, error: adminProfileError } = await admin
      .from("users")
      .select(selectFields)
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (adminProfileError?.message?.includes("access_permissions")) {
      const fallback = await admin
        .from("users")
        .select("user_id, company_id, role, phone, two_factor_enabled, two_factor_method, full_name, email")
        .eq("user_id", data.user.id)
        .maybeSingle();
      adminProfile = fallback.data ?? null;
      adminProfileError = fallback.error;
    }

    if (adminProfile) {
      return { user: data.user, profile: adminProfile };
    }

    const details = profileError?.message ?? adminProfileError?.message;
    return { response: NextResponse.json({ error: "Profile missing", details }, { status: 403 }) };
  }

  return { user: data.user, profile };
}

export async function requireRole(
  request: Request,
  roles: string[],
  permissions?: PermissionKey | PermissionKey[]
) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth;
  }

  if (!roles.includes(auth.profile.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (permissions) {
    const permissionMap = await loadPermissions(request, auth.profile);
    const needed = Array.isArray(permissions) ? permissions : [permissions];
    const allowed = needed.some((permission) => permissionMap[permission]);
    if (!allowed) {
      return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { ...auth, permissions: permissionMap };
  }

  return auth;
}

export async function requirePermission(request: Request, permissions: PermissionKey | PermissionKey[]) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth;
  }

  const permissionMap = await loadPermissions(request, auth.profile);
  const needed = Array.isArray(permissions) ? permissions : [permissions];
  const allowed = needed.some((permission) => permissionMap[permission]);
  if (!allowed) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ...auth, permissions: permissionMap };
}
