import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

// Get messages for a specific thread
export async function GET(
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

  const { data: messages, error } = await client
    .from("sms_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("sent_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load messages", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ messages: messages || [] });
}
