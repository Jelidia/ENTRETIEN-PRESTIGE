import { NextResponse } from "next/server";
import { emailSendSchema } from "@/lib/validators";
import { sendEmail } from "@/lib/resend";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { logger } from "@/lib/logger";
import { getRequestContext } from "@/lib/requestId";

function emailUnavailable(error: unknown, requestContext: Record<string, unknown>) {
  logger.error("Email is unavailable", { ...requestContext, error });
  return NextResponse.json({ success: false, error: "Email is unavailable" }, { status: 503 });
}

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const requestContext = getRequestContext(request, {
    action: params.action,
    ip,
    user_id: profile.user_id,
    company_id: profile.company_id,
  });
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  if (params.action !== "send") {
    return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = emailSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
  }

  const idempotency = await beginIdempotency(client, request, profile.user_id, parsed.data);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }

  try {
    await sendEmail(parsed.data.to, parsed.data.subject, parsed.data.html);
  } catch (error) {
    return emailUnavailable(error, requestContext);
  }
  await logAudit(client, profile.user_id, "email_send", "customer", null, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { to: parsed.data.to, subject: parsed.data.subject },
  });
  const responseBody = { success: true, data: { ok: true }, ok: true };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}

export async function GET(
  _request: Request,
  { params }: { params: { action: string } }
) {
  const auth = await requirePermission(_request, "customers");
  if ("response" in auth) {
    return auth.response;
  }

  if (params.action !== "template") {
    return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
  }

  const data = {
    subject: "Your invoice from Entretien Prestige",
    body: "Hello, your invoice is ready. Thank you for your business.",
  };

  return NextResponse.json({ success: true, data, ...data });
}
