import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { userUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);

  const body = await request.json().catch(() => null);
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid update" }, { status: 400 });
  }

  const normalized = normalizeDocumentFields(parsed.data);

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, normalized);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }
  const { data, error } = await client
    .from("users")
    .update(normalized)
    .eq("user_id", params.id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Unable to update user" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "user_update", "user", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: normalized,
  });

  const responseBody = { success: true, data };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("users")
    .select(
      "user_id, full_name, email, phone, role, status, address, city, province, postal_code, country, id_document_front_url, id_document_back_url, contract_document_url, contract_signature_url, contract_signed_at, avatar_url"
    )
    .eq("user_id", params.id)
    .eq("company_id", profile.company_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Unable to load user" }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
