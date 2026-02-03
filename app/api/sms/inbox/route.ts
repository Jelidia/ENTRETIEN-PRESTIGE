import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { emptyQuerySchema } from "@/lib/validators";

type SmsThreadSummary = {
  thread_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: unknown[];
};

// Get SMS inbox threads (role-based filtering)
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
      thread_id,
      sms_id,
      phone_number,
      content,
      direction,
      created_at,
      is_read,
      customer_id,
      customer:customers!customer_id(first_name, last_name, phone)
    `)
    .not("thread_id", "is", null)
    .order("created_at", { ascending: false });

  // Apply role-based filtering
  if (profile.role === "technician") {
    // Only see conversations for assigned customers
    const { data: assignments } = await client
      .from("job_assignments")
      .select("job:jobs(customer_id)")
      .eq("technician_id", profile.user_id);

    const customerIds = [
      ...new Set(
        (assignments ?? [])
          .map((assignment: { job?: { customer_id?: string | null } | { customer_id?: string | null }[] | null }) => {
            const job = Array.isArray(assignment.job) ? assignment.job[0] : assignment.job;
            return job?.customer_id ?? null;
          })
          .filter((value): value is string => Boolean(value))
      ),
    ];

    if (customerIds.length === 0) {
      return NextResponse.json({ success: true, data: { threads: [] }, threads: [] });
    }

    query = query.in("customer_id", customerIds);
  } else if (profile.role === "sales_rep") {
    const { data: jobs } = await client
      .from("jobs")
      .select("customer_id")
      .eq("sales_rep_id", profile.user_id);

    const customerIds = [...new Set(
      jobs?.map((job: { customer_id?: string | null }) => job.customer_id).filter(Boolean) || []
    )];

    if (customerIds.length === 0) {
      return NextResponse.json({ success: true, data: { threads: [] }, threads: [] });
    }

    query = query.in("customer_id", customerIds);
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
  const threadsMap = new Map<string, SmsThreadSummary>();

  for (const msg of messages || []) {
    const threadId = msg.thread_id;
    if (!threadId) continue;

    if (!threadsMap.has(threadId)) {
      const customer = Array.isArray(msg.customer) ? msg.customer[0] : msg.customer;
      const firstName = (customer as { first_name?: string } | null | undefined)?.first_name ?? "";
      const lastName = (customer as { last_name?: string } | null | undefined)?.last_name ?? "";
      const customerName = `${firstName} ${lastName}`.trim() || "Unknown";
      const customerPhone = (customer as { phone?: string } | null | undefined)?.phone || msg.phone_number;

      threadsMap.set(threadId, {
        thread_id: threadId,
        customer_id: msg.customer_id,
        customer_name: customerName,
        customer_phone: customerPhone,
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: 0,
        messages: [],
      });
    }

    const thread = threadsMap.get(threadId);
    if (!thread) {
      continue;
    }

    // Update unread count
    if (msg.direction === "inbound" && !msg.is_read) {
      thread.unread_count++;
    }

    // Keep most recent message
    if (new Date(msg.created_at) > new Date(thread.last_message_at)) {
      thread.last_message = msg.content;
      thread.last_message_at = msg.created_at;
    }
  }

  const threads = Array.from(threadsMap.values()).sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );

  return NextResponse.json({ success: true, data: { threads }, threads });
}
