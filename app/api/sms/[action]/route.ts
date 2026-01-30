import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { smsSendSchema } from "@/lib/validators";
import { sendSms, verifyTwilioSignature } from "@/lib/twilio";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/auth";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { logger } from "@/lib/logger";
import { getRequestContext } from "@/lib/requestId";

function smsUnavailable(error: unknown) {
  logger.error("SMS is unavailable", { error });
  return NextResponse.json({ error: "SMS is unavailable" }, { status: 503 });
}

async function resolveThreadId(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string | null,
  phoneNumber: string
) {
  let query = admin
    .from("sms_messages")
    .select("thread_id")
    .not("thread_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (customerId) {
    query = query.eq("customer_id", customerId);
  } else {
    query = query.eq("phone_number", phoneNumber);
  }

  const { data } = await query.maybeSingle();
  return data?.thread_id ?? randomUUID();
}

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const ip = getRequestIp(request);
  const action = params.action;
  if (action === "webhook") {
    const formData = await request.formData();
    const signature = request.headers.get("x-twilio-signature");
    const paramsMap: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      paramsMap[key] = value.toString();
    }
    const isValid = verifyTwilioSignature({
      signature,
      url: request.url,
      params: paramsMap,
    });
    if (!isValid) {
      logger.warn(
        "Rejected inbound SMS webhook with invalid signature",
        getRequestContext(request, { signature_present: Boolean(signature) })
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const from = paramsMap.From ?? "";
    const body = paramsMap.Body ?? "";
    const messageSid = paramsMap.MessageSid ?? "";
    const admin = createAdminClient();
    if (messageSid) {
      const { data: existing, error } = await admin
        .from("sms_messages")
        .select("sms_id")
        .eq("twilio_sid", messageSid)
        .maybeSingle();
      if (error) {
        logger.error(
          "Failed to check inbound SMS dedupe",
          getRequestContext(request, { error })
        );
      }
      if (existing) {
        return NextResponse.json({ success: true, data: { ok: true }, ok: true });
      }
    }
    const { data: customer } = await admin
      .from("customers")
      .select("customer_id, company_id")
      .eq("phone", from)
      .maybeSingle();
    const threadId = await resolveThreadId(admin, customer?.customer_id ?? null, from);
    await admin.from("sms_messages").insert({
      company_id: customer?.company_id ?? null,
      customer_id: customer?.customer_id ?? null,
      phone_number: from,
      content: body,
      direction: "inbound",
      twilio_sid: messageSid || null,
      thread_id: threadId,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, data: { ok: true }, ok: true });
  }

  const auth = await requireRole(request, ["admin", "manager", "dispatcher"], "customers");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;

  const payload = await request.json().catch(() => null);
  const parsed = smsSendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const admin = createAdminClient();
  const threadId = parsed.data.threadId
    ? parsed.data.threadId
    : await resolveThreadId(admin, parsed.data.customerId ?? null, parsed.data.to);
  const idempotency = await beginIdempotency(admin, request, profile.user_id, {
    to: parsed.data.to,
    message: parsed.data.message,
    threadId,
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
  try {
    await sendSms(parsed.data.to, parsed.data.message);
  } catch (error) {
    return smsUnavailable(error);
  }
  await admin.from("sms_messages").insert({
    company_id: profile.company_id,
    customer_id: parsed.data.customerId ?? null,
    phone_number: parsed.data.to,
    content: parsed.data.message,
    direction: "outbound",
    thread_id: threadId,
    created_at: new Date().toISOString(),
  });
  await logAudit(admin, profile.user_id, "sms_send", "sms_thread", threadId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { to: parsed.data.to },
  });
  const responseBody = { success: true, data: { ok: true }, ok: true };
  await completeIdempotency(admin, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}

export async function GET(
  request: Request,
  { params }: { params: { action: string } }
) {
  if (params.action !== "list") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const auth = await requireRole(request, ["admin", "manager", "dispatcher"], "customers");
  if ("response" in auth) {
    return auth.response;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("sms_messages")
    .select("sms_id, phone_number, content, direction, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Unable to load SMS" }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
