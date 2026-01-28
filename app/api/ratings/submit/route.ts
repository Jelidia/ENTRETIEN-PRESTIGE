import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabaseServer";
import { z } from "zod";

const ratingSubmitSchema = z.object({
  token: z.string().min(1),
  rating_score: z.number().int().min(1).max(5),
  feedback: z.string().nullable().optional(),
  technician_mentioned: z.boolean().optional(),
});

// Get Google review URL from company settings
async function getGoogleReviewUrl(companyId: string): Promise<string | null> {
  const client = createAnonClient();
  const { data } = await client
    .from("companies")
    .select("google_review_url")
    .eq("company_id", companyId)
    .maybeSingle();

  return data?.google_review_url ?? null;
}

export async function POST(request: Request) {
  const body = await request.json();
  const validation = ratingSubmitSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { token, rating_score, feedback, technician_mentioned } = validation.data;

  const client = createAnonClient();

  // Validate token
  const { data: ratingToken, error: tokenError } = await client
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
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("job_id, customer_id, assigned_technician_id, company_id")
    .eq("job_id", ratingToken.job_id)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Service introuvable" },
      { status: 404 }
    );
  }

  // Insert rating
  const { data: rating, error: ratingError } = await client
    .from("customer_ratings")
    .insert({
      job_id: job.job_id,
      customer_id: job.customer_id,
      technician_id: job.assigned_technician_id,
      company_id: job.company_id,
      rating_score,
      feedback: feedback || null,
      rating_source: "sms_link",
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
  await client
    .from("customer_rating_tokens")
    .update({ used_at: now.toISOString() })
    .eq("token_id", ratingToken.token_id);

  // If 4-5 stars and technician mentioned, create bonus record
  if (rating_score >= 4 && technician_mentioned && job.assigned_technician_id) {
    await client
      .from("google_review_bonuses")
      .insert({
        company_id: job.company_id,
        technician_id: job.assigned_technician_id,
        rating_id: rating.rating_id,
        bonus_amount: 5.0,
        status: "pending",
      });
  }

  // Get Google review URL if 4-5 stars
  let googleReviewUrl: string | null = null;
  if (rating_score >= 4) {
    googleReviewUrl = await getGoogleReviewUrl(job.company_id);
  }

  return NextResponse.json({
    success: true,
    rating_id: rating.rating_id,
    google_review_url: googleReviewUrl,
  });
}
