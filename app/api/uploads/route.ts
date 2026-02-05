import { NextResponse } from "next/server";
import {
  badRequest,
  conflict,
  ok,
  okBody,
  requireRole,
  serverError,
  validationError,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabaseServer";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { uploadsFormSchema } from "@/lib/validators";

const bucketName = "documents";
const docTypeMap: Record<string, string> = {
  id_front: "id_document_front_url",
  id_back: "id_document_back_url",
  contract: "contract_document_url",
  signature: "contract_signature_url",
};

function normalizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], "team");
  if ("response" in auth) {
    return auth.response;
  }
  const ip = getRequestIp(request);

  const formData = await request.formData();
  const userId = String(formData.get("userId") ?? "");
  const docType = String(formData.get("docType") ?? "");
  const file = formData.get("file");

  const formResult = uploadsFormSchema.safeParse({ userId, docType });
  if (!formResult.success) {
    return validationError(formResult.error, "Invalid upload request");
  }
  if (!(file instanceof File)) {
    return badRequest("file_missing", "Invalid upload request");
  }

  const { userId: safeUserId, docType: safeDocType } = formResult.data;
  const column = docTypeMap[safeDocType];

  const admin = createAdminClient();
  const idempotency = await beginIdempotency(admin, request, auth.profile.user_id, {
    userId: safeUserId,
    docType: safeDocType,
    fileName: file.name,
  });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return conflict("idempotency_conflict", "Idempotency key conflict");
  }
  if (idempotency.action === "in_progress") {
    return conflict("idempotency_in_progress", "Request already in progress");
  }
  const createResult = await admin.storage.createBucket(bucketName, { public: false });
  const createError = createResult.error?.message?.toLowerCase() ?? "";
  if (createResult.error && !createError.includes("already exists")) {
    return serverError("Unable to prepare storage", "storage_prepare_failed");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = normalizeFileName(file.name || "document");
  const storagePath = `${auth.profile.company_id}/${safeUserId}/${safeDocType}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await admin.storage
    .from(bucketName)
    .upload(storagePath, buffer, { contentType: file.type || "application/octet-stream", upsert: true });

  if (uploadError) {
    return serverError("Unable to upload file", "upload_failed");
  }

  const updates: Record<string, string> = { [column]: storagePath };
  if (safeDocType === "signature") {
    updates.contract_signed_at = new Date().toISOString();
  }

  const { error: updateError } = await admin
    .from("users")
    .update(updates)
    .eq("user_id", safeUserId)
    .eq("company_id", auth.profile.company_id);

  if (updateError) {
    return serverError("Unable to update user", "user_update_failed");
  }

  await logAudit(admin, auth.profile.user_id, "document_upload", "user", safeUserId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { doc_type: safeDocType, path: storagePath },
  });

  const responseBody = { ok: true, path: storagePath, field: column };
  const storedBody = okBody(responseBody, { flatten: true });
  await completeIdempotency(
    admin,
    request,
    idempotency.scope,
    idempotency.requestHash,
    storedBody,
    200
  );
  return ok(responseBody, { flatten: true });
}
