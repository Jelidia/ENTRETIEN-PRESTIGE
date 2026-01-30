import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { settingsDocumentQuerySchema } from "@/lib/validators";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

const bucketName = "user-documents";
const docFieldMap = {
  id_photo: "id_document_front_url",
  profile_photo: "avatar_url",
  contract: "contract_document_url",
} as const;

function resolveStoragePath(value: string) {
  const marker = `/storage/v1/object/public/${bucketName}/`;
  if (value.startsWith("http") && value.includes(marker)) {
    return value.slice(value.indexOf(marker) + marker.length);
  }
  return value;
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const { searchParams } = new URL(request.url);
  const queryResult = settingsDocumentQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Invalid type. Must be: contract, id_photo, or profile_photo" },
      { status: 400 }
    );
  }

  const field = docFieldMap[queryResult.data.type];
  const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
  const { data: user, error } = await client
    .from("users")
    .select(field)
    .eq("user_id", profile.user_id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const rawPath = user[field as keyof typeof user] as string | null;
  if (!rawPath) {
    return NextResponse.json({ error: "Document missing" }, { status: 404 });
  }

  const admin = createAdminClient();
  const storagePath = resolveStoragePath(rawPath);
  const { data: signed, error: signError } = await admin.storage
    .from(bucketName)
    .createSignedUrl(storagePath, 300);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Unable to sign document" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { url: signed.signedUrl }, url: signed.signedUrl });
}

// DELETE /api/settings/document?type=contract|id_photo|profile_photo
export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    user_id: profile.user_id,
    company_id: profile.company_id,
  });
  const { searchParams } = new URL(request.url);
  const queryResult = settingsDocumentQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Invalid type. Must be: contract, id_photo, or profile_photo" },
      { status: 400 }
    );
  }
  const { type } = queryResult.data;

  try {
    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      action: "delete",
      type,
    });
    if (idempotency.action === "replay") {
      return NextResponse.json(idempotency.body, { status: idempotency.status });
    }
    if (idempotency.action === "conflict") {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (idempotency.action === "in_progress") {
      return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
    }

    // Get current file URL
    const field = docFieldMap[type];
    const { data: user } = await client
      .from("users")
      .select(field)
      .eq("user_id", profile.user_id)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const fileUrl = user[field as keyof typeof user] as string | null;

    if (fileUrl) {
      const storagePath = resolveStoragePath(fileUrl);
      const admin = createAdminClient();
      await admin.storage.from(bucketName).remove([storagePath]);
    }

    // Update user record to remove URL
    const updateData: Record<string, null> = {};
    if (type === "id_photo") {
      updateData.id_document_front_url = null;
    } else if (type === "contract") {
      updateData.contract_document_url = null;
      updateData.contract_signed_at = null;
    } else {
      updateData.avatar_url = null;
    }

    const { error: updateError } = await client
      .from("users")
      .update(updateData)
      .eq("user_id", profile.user_id);

    if (updateError) {
      await captureError(updateError, {
        ...requestContext,
        action: "update_user_document",
        document_type: type,
      });
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    await logAudit(client, profile.user_id, "document_delete", "user", profile.user_id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { type },
    });

    const responseBody = {
      success: true,
      message: "Document deleted",
      data: { message: "Document deleted" },
    };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  } catch (err) {
    await captureError(err, {
      ...requestContext,
      action: "delete_document",
      document_type: type,
    });
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
