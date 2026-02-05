import { NextResponse } from "next/server";
import { forbidden, requireUser } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { threadIdParamSchema } from "@/lib/validators";

async function resolveCustomerIds(
  client: ReturnType<typeof createUserClient>,
  role: string,
  userId: string
): Promise<string[] | null> {
  if (role === "technician") {
    const { data: assignments } = await client
      .from("job_assignments")
      .select("job:jobs(customer_id)")
      .eq("technician_id", userId);

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

    return customerIds;
  }

  if (role === "sales_rep") {
    const { data: jobs } = await client
      .from("jobs")
      .select("customer_id")
      .eq("sales_rep_id", userId);

    const customerIds = [...new Set(
      jobs?.map((job: { customer_id?: string | null }) => job.customer_id).filter(Boolean) || []
    )];

    return customerIds;
  }

  return null;
}

// Mark thread messages as read
export async function POST(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const paramsResult = threadIdParamSchema.safeParse(params);
  if (!paramsResult.success) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { threadId } = paramsResult.data;
  const { profile } = auth;
  const ip = getRequestIp(request);
  const idempotency = await beginIdempotency(client, request, profile.user_id, { threadId });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }

  const customerIds = await resolveCustomerIds(client, profile.role, profile.user_id);
  if (customerIds && customerIds.length === 0) {
    return forbidden("Accès refusé", "sms_thread_forbidden");
  }

  if (customerIds) {
    const { data: allowed } = await client
      .from("sms_messages")
      .select("sms_id")
      .eq("thread_id", threadId)
      .in("customer_id", customerIds)
      .limit(1);

    if (!allowed || allowed.length === 0) {
      return forbidden("Accès refusé", "sms_thread_forbidden");
    }
  }

  let query = client
    .from("sms_messages")
    .update({ is_read: true })
    .eq("thread_id", threadId)
    .eq("direction", "inbound");

  if (customerIds) {
    query = query.in("customer_id", customerIds);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to mark as read", details: error.message },
      { status: 500 }
    );
  }

  await logAudit(client, profile.user_id, "sms_mark_read", "sms_thread", threadId, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });

  const responseBody = { success: true, data: { success: true } };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
