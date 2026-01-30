import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { buildSalesStats, type LeadRow, type LeaderboardRow } from "@/lib/salesDashboard";
import { emptyQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager", "sales_rep"], "sales");
  if ("response" in auth) {
    return auth.response;
  }

  const queryResult = emptyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const now = new Date();

  let leadQuery = client
    .from("leads")
    .select("lead_id, first_name, last_name, status, estimated_job_value, follow_up_date, created_at, sales_rep_id")
    .eq("company_id", profile.company_id);
  if (profile.role === "sales_rep") {
    leadQuery = leadQuery.eq("sales_rep_id", user.id);
  }

  const { data: leads, error: leadsError } = await leadQuery;
  const { data: leaderboard, error: leaderboardError } = await client
    .from("leaderboard")
    .select("sales_rep_id, total_revenue, rank")
    .eq("company_id", profile.company_id)
    .eq("month", now.getUTCMonth() + 1)
    .eq("year", now.getUTCFullYear());

  if (leadsError || leaderboardError) {
    console.error("Failed to load sales dashboard", {
      leadsError,
      leaderboardError,
      userId: user.id,
      companyId: profile.company_id,
    });
    return NextResponse.json({ error: "Unable to load sales dashboard" }, { status: 500 });
  }

  const stats = buildSalesStats({
    leads: (leads ?? []) as LeadRow[],
    leaderboard: (leaderboard ?? []) as LeaderboardRow[],
    userId: user.id,
    role: profile.role,
    now,
  });

  return NextResponse.json({ success: true, data: stats, ...stats });
}
