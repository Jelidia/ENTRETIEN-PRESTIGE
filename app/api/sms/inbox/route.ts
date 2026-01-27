import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

// Get SMS inbox threads (role-based filtering)
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { profile } = auth;

  // Role-based filtering:
  // - Manager: sees ALL conversations
  // - Technician: sees ONLY assigned customers
  // - Sales Rep: sees ONLY assigned customers

  let query = client
    .from("sms_messages")
    .select(`
      message_id,
      thread_id,
      recipient_phone,
      sender_phone,
      message_body,
      direction,
      sent_at,
      is_read,
      related_customer_id,
      customer:customers!related_customer_id(customer_id, full_name, phone)
    `)
    .not("thread_id", "is", null)
    .order("sent_at", { ascending: false });

  // Apply role-based filtering
  if (profile.role === "technician" || profile.role === "sales_rep") {
    // Only see conversations for assigned customers
    const { data: assignments } = await client
      .from("job_assignments")
      .select("job:jobs(customer_id)")
      .eq("user_id", profile.user_id);

    const customerIds = [...new Set(
      assignments?.map((a: any) => a.job?.customer_id).filter(Boolean) || []
    )];

    if (customerIds.length === 0) {
      return NextResponse.json({ threads: [] });
    }

    query = query.in("related_customer_id", customerIds);
  }
  // Manager and admin see all (no filter)

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to load inbox", details: error.message },
      { status: 500 }
    );
  }

  // Group messages by thread_id
  const threadsMap = new Map<string, any>();

  for (const msg of messages || []) {
    const threadId = msg.thread_id;
    if (!threadId) continue;

    if (!threadsMap.has(threadId)) {
      const customer = Array.isArray(msg.customer) ? msg.customer[0] : msg.customer;
      const customerName = (customer as { full_name?: string } | null | undefined)?.full_name || "Unknown";
      const customerPhone = (customer as { phone?: string } | null | undefined)?.phone || msg.recipient_phone || msg.sender_phone;

      threadsMap.set(threadId, {
        thread_id: threadId,
        customer_id: msg.related_customer_id,
        customer_name: customerName,
        customer_phone: customerPhone,
        last_message: msg.message_body,
        last_message_at: msg.sent_at,
        unread_count: 0,
        messages: [],
      });
    }

    const thread = threadsMap.get(threadId);

    // Update unread count
    if (msg.direction === "inbound" && !msg.is_read) {
      thread.unread_count++;
    }

    // Keep most recent message
    if (new Date(msg.sent_at) > new Date(thread.last_message_at)) {
      thread.last_message = msg.message_body;
      thread.last_message_at = msg.sent_at;
    }
  }

  const threads = Array.from(threadsMap.values()).sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );

  return NextResponse.json({ threads });
}
