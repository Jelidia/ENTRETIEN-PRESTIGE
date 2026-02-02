export type SalesStats = {
  thisMonth: {
    revenue: number;
    leads: number;
    conversions: number;
    avgDealSize: number;
  };
  thisWeek: {
    revenue: number;
    leads: number;
  };
  leaderboard: {
    rank: number;
    totalReps: number;
    percentageVsFirst: number;
    percentageVsAverage: number;
  };
  pipeline: {
    new: number;
    contacted: number;
    estimated: number;
    won: number;
    lost: number;
  };
  followUps: Array<{
    lead_id: string;
    customer_name: string;
    follow_up_date: string;
    status: string;
    estimated_value: number;
  }>;
};

export type LeadRow = {
  lead_id: string;
  first_name?: string | null;
  last_name?: string | null;
  status?: string | null;
  estimated_job_value?: number | null;
  follow_up_date?: string | null;
  created_at?: string | null;
  sales_rep_id?: string | null;
};

export type LeaderboardRow = {
  sales_rep_id?: string | null;
  total_revenue?: number | null;
  rank?: number | null;
};

type BuildSalesStatsInput = {
  leads: LeadRow[];
  leaderboard: LeaderboardRow[];
  userId: string;
  role: string;
  now?: Date;
};

const WEEK_WINDOW_DAYS = 7;

export function buildSalesStats({ leads, leaderboard, userId, role, now = new Date() }: BuildSalesStatsInput): SalesStats {
  const filteredLeads = role === "sales_rep" ? leads.filter((lead) => lead.sales_rep_id === userId) : leads;
  const today = startOfUtcDay(now);
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() - (WEEK_WINDOW_DAYS - 1));
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const monthLeads = filteredLeads.filter((lead) => isWithinRange(lead.created_at, monthStart, today));
  const weekLeads = filteredLeads.filter((lead) => isWithinRange(lead.created_at, weekStart, today));

  const monthConversions = monthLeads.filter((lead) => lead.status === "won");
  const monthRevenue = monthConversions.reduce((sum, lead) => sum + (lead.estimated_job_value ?? 0), 0);
  const monthAvgDeal = monthConversions.length ? monthRevenue / monthConversions.length : 0;

  const weekConversions = weekLeads.filter((lead) => lead.status === "won");
  const weekRevenue = weekConversions.reduce((sum, lead) => sum + (lead.estimated_job_value ?? 0), 0);

  return {
    thisMonth: {
      revenue: monthRevenue,
      leads: monthLeads.length,
      conversions: monthConversions.length,
      avgDealSize: monthAvgDeal,
    },
    thisWeek: {
      revenue: weekRevenue,
      leads: weekLeads.length,
    },
    leaderboard: buildLeaderboardStats(leaderboard, userId),
    pipeline: buildPipelineCounts(filteredLeads),
    followUps: buildFollowUps(filteredLeads),
  };
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const normalized = value.includes("T") ? value : `${value}T00:00:00Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function isWithinRange(value: string | null | undefined, start: Date, end: Date) {
  const date = parseDate(value);
  if (!date) {
    return false;
  }
  return date >= start && date <= end;
}

function buildPipelineCounts(leads: LeadRow[]) {
  const pipeline = { new: 0, contacted: 0, estimated: 0, won: 0, lost: 0 };
  for (const lead of leads) {
    switch (lead.status) {
      case "new":
        pipeline.new += 1;
        break;
      case "contacted":
        pipeline.contacted += 1;
        break;
      case "estimated":
        pipeline.estimated += 1;
        break;
      case "won":
        pipeline.won += 1;
        break;
      case "lost":
        pipeline.lost += 1;
        break;
      default:
        break;
    }
  }
  return pipeline;
}

function buildFollowUps(leads: LeadRow[]) {
  const leadsWithFollowUps = leads.filter(
    (lead): lead is LeadRow & { follow_up_date: string } => Boolean(lead.follow_up_date)
  );
  return leadsWithFollowUps
    .filter((lead) => lead.status !== "won" && lead.status !== "lost")
    .map((lead) => ({ lead, sortDate: parseDate(lead.follow_up_date) }))
    .sort((a, b) => (a.sortDate?.getTime() ?? Number.POSITIVE_INFINITY) - (b.sortDate?.getTime() ?? Number.POSITIVE_INFINITY))
    .map(({ lead }) => ({
      lead_id: lead.lead_id,
      customer_name: buildCustomerName(lead),
      follow_up_date: lead.follow_up_date,
      status: lead.status ?? "new",
      estimated_value: lead.estimated_job_value ?? 0,
    }));
}

function buildCustomerName(lead: LeadRow) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  return name || "Client";
}

function buildLeaderboardStats(leaderboard: LeaderboardRow[], userId: string) {
  if (!leaderboard.length) {
    return { rank: 0, totalReps: 0, percentageVsFirst: 0, percentageVsAverage: 0 };
  }
  const totals = leaderboard.map((row) => row.total_revenue ?? 0);
  const totalReps = totals.length;
  const maxRevenue = Math.max(0, ...totals);
  const avgRevenue = totals.reduce((sum, value) => sum + value, 0) / totalReps;
  const userEntry = leaderboard.find((row) => row.sales_rep_id === userId);
  const userRevenue = userEntry?.total_revenue ?? 0;
  const rank = userEntry?.rank ?? (userEntry ? calculateRank(userRevenue, totals) : 0);

  return {
    rank,
    totalReps,
    percentageVsFirst: maxRevenue > 0 ? roundTo(((userRevenue - maxRevenue) / maxRevenue) * 100, 1) : 0,
    percentageVsAverage: avgRevenue > 0 ? roundTo(((userRevenue - avgRevenue) / avgRevenue) * 100, 1) : 0,
  };
}

function calculateRank(userRevenue: number, totals: number[]) {
  const sorted = [...totals].sort((a, b) => b - a);
  const index = sorted.findIndex((value) => value === userRevenue);
  return index === -1 ? 0 : index + 1;
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
