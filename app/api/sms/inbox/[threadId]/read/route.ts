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
  userId: string,
  companyId: string
): Promise<string[] | null> {
  if (role === "technician") {
    const { data: jobs } = await client
      .from("jobs")
      .select("customer_id")
      .eq("technician_id", userId)
      .eq("company_id", companyId);

    const customerIds = [
      ...new Set(
        (jobs ?? [])
          .map((job: { customer_id?: string | null }) => job.customer_id)
          .filter((value): value is string => Boolean(value))
      ),
    ];

    return customerIds;
  }

  if (role === "sales_rep") {
    const { data: jobs } = await client
      .from("jobs")
      .select("customer_id")
      .eq("sales_rep_id", userId)
      .eq("company_id", companyId);

    const customerIds = [...new Set(
      jobs?.map((job: { customer_id?: string | null }) => job.customer_id).filter(Boolean) || []
    )];

    return customerIds;
  }

  return null;
}

function lockedResponse() {
  return NextResponse.json(
    { success: false, error: "Conversation déjà assignée à un autre membre.", code: "sms_thread_locked" },
    { status: 423 }
  );
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

  const customerIds = await resolveCustomerIds(client, profile.role, profile.user_id, profile.company_id);
  if (customerIds && customerIds.length === 0) {
    return forbidden("Accès refusé", "sms_thread_forbidden");
  }

  if (customerIds) {
    const { data: allowed } = await client
      .from("sms_messages")
      .select("sms_id")
      .eq("thread_id", threadId)
      .eq("company_id", profile.company_id)
      .in("customer_id", customerIds)
      .limit(1);

    if (!allowed || allowed.length === 0) {
      return forbidden("Accès refusé", "sms_thread_forbidden");
    }
  }

  const { data: lockRow, error: lockError } = await client
    .from("sms_messages")
    .select("sms_id, assigned_to")
    .eq("thread_id", threadId)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lockError) {
    return NextResponse.json({ success: false, error: "Impossible de vérifier la conversation." }, { status: 500 });
  }
  if (!lockRow) {
    return NextResponse.json({ success: false, error: "Conversation introuvable" }, { status: 404 });
  }
  if (lockRow.assigned_to && lockRow.assigned_to !== profile.user_id) {
    return lockedResponse();
  }
  if (!lockRow.assigned_to) {
    const { error: assignError } = await client
      .from("sms_messages")
      .update({ assigned_to: profile.user_id })
      .eq("thread_id", threadId)
      .eq("company_id", profile.company_id)
      .is("assigned_to", null);
    if (assignError) {
      return NextResponse.json({ success: false, error: "Impossible d'assigner la conversation." }, { status: 500 });
    }
  }

  let query = client
    .from("sms_messages")
    .update({ is_read: true })
    .eq("thread_id", threadId)
    .eq("company_id", profile.company_id)
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
