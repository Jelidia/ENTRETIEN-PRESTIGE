import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

// Mark thread messages as read
export async function POST(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { threadId } = params;

  const { error } = await client
    .from("sms_messages")
    .update({ is_read: true })
    .eq("thread_id", threadId)
    .eq("direction", "inbound");

  if (error) {
    return NextResponse.json(
      { error: "Failed to mark as read", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
