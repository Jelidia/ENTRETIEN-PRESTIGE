import { NextResponse } from "next/server";
import { smsSendSchema } from "@/lib/validators";
import { sendSms } from "@/lib/twilio";
import { createAdminClient } from "@/lib/supabaseServer";

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
    await admin.from("sms_messages").insert({
      phone_number: from,
      content: body,
      direction: "inbound",
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  }

  const payload = await request.json().catch(() => null);
  const parsed = smsSendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  await sendSms(parsed.data.to, parsed.data.message);
  return NextResponse.json({ ok: true });
}
