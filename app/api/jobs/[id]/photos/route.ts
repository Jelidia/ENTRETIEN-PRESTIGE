import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { photoUploadSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

// GET /api/jobs/[id]/photos - List all photos for a job
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ["admin", "manager", "technician"], ["jobs"]);
  if ("response" in auth) return auth.response;

  const { profile } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const ip = getRequestIp(request);

  const { data: photos, error } = await client
    .from("job_photos")
    .select("photo_id, job_id, photo_type, side, photo_url, uploaded_at")
    .eq("job_id", params.id)
    .order("uploaded_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch job photos:", error, {
      jobId: params.id,
      companyId: profile.company_id,
    });
    return NextResponse.json(
      { error: "Unable to fetch photos" },
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

  const photoSet = new Set(
    photos?.map((p) => `${p.photo_type}-${p.side}`) ?? []
  );

  const missing = requiredPhotos
    .filter((req) => !photoSet.has(`${req.type}-${req.side}`))
    .map((req) => ({ photo_type: req.type, side: req.side }));

  return NextResponse.json({
    photos: photos ?? [],
    complete: missing.length === 0,
    missing,
  });
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

  // Verify job exists and user has access
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("job_id, technician_id")
    .eq("job_id", params.id)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }

  // Technicians can only upload photos for their assigned jobs
  if (profile.role === "technician" && job.technician_id !== user.id) {
    return NextResponse.json(
      { error: "You can only upload photos for your assigned jobs" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = photoUploadSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid photo data", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { photo_type, side, photo_url } = validation.data;

  const idempotency = await beginIdempotency(client, request, user.id, {
    photo_type,
    side,
    photo_url,
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
      console.error("Failed to update photo:", updateError);
      return NextResponse.json(
        { error: "Failed to update photo" },
        { status: 500 }
      );
    }

    await logAudit(client, user.id, "job_photo_update", "job", params.id, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { photo_type, side },
    });

    const responseBody = { photo: updated, updated: true };
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
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to upload photo:", error, {
      jobId: params.id,
      userId: user.id,
    });
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }

  await logAudit(client, user.id, "job_photo_create", "job", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { photo_type, side },
  });

  const responseBody = { photo, updated: false };
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

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("photo_id");

  if (!photoId) {
    return NextResponse.json(
      { error: "Missing photo_id parameter" },
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
    return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
  }

  const { error } = await client
    .from("job_photos")
    .delete()
    .eq("photo_id", photoId)
    .eq("job_id", params.id);

  if (error) {
    console.error("Failed to delete photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }

  await logAudit(client, profile.user_id, "job_photo_delete", "job", params.id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { photo_id: photoId },
  });

  const responseBody = { success: true };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
