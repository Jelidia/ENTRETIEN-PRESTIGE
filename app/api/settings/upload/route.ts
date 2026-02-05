import { NextResponse } from "next/server";
import {
  badRequest,
  conflict,
  ok,
  okBody,
  requireUser,
  serverError,
  validationError,
} from "@/lib/auth";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { settingsUploadQuerySchema } from "@/lib/validators";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

// POST /api/settings/upload?type=contract|id_photo|profile_photo
const bucketName = "user-documents";

function normalizeStoragePath(raw: string) {
  const marker = `/storage/v1/object/public/${bucketName}/`;
  if (raw.includes(marker)) {
    return raw.slice(raw.indexOf(marker) + marker.length);
  }
  return raw;
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    user_id: profile.user_id,
    company_id: profile.company_id,
  });
  const { searchParams } = new URL(request.url);
  const queryResult = settingsUploadQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryResult.success) {
    return validationError(
      queryResult.error,
      "Invalid type. Must be: contract, id_photo, or profile_photo"
    );
  }
  const { type } = queryResult.data;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return badRequest("file_missing", "No file provided");
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return badRequest("file_too_large", "Fichier trop volumineux (max 5MB)");
    }

    // Validate file type
    if (type === "contract") {
      if (file.type !== "application/pdf") {
        return badRequest("file_invalid_type", "Format non supporté. PDF uniquement.");
      }
    } else {
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        return badRequest("file_invalid_type", "Format non supporté. JPG ou PNG uniquement.");
      }
    }

    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
    const admin = createAdminClient();
    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      type,
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

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${profile.user_id}/${type}/${timestamp}.${extension}`;
    const storagePath = normalizeStoragePath(filename);

    const createResult = await admin.storage.createBucket(bucketName, { public: false });
    const createError = createResult.error?.message?.toLowerCase() ?? "";
    if (createResult.error && !createError.includes("already exists")) {
      return serverError("Unable to prepare storage", "storage_prepare_failed");
    }

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      await captureError(uploadError, {
        ...requestContext,
        action: "upload_document",
        document_type: type,
      });
      return serverError("Failed to upload file", "document_upload_failed");
    }

    const { data: signed, error: signError } = await admin.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 300);

    if (signError || !signed?.signedUrl) {
      return serverError("Failed to sign document", "document_sign_failed");
    }

    // Update user record with file URL
    const updateData: Record<string, unknown> = {};
    if (type === "contract") {
      updateData.contract_document_url = storagePath;
    } else if (type === "id_photo") {
      updateData.id_document_front_url = storagePath;
    } else if (type === "profile_photo") {
      updateData.avatar_url = storagePath;
    }

    const { error: updateError } = await client
      .from("users")
      .update(updateData)
      .eq("user_id", profile.user_id);

    if (updateError) {
      await captureError(updateError, {
        ...requestContext,
        action: "update_document_reference",
        document_type: type,
      });
      return serverError("Failed to update profile", "document_reference_update_failed");
    }

    await logAudit(client, profile.user_id, "document_upload", "user", profile.user_id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { type },
    });

    const responseBody = { url: signed.signedUrl, path: storagePath };
    const storedBody = okBody(responseBody, { flatten: true });
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, storedBody, 200);
    return ok(responseBody, { flatten: true });
  } catch (err) {
    await captureError(err, {
      ...requestContext,
      action: "upload_document",
      document_type: type,
    });
    return serverError("An error occurred", "document_upload_failed");
  }
}
