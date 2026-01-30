import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";
import { hashCode, timingSafeEqualHex } from "@/lib/crypto";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { ratingsValidateQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`ratings:validate:${ip}`, 30, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const queryResult = ratingsValidateQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Token manquant" },
      { status: 400 }
    );
  }
  const { token } = queryResult.data;
  const tokenHash = hashCode(token);

  const admin = createAdminClient();

  // Find the rating token
  const { data: ratingToken, error: tokenError } = await admin
    .from("customer_rating_tokens")
    .select("token_id, job_id, expires_at, used_at, token_hash")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenError || !ratingToken) {
    return NextResponse.json(
      { error: "Token invalide" },
      { status: 404 }
    );
  }

  if (!timingSafeEqualHex(tokenHash, ratingToken.token_hash)) {
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
    .select(`
      job_id,
      service_type,
      scheduled_date,
      customer_id,
      technician_id,
      customers!inner(first_name, last_name),
      technician:users!jobs_technician_id_fkey(full_name)
    `)
    .eq("job_id", ratingToken.job_id)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Service introuvable" },
      { status: 404 }
    );
  }

  const data = {
    job_id: job.job_id,
    customer_name: `${(job.customers as any)?.[0]?.first_name || (job.customers as any)?.first_name || ""} ${(job.customers as any)?.[0]?.last_name || (job.customers as any)?.last_name || ""}`.trim(),
    service_type: job.service_type ?? "Service",
    service_date: job.scheduled_date ?? "",
    technician_name: (job.technician as any)?.[0]?.full_name || (job.technician as any)?.full_name || "Technicien",
  };

  return NextResponse.json({ success: true, data, ...data });
}
