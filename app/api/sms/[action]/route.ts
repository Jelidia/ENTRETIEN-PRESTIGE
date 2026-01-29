import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { smsSendSchema } from "@/lib/validators";
import { sendSms } from "@/lib/twilio";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/auth";
import { getAccessTokenFromRequest } from "@/lib/session";

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
  const action = params.action;
  if (action === "webhook") {
    const formData = await request.formData();
    const from = formData.get("From")?.toString() ?? "";
    const body = formData.get("Body")?.toString() ?? "";
    const admin = createAdminClient();
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
      thread_id: threadId,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
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

  await sendSms(parsed.data.to, parsed.data.message);
  const admin = createAdminClient();
  const threadId = parsed.data.threadId
    ? parsed.data.threadId
    : await resolveThreadId(admin, parsed.data.customerId ?? null, parsed.data.to);
  await admin.from("sms_messages").insert({
    company_id: profile.company_id,
    customer_id: parsed.data.customerId ?? null,
    phone_number: parsed.data.to,
    content: parsed.data.message,
    direction: "outbound",
    thread_id: threadId,
    created_at: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
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

  return NextResponse.json({ data });
}
