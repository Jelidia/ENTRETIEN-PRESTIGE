import { NextResponse } from "next/server";
import { emailSendSchema } from "@/lib/validators";
import { sendEmail } from "@/lib/resend";
import { requirePermission } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const auth = await requirePermission(request, "customers");
  if ("response" in auth) {
    return auth.response;
  }

  if (params.action !== "send") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = emailSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  await sendEmail(parsed.data.to, parsed.data.subject, parsed.data.html);
  return NextResponse.json({ ok: true });
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
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  return NextResponse.json({
    subject: "Your invoice from Entretien Prestige",
    body: "Hello, your invoice is ready. Thank you for your business.",
  });
}
