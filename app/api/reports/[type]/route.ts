import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  const auth = await requireRole(request, ["admin", "manager"]);
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const type = params.type;

  if (type === "dashboard") {
    const { data: jobs } = await client.from("jobs").select("estimated_revenue, status");
    const revenue = jobs?.reduce((sum, job) => sum + (job.estimated_revenue ?? 0), 0) ?? 0;
    return NextResponse.json({ data: { revenue, jobCount: jobs?.length ?? 0 } });
  }

  if (type === "revenue") {
    const { data } = await client.from("jobs").select("scheduled_date, estimated_revenue");
    return NextResponse.json({ data });
  }

  if (type === "technician") {
    const { data } = await client
      .from("jobs")
      .select("technician_id, estimated_revenue, status");
    return NextResponse.json({ data });
  }

  if (type === "commission") {
    const { data } = await client.from("employee_commissions").select("*");
    return NextResponse.json({ data });
  }

  if (type === "quality") {
    const { data } = await client.from("job_quality_issues").select("*");
    return NextResponse.json({ data });
  }

  if (type === "export") {
    const { data } = await client.from("jobs").select("job_id, status, estimated_revenue");
    return NextResponse.json({ data });
  }

  if (type === "audit-log") {
    const { data } = await client.from("user_audit_log").select("*").order("created_at", { ascending: false });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Unsupported report" }, { status: 400 });
}
