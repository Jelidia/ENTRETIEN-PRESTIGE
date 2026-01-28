import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token manquant" },
      { status: 400 }
    );
  }

  const client = createAnonClient();

  // Find the rating token
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
    .select(`
      job_id,
      service_type,
      scheduled_date,
      customer_id,
      assigned_technician_id,
      customers!inner(first_name, last_name),
      technician:users!assigned_technician_id(full_name)
    `)
    .eq("job_id", ratingToken.job_id)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Service introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    job_id: job.job_id,
    customer_name: `${(job.customers as any)?.[0]?.first_name || (job.customers as any)?.first_name || ""} ${(job.customers as any)?.[0]?.last_name || (job.customers as any)?.last_name || ""}`.trim(),
    service_type: job.service_type ?? "Service",
    service_date: job.scheduled_date ?? "",
    technician_name: (job.technician as any)?.[0]?.full_name || (job.technician as any)?.full_name || "Technicien",
  });
}
