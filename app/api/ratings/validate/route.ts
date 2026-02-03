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

  type CustomerRow = { first_name?: string | null; last_name?: string | null };
  type TechnicianRow = { full_name?: string | null };
  type JobRecord = {
    job_id: string;
    service_type?: string | null;
    scheduled_date?: string | null;
    customers?: CustomerRow | CustomerRow[] | null;
    technician?: TechnicianRow | TechnicianRow[] | null;
  };

  const jobRecord = job as JobRecord;
  const getFirst = <T,>(value: T | T[] | null | undefined) =>
    Array.isArray(value) ? value[0] ?? null : value ?? null;
  const customer = getFirst(jobRecord.customers);
  const technician = getFirst(jobRecord.technician);
  const customerName = `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim();
  const technicianName = technician?.full_name ?? "Technicien";

  const data = {
    job_id: jobRecord.job_id,
    customer_name: customerName,
    service_type: jobRecord.service_type ?? "Service",
    service_date: jobRecord.scheduled_date ?? "",
    technician_name: technicianName,
  };

  return NextResponse.json({ success: true, data, ...data });
}
