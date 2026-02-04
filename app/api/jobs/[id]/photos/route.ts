import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { photoUploadSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { captureError } from "@/lib/errorTracking";
import { getRequestContext } from "@/lib/requestId";

const bucketName = "job-photos";
const maxPhotoSizeBytes = 5 * 1024 * 1024;
const signedUrlTtlSeconds = 300;

function normalizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function resolveStoragePath(value: string) {
  if (!value) {
    return "";
  }
  if (!value.startsWith("http")) {
    return value;
  }
  const marker = "/storage/v1/object/";
  const index = value.indexOf(marker);
  if (index === -1) {
    return value;
  }
  const tail = value.slice(index + marker.length);
  const [access, bucket, ...rest] = tail.split("/");
  if (bucket !== bucketName || (access !== "public" && access !== "sign")) {
    return value;
  }
  const path = rest.join("/").split("?")[0];
  return path || value;
}

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const createResult = await admin.storage.createBucket(bucketName, { public: false });
  const createError = createResult.error?.message?.toLowerCase() ?? "";
  if (createResult.error && !createError.includes("already exists")) {
    throw createResult.error;
  }
}

async function signPhotoUrl(admin: ReturnType<typeof createAdminClient>, value: string) {
  const storagePath = resolveStoragePath(value);
  if (!storagePath || storagePath.startsWith("http")) {
    return value;
  }
  const { data, error } = await admin.storage
    .from(bucketName)
    .createSignedUrl(storagePath, signedUrlTtlSeconds);
  if (error || !data?.signedUrl) {
    throw error ?? new Error("Failed to sign photo URL");
  }
  return data.signedUrl;
}

// GET /api/jobs/[id]/photos - List all photos for a job
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager", "technician"], ["jobs"]);
  if ("response" in auth) return auth.response;

  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    company_id: profile.company_id,
    job_id: params.id,
  });

  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("job_id, technician_id")
    .eq("job_id", params.id)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json({ success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  if (profile.role === "technician" && job.technician_id !== user.id) {
    return NextResponse.json({ success: false, error: "You can only view photos for your assigned jobs" },
      { status: 403 }
    );
  }

  const { data: photos, error } = await client
    .from("job_photos")
    .select("photo_id, job_id, photo_type, side, photo_url, uploaded_at")
    .eq("job_id", params.id)
    .order("uploaded_at", { ascending: true });

  if (error) {
    await captureError(error, {
      ...requestContext,
      action: "fetch_job_photos",
    });
    return NextResponse.json({ success: false, error: "Unable to fetch photos" },
      { status: 500 }
    );
  }

  // Check if all 8 photos are present
  const requiredPhotos = [
    { type: "before", side: "front" },
    { type: "before", side: "back" },
    { type: "before", side: "left" },
    { type: "before", side: "right" },
    { type: "after", side: "front" },
    { type: "after", side: "back" },
    { type: "after", side: "left" },
    { type: "after", side: "right" },
  ];

  let signedPhotos = photos ?? [];
  try {
    const admin = createAdminClient();
    signedPhotos = await Promise.all(
      (photos ?? []).map(async (photo) => ({
        ...photo,
        photo_url: await signPhotoUrl(admin, photo.photo_url),
      }))
    );
  } catch (signError) {
    await captureError(signError, {
      ...requestContext,
      action: "sign_job_photos",
    });
    return NextResponse.json({ success: false, error: "Unable to sign photo URLs" },
      { status: 500 }
    );
  }

  const photoSet = new Set(
    signedPhotos.map((p) => `${p.photo_type}-${p.side}`)
  );

  const missing = requiredPhotos
    .filter((req) => !photoSet.has(`${req.type}-${req.side}`))
    .map((req) => ({ photo_type: req.type, side: req.side }));

  const data = {
    photos: signedPhotos,
    complete: missing.length === 0,
    missing,
  };

  return NextResponse.json({ success: true, data, ...data });
}

// POST /api/jobs/[id]/photos - Upload a new photo
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager", "technician"], ["jobs"]);
  if ("response" in auth) return auth.response;

  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    user_id: user.id,
    company_id: profile.company_id,
    job_id: params.id,
  });

  // Verify job exists and user has access
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("job_id, technician_id")
    .eq("job_id", params.id)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json({ success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  // Technicians can only upload photos for their assigned jobs
  if (profile.role === "technician" && job.technician_id !== user.id) {
    return NextResponse.json({ success: false, error: "You can only upload photos for your assigned jobs" },
      { status: 403 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ success: false, error: "Invalid photo upload" },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const photoType = String(formData.get("photo_type") ?? "");
  const sideInput = String(formData.get("side") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Photo file is required" },
      { status: 400 }
    );
  }

  const validation = photoUploadSchema.safeParse({
    photo_type: photoType,
    side: sideInput,
  });

  if (!validation.success) {
    return NextResponse.json({ success: false, error: "Invalid photo data", details: validation.error.format() },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ success: false, error: "Invalid photo type" },
      { status: 400 }
    );
  }

  if (file.size > maxPhotoSizeBytes) {
    return NextResponse.json({ success: false, error: "Photo file too large" },
      { status: 400 }
    );
  }

  const { photo_type, side } = validation.data;

  const idempotency = await beginIdempotency(client, request, user.id, {
    photo_type,
    side,
    file_name: file.name,
    file_size: file.size,
  });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }

  const admin = createAdminClient();
  try {
    await ensureBucket(admin);
  } catch (bucketError) {
    await captureError(bucketError, {
      ...requestContext,
      action: "ensure_job_photo_bucket",
    });
    return NextResponse.json({ success: false, error: "Unable to prepare storage" },
      { status: 500 }
    );
  }

  const safeName = normalizeFileName(file.name || "photo");
  const storagePath = `${profile.company_id}/jobs/${params.id}/${photo_type}-${side}-${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    await captureError(uploadError, {
      ...requestContext,
      action: "upload_job_photo",
      photo_type,
      side,
    });
    return NextResponse.json({ success: false, error: "Failed to upload photo" },
      { status: 500 }
    );
  }

  const photo_url = storagePath;

  // Check if this photo already exists (prevent duplicates)
  const { data: existing } = await client
    .from("job_photos")
    .select("photo_id")
    .eq("job_id", params.id)
    .eq("photo_type", photo_type)
    .eq("side", side)
    .maybeSingle();

  if (existing) {
    // Update existing photo
    const { data: updated, error: updateError } = await client
      .from("job_photos")
      .update({
        photo_url,
        uploaded_at: new Date().toISOString(),
      })
      .eq("photo_id", existing.photo_id)
      .select()
      .single();

    if (updateError) {
      await captureError(updateError, {
        ...requestContext,
        action: "update_photo",
        photo_type,
        side,
      });
      return NextResponse.json({ success: false, error: "Failed to update photo" },
        { status: 500 }
      );
    }

    await logAudit(client, user.id, "job_photo_update", "job", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { photo_type, side },
    });

    const responseBody = { success: true, data: { photo: updated, updated: true }, photo: updated, updated: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
    return NextResponse.json(responseBody);
  }

  // Insert new photo
  const { data: photo, error } = await client
    .from("job_photos")
    .insert({
      job_id: params.id,
      uploaded_by: user.id,
      photo_type,
      side,
      photo_url,
      uploaded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    await captureError(error, {
      ...requestContext,
      action: "upload_photo",
      photo_type,
      side,
    });
    return NextResponse.json({ success: false, error: "Failed to upload photo" },
      { status: 500 }
    );
  }

  await logAudit(client, user.id, "job_photo_create", "job", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { photo_type, side },
  });

  const responseBody = { success: true, data: { photo, updated: false }, photo, updated: false };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 201);
  return NextResponse.json(responseBody, { status: 201 });
}

// DELETE /api/jobs/[id]/photos?photo_id=xxx - Delete a photo
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager"], ["jobs"]);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    user_id: profile.user_id,
    company_id: profile.company_id,
    job_id: params.id,
  });

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("photo_id");

  if (!photoId) {
    return NextResponse.json({ success: false, error: "Missing photo_id parameter" },
      { status: 400 }
    );
  }

  const idempotency = await beginIdempotency(client, request, profile.user_id, {
    action: "delete",
    photo_id: photoId,
  });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }

  const { data: photo, error: photoError } = await client
    .from("job_photos")
    .select("photo_id, photo_url")
    .eq("photo_id", photoId)
    .eq("job_id", params.id)
    .maybeSingle();

  if (photoError) {
    await captureError(photoError, {
      ...requestContext,
      action: "fetch_photo_for_delete",
      photo_id: photoId,
    });
    return NextResponse.json({ success: false, error: "Failed to delete photo" },
      { status: 500 }
    );
  }

  if (!photo) {
    return NextResponse.json({ success: false, error: "Photo not found" },
      { status: 404 }
    );
  }

  const storagePath = resolveStoragePath(photo.photo_url);
  if (storagePath && !storagePath.startsWith("http")) {
    const admin = createAdminClient();
    const { error: removeError } = await admin.storage
      .from(bucketName)
      .remove([storagePath]);
    if (removeError) {
      await captureError(removeError, {
        ...requestContext,
        action: "delete_photo_file",
        photo_id: photoId,
      });
    }
  }

  const { error } = await client
    .from("job_photos")
    .delete()
    .eq("photo_id", photoId)
    .eq("job_id", params.id);

  if (error) {
    await captureError(error, {
      ...requestContext,
      action: "delete_photo",
      photo_id: photoId,
    });
    return NextResponse.json({ success: false, error: "Failed to delete photo" },
      { status: 500 }
    );
  }

  await logAudit(client, profile.user_id, "job_photo_delete", "job", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { photo_id: photoId },
  });

  const responseBody = { success: true, data: { success: true } };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
