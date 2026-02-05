import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { companyUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], "settings");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const { data, error } = await client
    .from("companies")
    .select("*")
    .eq("company_id", profile.company_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"], "settings");
  if ("response" in auth) {
    return auth.response;
  }
  const { profile } = auth;
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => null);
  const parsed = companyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid update" }, { status: 400 });
  }

  const update = { ...parsed.data } as Record<string, unknown>;
  if (parsed.data.rolePermissions !== undefined) {
    update.role_permissions = parsed.data.rolePermissions;
    delete update.rolePermissions;
  }

  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const idempotency = await beginIdempotency(client, request, profile.user_id, update);
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }
  const { data, error } = await client
    .from("companies")
    .update(update)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Unable to update company" }, { status: 400 });
  }

  await logAudit(client, profile.user_id, "company_update", "company", profile.company_id, "success", {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") ?? null,
    newValues: update,
  });

  const responseBody = { success: true, data };
  await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 200);
  return NextResponse.json(responseBody);
}
