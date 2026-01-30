import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { settingsUploadQuerySchema } from "@/lib/validators";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

// POST /api/settings/upload?type=contract|id_photo|profile_photo
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
    return NextResponse.json(
      { error: "Invalid type. Must be: contract, id_photo, or profile_photo" },
      { status: 400 }
    );
  }
  const { type } = queryResult.data;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 5MB)" },
        { status: 400 }
      );
    }

    // Validate file type
    if (type === "contract") {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Format non supporté. PDF uniquement." },
          { status: 400 }
        );
      }
    } else {
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        return NextResponse.json(
          { error: "Format non supporté. JPG ou PNG uniquement." },
          { status: 400 }
        );
      }
    }

    const client = createUserClient(getAccessTokenFromRequest(request) ?? "");
    const idempotency = await beginIdempotency(client, request, profile.user_id, {
      type,
      fileName: file.name,
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

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${profile.user_id}/${type}/${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await client.storage
      .from("user-documents")
      .upload(filename, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      await captureError(uploadError, {
        ...requestContext,
        action: "upload_document",
        document_type: type,
      });
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from("user-documents")
      .getPublicUrl(filename);

    const fileUrl = urlData.publicUrl;

    // Update user record with file URL
    const updateData: Record<string, unknown> = {};
    if (type === "contract") {
      updateData.contract_document_url = fileUrl;
    } else if (type === "id_photo") {
      updateData.id_document_front_url = fileUrl;
    } else if (type === "profile_photo") {
      updateData.avatar_url = fileUrl;
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
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    await logAudit(client, profile.user_id, "document_upload", "user", profile.user_id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { type },
    });

    const responseBody = {
      success: true,
      data: {
        url: fileUrl,
      },
    };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  } catch (err) {
    await captureError(err, {
      ...requestContext,
      action: "upload_document",
      document_type: type,
    });
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
