import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";
import { ratingSubmitSchema } from "@/lib/validators";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

// Get Google review URL from company settings
async function getGoogleReviewUrl(companyId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("companies")
    .select("settings")
    .eq("company_id", companyId)
    .maybeSingle();

  if (!data?.settings || typeof data.settings !== "object") {
    return null;
  }

  const settings = data.settings as { google_review_url?: string | null };
  return settings.google_review_url ?? null;
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`ratings:submit:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const validation = ratingSubmitSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { token, rating_score, feedback, technician_mentioned } = validation.data;

  const admin = createAdminClient();
  const idempotency = await beginIdempotency(admin, request, null, validation.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ error: "Request already in progress" }, { status: 409 });
  }

  // Validate token
  const { data: ratingToken, error: tokenError } = await admin
    .from("customer_rating_tokens")
    .select("token_id, job_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenError || !ratingToken) {
    return NextResponse.json(
      { error: "Token invalide" },
      { status: 404 }
    );
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(ratingToken.expires_at);

  if (now > expiresAt) {
    return NextResponse.json(
      { error: "Ce lien a expiré" },
      { status: 410 }
    );
  }

  // Check if already used
  if (ratingToken.used_at) {
    return NextResponse.json(
      { error: "Ce lien a déjà été utilisé" },
      { status: 410 }
    );
  }

  // Get job details
  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("job_id, customer_id, technician_id, company_id")
    .eq("job_id", ratingToken.job_id)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Service introuvable" },
      { status: 404 }
    );
  }

  // Insert rating
  const { data: rating, error: ratingError } = await admin
    .from("customer_ratings")
    .insert({
      job_id: job.job_id,
      customer_id: job.customer_id,
      rating: rating_score,
      comment: feedback || null,
    })
    .select()
    .single();

  if (ratingError) {
    console.error("Failed to insert rating:", ratingError);
    return NextResponse.json(
      { error: "Échec de l'enregistrement de l'évaluation" },
      { status: 500 }
    );
  }

  // Mark token as used
  await admin
    .from("customer_rating_tokens")
    .update({ used_at: now.toISOString() })
    .eq("token_id", ratingToken.token_id);

  // If 4-5 stars and technician mentioned, create bonus record
  if (rating_score >= 4 && technician_mentioned && job.technician_id) {
    await admin
      .from("google_review_bonuses")
      .insert({
        technician_id: job.technician_id,
        job_id: job.job_id,
        bonus_amount: 5.0,
        google_review_text: feedback || null,
      });
  }

  await logAudit(admin, null, "rating_submit", "job", job.job_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { rating: rating_score, technician_mentioned: Boolean(technician_mentioned) },
  });

  // Get Google review URL if 4-5 stars
  let googleReviewUrl: string | null = null;
  if (rating_score >= 4) {
    googleReviewUrl = await getGoogleReviewUrl(job.company_id);
  }

  const responseBody = {
    success: true,
    rating_id: rating.rating_id,
    google_review_url: googleReviewUrl,
    data: {
      rating_id: rating.rating_id,
      google_review_url: googleReviewUrl,
    },
  };
  await completeIdempotency(admin, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
