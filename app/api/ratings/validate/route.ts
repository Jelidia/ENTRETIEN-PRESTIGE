import {
  errorResponse,
  notFound,
  ok,
  tooManyRequests,
  validationError,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabaseServer";
import { hashCode, timingSafeEqualHex } from "@/lib/crypto";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { ratingsValidateQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`ratings:validate:${ip}`, 30, 15 * 60 * 1000);
  if (!limit.allowed) {
    return tooManyRequests("Trop de tentatives. Réessayez plus tard.");
  }

  const { searchParams } = new URL(request.url);
  const queryResult = ratingsValidateQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!queryResult.success) {
    return validationError(queryResult.error, "Token manquant");
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
    return notFound("Token invalide", "token_invalid");
  }

  if (!timingSafeEqualHex(tokenHash, ratingToken.token_hash)) {
    return notFound("Token invalide", "token_invalid");
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(ratingToken.expires_at);

  if (now > expiresAt) {
    return errorResponse(410, "token_expired", "Ce lien a expiré");
  }

  // Check if already used
  if (ratingToken.used_at) {
    return errorResponse(410, "token_used", "Ce lien a déjà été utilisé");
  }

  // Get job details
  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select(`
      job_id,
      company_id,
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
    return notFound("Service introuvable", "service_not_found");
  }

  type CustomerRow = { first_name?: string | null; last_name?: string | null };
  type TechnicianRow = { full_name?: string | null };
  type JobRecord = {
    job_id: string;
    company_id?: string | null;
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
  let companyName: string | null = null;
  if (jobRecord.company_id) {
    const { data: company } = await admin
      .from("companies")
      .select("name")
      .eq("company_id", jobRecord.company_id)
      .single();
    companyName = company?.name ?? null;
  }

  const data = {
    job_id: jobRecord.job_id,
    company_name: companyName,
    customer_name: customerName,
    service_type: jobRecord.service_type ?? "Service",
    service_date: jobRecord.scheduled_date ?? "",
    technician_name: technicianName,
  };

  return ok(data, { flatten: true });
}
