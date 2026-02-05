import { getBaseUrl } from "@/lib/env";
import { requirePermission, notFound, ok, validationError } from "@/lib/auth";
import { createPortalToken } from "@/lib/security";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { portalLinkCreateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile, user } = auth;
  const body = await request.json().catch(() => null);
  const parsed = portalLinkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error, "Demande invalide");
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data: customer, error } = await client
    .from("customers")
    .select("customer_id, first_name, last_name, company_id")
    .eq("customer_id", parsed.data.customerId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (error || !customer) {
    return notFound("Client introuvable", "customer_not_found");
  }

  const expiresInDays = parsed.data.expiresInDays ?? 14;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const portalToken = createPortalToken({
    customer_id: customer.customer_id,
    company_id: profile.company_id,
    expires_at: expiresAt,
  });

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const link = `${baseUrl}/portal/${portalToken}`;
  const ip = getRequestIp(request);

  await logAudit(client, user.id, "customer_portal_link", "customer", customer.customer_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { expires_at: expiresAt, expires_in_days: expiresInDays },
  });

  return ok(
    {
      link,
      expires_at: expiresAt,
      customer_name: `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
    },
    { flatten: true }
  );
}
