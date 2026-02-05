import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { smsSendSchema } from "@/lib/validators";
import { sendSms, verifyTwilioSignature } from "@/lib/twilio";
import { applySmsPrefix, normalizePhoneE164 } from "@/lib/smsTemplates";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/auth";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { logger } from "@/lib/logger";
import { getRequestContext } from "@/lib/requestId";

function smsUnavailable(error: unknown, requestContext: Record<string, unknown>) {
  logger.error("SMS is unavailable", { ...requestContext, error });
  return NextResponse.json({ success: false, error: "SMS is unavailable" }, { status: 503 });
}

const optOutKeywords = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const optInKeywords = new Set(["START", "YES", "UNSTOP"]);

function getOptAction(message: string) {
  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }
  const keyword = trimmed.split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, "");
  if (optOutKeywords.has(keyword)) {
    return "opt_out";
  }
  if (optInKeywords.has(keyword)) {
    return "opt_in";
  }
  return null;
}

function normalizePhoneNumber(phone: string) {
  return normalizePhoneE164(phone) ?? phone;
}

async function resolveThreadId(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string | null,
  phoneNumber: string,
  companyId?: string | null
) {
  let query = admin
    .from("sms_messages")
    .select("thread_id")
    .not("thread_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  if (customerId) {
    query = query.eq("customer_id", customerId);
  } else {
    query = query.eq("phone_number", phoneNumber);
  }

  const { data } = await query.maybeSingle();
  return data?.thread_id ?? randomUUID();
}

async function resolveThreadAssignee(
  admin: ReturnType<typeof createAdminClient>,
  threadId: string,
  companyId: string
) {
  const { data } = await admin
    .from("sms_messages")
    .select("assigned_to")
    .eq("thread_id", threadId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.assigned_to ?? null;
}

async function assignThreadToUser(
  admin: ReturnType<typeof createAdminClient>,
  threadId: string,
  companyId: string,
  userId: string
) {
  return admin
    .from("sms_messages")
    .update({ assigned_to: userId })
    .eq("thread_id", threadId)
    .eq("company_id", companyId)
    .is("assigned_to", null);
}

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const ip = getRequestIp(request);
  const action = params.action;
  const baseRequestContext = getRequestContext(request, { action, ip });
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
        { ...baseRequestContext, signature_present: Boolean(signature) }
      );
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const from = paramsMap.From ?? "";
    const phoneNumber = normalizePhoneNumber(from);
    const body = paramsMap.Body ?? "";
    const optAction = getOptAction(body);
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
          { ...baseRequestContext, error }
        );
      }
      if (existing) {
        return NextResponse.json({ success: true, data: { ok: true }, ok: true });
      }
    }
    const { data: customers, error: customerError } = await admin
      .from("customers")
      .select("customer_id, company_id")
      .eq("phone", phoneNumber)
      .limit(1);
    if (customerError) {
      logger.error("Failed to map inbound SMS to customer", {
        ...baseRequestContext,
        error: customerError,
        phone_number: phoneNumber,
      });
    }
    const customer = customers?.[0] ?? null;
    let companyId = customer?.company_id ?? null;
    let customerId = customer?.customer_id ?? null;
    if (!companyId && phoneNumber) {
      const phoneCandidates = Array.from(new Set([phoneNumber, from].filter(Boolean)));
      let messageQuery = admin
        .from("sms_messages")
        .select("company_id, customer_id")
        .order("created_at", { ascending: false })
        .limit(1);
      if (phoneCandidates.length > 1) {
        messageQuery = messageQuery.in("phone_number", phoneCandidates);
      } else if (phoneCandidates.length === 1) {
        messageQuery = messageQuery.eq("phone_number", phoneCandidates[0]);
      }
      const { data: recentMessages, error: messageError } = await messageQuery;
      if (messageError) {
        logger.error("Failed to map inbound SMS from message history", {
          ...baseRequestContext,
          error: messageError,
          phone_number: phoneNumber,
        });
      }
      const recentMessage = recentMessages?.[0] ?? null;
      companyId = companyId ?? recentMessage?.company_id ?? null;
      customerId = customerId ?? recentMessage?.customer_id ?? null;
    }
    if (!companyId) {
      logger.warn("Inbound SMS missing company mapping", {
        ...baseRequestContext,
        from,
        phone_number: phoneNumber,
      });
      return NextResponse.json({ success: false, error: "Unknown sender" }, { status: 404 });
    }
    if (optAction) {
      let optQuery = admin.from("customers").update({ sms_opt_in: optAction === "opt_in" });
      if (customerId) {
        optQuery = optQuery.eq("customer_id", customerId);
      } else {
        optQuery = optQuery.eq("company_id", companyId).eq("phone", phoneNumber || from);
      }
      const { error: optError } = await optQuery;
      if (optError) {
        logger.error("Failed to update SMS opt-in status", {
          ...baseRequestContext,
          error: optError,
          company_id: companyId,
          customer_id: customerId,
          phone_number: phoneNumber || from,
          action: optAction,
        });
      }
    }

    const threadId = await resolveThreadId(admin, customerId ?? null, phoneNumber || from, companyId);
    const assignedTo = await resolveThreadAssignee(admin, threadId, companyId);
    await admin.from("sms_messages").insert({
      company_id: companyId,
      customer_id: customerId ?? null,
      phone_number: phoneNumber || from,
      content: body,
      direction: "inbound",
      twilio_sid: messageSid || null,
      thread_id: threadId,
      assigned_to: assignedTo,
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
  const requestContext = {
    ...baseRequestContext,
    user_id: profile.user_id,
    company_id: profile.company_id,
  };

  const payload = await request.json().catch(() => null);
  const parsed = smsSendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid message" }, { status: 400 });
  }

  const admin = createAdminClient();
  const phoneNumber = normalizePhoneNumber(parsed.data.to);
  const optQuery = parsed.data.customerId
    ? admin.from("customers").select("sms_opt_in").eq("customer_id", parsed.data.customerId)
    : admin
        .from("customers")
        .select("sms_opt_in")
        .eq("company_id", profile.company_id)
        .eq("phone", phoneNumber);
  const { data: smsConsent, error: consentError } = await optQuery.maybeSingle();
  if (consentError) {
    logger.error("Failed to verify SMS consent", { ...requestContext, error: consentError });
    return NextResponse.json({ success: false, error: "Unable to verify SMS consent" }, { status: 500 });
  }
  if (smsConsent?.sms_opt_in === false) {
    return NextResponse.json({ success: false, error: "Customer has opted out of SMS" }, { status: 403 });
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("name")
    .eq("company_id", profile.company_id)
    .maybeSingle();
  if (companyError) {
    logger.error("Failed to load SMS prefix", { ...requestContext, error: companyError });
  }
  const messageWithPrefix = applySmsPrefix(parsed.data.message, company?.name ?? null);

  const threadId = parsed.data.threadId
    ? parsed.data.threadId
    : await resolveThreadId(admin, parsed.data.customerId ?? null, phoneNumber, profile.company_id);
  const assignedTo = await resolveThreadAssignee(admin, threadId, profile.company_id);
  if (assignedTo && assignedTo !== profile.user_id) {
    return NextResponse.json(
      { success: false, error: "Conversation déjà assignée à un autre membre." },
      { status: 423 }
    );
  }
  if (!assignedTo) {
    const { error: assignError } = await assignThreadToUser(admin, threadId, profile.company_id, profile.user_id);
    if (assignError) {
      logger.error("Failed to assign SMS thread", { ...requestContext, error: assignError });
      return NextResponse.json(
        { success: false, error: "Impossible d'assigner la conversation." },
        { status: 500 }
      );
    }
  }
  const idempotency = await beginIdempotency(admin, request, profile.user_id, {
    to: phoneNumber,
    message: parsed.data.message,
    threadId,
  });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }
  const createdAt = new Date().toISOString();
  const { data: messageRecord, error: insertError } = await admin
    .from("sms_messages")
    .insert({
      company_id: profile.company_id,
      customer_id: parsed.data.customerId ?? null,
      phone_number: phoneNumber,
      content: messageWithPrefix,
      direction: "outbound",
      thread_id: threadId,
      status: "queued",
      assigned_to: assignedTo ?? profile.user_id,
      created_at: createdAt,
    })
    .select("sms_id")
    .single();
  if (insertError || !messageRecord) {
    logger.error("Failed to persist outbound SMS", { ...requestContext, error: insertError });
    const responseBody = { success: false, error: "Unable to persist SMS" };
    await completeIdempotency(admin, request, idempotency.scope, idempotency.requestHash, responseBody, 500);
    return NextResponse.json(responseBody, { status: 500 });
  }
  try {
    await sendSms(phoneNumber, messageWithPrefix);
  } catch (error) {
    const { error: statusError } = await admin
      .from("sms_messages")
      .update({ status: "failed" })
      .eq("sms_id", messageRecord.sms_id);
    if (statusError) {
      logger.error("Failed to update SMS status", { ...requestContext, error: statusError });
    }
    const responseBody = { success: false, error: "SMS is unavailable" };
    await completeIdempotency(admin, request, idempotency.scope, idempotency.requestHash, responseBody, 503);
    return smsUnavailable(error, requestContext);
  }
  const { error: updateError } = await admin
    .from("sms_messages")
    .update({ status: "sent" })
    .eq("sms_id", messageRecord.sms_id);
  if (updateError) {
    logger.error("Failed to update SMS status", { ...requestContext, error: updateError });
  }
  await logAudit(admin, profile.user_id, "sms_send", "sms_thread", threadId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: { to: phoneNumber },
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
    return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
  }

  const auth = await requireRole(request, ["admin", "manager", "dispatcher"], "customers");
  if ("response" in auth) {
    return auth.response;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { profile } = auth;
  const { data, error } = await client
    .from("sms_messages")
    .select("sms_id, phone_number, content, direction, status, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ success: false, error: "Unable to load SMS" }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
