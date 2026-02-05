import { NextResponse } from "next/server";
import {
  badRequest,
  conflict,
  ok,
  okBody,
  requireRole,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/auth";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { userCreateSchema } from "@/lib/validators";
import { isSmsConfigured } from "@/lib/twilio";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { logger } from "@/lib/logger";
import { getRequestContext } from "@/lib/requestId";

type DocumentFields = {
  id_document_front_url?: string;
  id_document_back_url?: string;
  contract_document_url?: string;
  contract_signature_url?: string;
};

function normalizeDocumentPath(value?: string | null) {
  if (!value) {
    return value;
  }
  const marker = "/storage/v1/object/";
  const index = value.indexOf(marker);
  if (index === -1) {
    return value;
  }
  const tail = value.slice(index + marker.length);
  const [access, bucket, ...rest] = tail.split("/");
  if ((access !== "public" && access !== "sign") || (bucket !== "documents" && bucket !== "user-documents")) {
    return value;
  }
  const path = rest.join("/").split("?")[0];
  return path || value;
}

function normalizeDocumentFields<T extends DocumentFields>(data: T) {
  return {
    ...data,
    id_document_front_url: normalizeDocumentPath(data.id_document_front_url),
    id_document_back_url: normalizeDocumentPath(data.id_document_back_url),
    contract_document_url: normalizeDocumentPath(data.contract_document_url),
    contract_signature_url: normalizeDocumentPath(data.contract_signature_url),
  };
}

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const token = getAccessTokenFromRequest(request);
  if (!token) {
    return unauthorized();
  }
  const client = createUserClient(token);
  const { data, error } = await client
    .from("users")
    .select("user_id, full_name, email, phone, role, status, created_at, access_permissions")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    logger.error(
      "Failed to load users",
      getRequestContext(request, {
        user_id: profile.user_id,
        company_id: profile.company_id,
        error,
      })
    );
    return serverError("Unable to load users", "users_load_failed");
  }

  return ok(data);
}

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"], "team");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error, "Invalid user");
  }

  const normalized = normalizeDocumentFields(parsed.data);

  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, normalized);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return conflict("idempotency_conflict", "Idempotency key conflict");
  }
  if (idempotency.action === "in_progress") {
    return conflict("idempotency_in_progress", "Request already in progress");
  }

  const admin = createAdminClient();
  const smsConfigured = isSmsConfigured();
  const isAdmin = normalized.role === "admin";
  const enableSms2fa = Boolean(isAdmin && normalized.phone && smsConfigured);
  const twoFactorMethod = enableSms2fa ? "sms" : "authenticator";
  const twoFactorEnabled = enableSms2fa;
  const { data: userData, error: authError } = await admin.auth.admin.createUser({
    email: normalized.email,
    password: normalized.password,
    email_confirm: true,
    user_metadata: { full_name: normalized.fullName, phone: normalized.phone },
  });

  if (authError || !userData.user) {
    return badRequest("auth_create_failed", authError?.message ?? "Unable to create auth user");
  }

  const { error } = await admin.from("users").insert({
    user_id: userData.user.id,
    company_id: profile.company_id,
    email: normalized.email,
    phone: normalized.phone,
    full_name: normalized.fullName,
    role: normalized.role,
    status: "active",
    two_factor_enabled: twoFactorEnabled,
    two_factor_method: twoFactorMethod,
    access_permissions: normalized.accessPermissions,
    address: normalized.address,
    city: normalized.city,
    province: normalized.province,
    postal_code: normalized.postal_code,
    country: normalized.country,
    id_document_front_url: normalized.id_document_front_url,
    id_document_back_url: normalized.id_document_back_url,
    contract_document_url: normalized.contract_document_url,
    contract_signature_url: normalized.contract_signature_url,
    contract_signed_at: normalized.contract_signed_at,
  });

  if (error) {
    return badRequest("user_profile_create_failed", error.message ?? "Unable to store user profile");
  }

  await logAudit(admin, profile.user_id, "admin_create_user", "user", userData.user.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: {
      email: normalized.email,
      full_name: normalized.fullName,
      role: normalized.role,
    },
  });

  const responseBody = { ok: true };
  const storedBody = okBody(responseBody, { flatten: true });
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 201);
  return ok(responseBody, { status: 201, flatten: true });
}
