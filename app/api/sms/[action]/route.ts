import { NextResponse } from "next/server";
import { smsSendSchema } from "@/lib/validators";
import { sendSms } from "@/lib/twilio";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/auth";
import { getAccessTokenFromRequest } from "@/lib/session";

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
    await admin.from("sms_messages").insert({
      company_id: customer?.company_id ?? null,
      customer_id: customer?.customer_id ?? null,
      phone_number: from,
      content: body,
      direction: "inbound",
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  }

  const auth = await requireRole(request, ["admin", "manager", "dispatcher"]);
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
  await admin.from("sms_messages").insert({
    company_id: profile.company_id,
    phone_number: parsed.data.to,
    content: parsed.data.message,
    direction: "outbound",
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

  const auth = await requireRole(request, ["admin", "manager", "dispatcher"]);
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
