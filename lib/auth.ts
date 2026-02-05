import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { createAdminClient, createUserClient } from "./supabaseServer";
import { getAccessTokenFromRequest } from "./session";
import { resolvePermissions, type PermissionKey, type PermissionMap } from "./permissions";

async function loadPermissions(
  request: Request,
  profile: { company_id: string; role: string; access_permissions?: Partial<PermissionMap> | null }
) {
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
    return {
      response: unauthorized(),
    };
  }

  const client = createUserClient(token);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return {
      response: unauthorized(),
    };
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
    profile = fallback.data ? ({ ...fallback.data, access_permissions: null } as typeof profile) : null;
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
      adminProfile = fallback.data ? ({ ...fallback.data, access_permissions: null } as typeof adminProfile) : null;
      adminProfileError = fallback.error;
    }

    if (adminProfile) {
      return { user: data.user, profile: adminProfile };
    }

    const details = profileError?.message ?? adminProfileError?.message;
    return {
      response: forbidden("Profile missing", "profile_missing", {
        reason: details ?? "unknown",
      }),
    };
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
    return {
      response: forbidden(),
    };
  }

  if (permissions) {
    const permissionMap = await loadPermissions(request, auth.profile);
    const needed = Array.isArray(permissions) ? permissions : [permissions];
    const allowed = needed.some((permission) => permissionMap[permission]);
    if (!allowed) {
      return {
        response: forbidden(),
      };
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
    return {
      response: forbidden(),
    };
  }

  return { ...auth, permissions: permissionMap };
}

type OkOptions = {
  status?: number;
  flatten?: boolean;
  extra?: Record<string, unknown>;
};

type ErrorOptions = {
  details?: Record<string, unknown>;
  fields?: Record<string, string[]>;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
  fields?: Record<string, string[]>;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function okBody<T>(data: T, options?: OkOptions): ApiSuccess<T> & Record<string, unknown> {
  const body: ApiSuccess<T> & Record<string, unknown> = { success: true, data };
  if (options?.extra) {
    Object.assign(body, options.extra);
  }
  if (options?.flatten && data && typeof data === "object" && !Array.isArray(data)) {
    Object.assign(body, data as Record<string, unknown>);
  }
  return body;
}

export function ok<T>(data: T, options?: OkOptions) {
  const status = options?.status ?? 200;
  return NextResponse.json(okBody(data, options), { status });
}

export function errorBody(code: string, message: string, options?: ErrorOptions): ApiError {
  const body: ApiError = { success: false, error: message, code };
  if (options?.details) {
    body.details = options.details;
  }
  if (options?.fields) {
    body.fields = options.fields;
  }
  return body;
}

export function errorResponse(status: number, code: string, message: string, options?: ErrorOptions) {
  return NextResponse.json(errorBody(code, message, options), { status });
}

export function badRequest(code: string, message: string, details?: Record<string, unknown>) {
  return errorResponse(400, code, message, details ? { details } : undefined);
}

export function unauthorized(message = "Unauthorized") {
  return errorResponse(401, "unauthorized", message);
}

export function forbidden(
  message = "Forbidden",
  code = "forbidden",
  details?: Record<string, unknown>
) {
  return errorResponse(403, code, message, details ? { details } : undefined);
}

export function notFound(message = "Not found", code = "not_found") {
  return errorResponse(404, code, message);
}

export function conflict(code: string, message: string, details?: Record<string, unknown>) {
  return errorResponse(409, code, message, details ? { details } : undefined);
}

export function tooManyRequests(message = "Too many requests") {
  return errorResponse(429, "rate_limited", message);
}

export function serviceUnavailable(message = "Service unavailable", code = "service_unavailable") {
  return errorResponse(503, code, message);
}

export function serverError(
  message = "Internal server error",
  code = "server_error",
  details?: Record<string, unknown>
) {
  return errorResponse(500, code, message, details ? { details } : undefined);
}

export function validationError(error: ZodError, message = "Invalid request") {
  return errorResponse(400, "validation_error", message, { fields: mapZodErrors(error) });
}

function mapZodErrors(error: ZodError) {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.length ? issue.path.join(".") : "root";
    if (!fields[path]) {
      fields[path] = [];
    }
    fields[path].push(issue.message);
  }
  return fields;
}
