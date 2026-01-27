import { describe, expect, it } from "vitest";
import { buildSalesStats } from "@/lib/salesDashboard";

describe("buildSalesStats", () => {
  it("calculates sales rep stats and leaderboard deltas", () => {
    const now = new Date("2026-01-27T12:00:00Z");
    const leads = [
      {
        lead_id: "lead-1",
        first_name: "Chloe",
        last_name: "Martin",
        status: "new",
        estimated_job_value: 100,
        follow_up_date: "2026-01-28",
        created_at: "2026-01-25",
        sales_rep_id: "rep-1",
      },
      {
        lead_id: "lead-2",
        first_name: "Julien",
        last_name: "Dubois",
        status: "won",
        estimated_job_value: 300,
        created_at: "2026-01-10",
        sales_rep_id: "rep-1",
      },
      {
        lead_id: "lead-3",
        first_name: "Noah",
        last_name: "Roy",
        status: "won",
        estimated_job_value: 200,
        created_at: "2025-12-20",
        sales_rep_id: "rep-1",
      },
      {
        lead_id: "lead-4",
        first_name: "Emma",
        last_name: "Tremblay",
        status: "lost",
        estimated_job_value: 150,
        created_at: "2026-01-12",
        sales_rep_id: "rep-2",
      },
      {
        lead_id: "lead-5",
        first_name: "Leo",
        last_name: "Gagnon",
        status: "contacted",
        estimated_job_value: 50,
        created_at: "2026-01-26",
        sales_rep_id: "rep-1",
      },
    ];
    const leaderboard = [
      { sales_rep_id: "rep-2", total_revenue: 1500, rank: 1 },
      { sales_rep_id: "rep-1", total_revenue: 1000, rank: 2 },
      { sales_rep_id: "rep-3", total_revenue: 500, rank: 3 },
    ];

    const stats = buildSalesStats({ leads, leaderboard, userId: "rep-1", role: "sales_rep", now });

    expect(stats.thisMonth.leads).toBe(3);
    expect(stats.thisMonth.conversions).toBe(1);
    expect(stats.thisMonth.revenue).toBe(300);
    expect(stats.thisMonth.avgDealSize).toBe(300);

    expect(stats.thisWeek.leads).toBe(2);
    expect(stats.thisWeek.revenue).toBe(0);

    expect(stats.pipeline).toEqual({ new: 1, contacted: 1, estimated: 0, won: 2, lost: 0 });
    expect(stats.followUps).toHaveLength(1);
    expect(stats.followUps[0].customer_name).toBe("Chloe Martin");

    expect(stats.leaderboard.rank).toBe(2);
    expect(stats.leaderboard.totalReps).toBe(3);
    expect(stats.leaderboard.percentageVsFirst).toBe(-33.3);
    expect(stats.leaderboard.percentageVsAverage).toBe(0);
  });

  it("returns defaults when leaderboard is empty", () => {
    const now = new Date("2026-01-27T12:00:00Z");
    const leads = [
      {
        lead_id: "lead-6",
        first_name: "Alex",
        last_name: "Roy",
        status: "lost",
        created_at: "2026-01-20",
        sales_rep_id: "rep-2",
      },
    ];

    const stats = buildSalesStats({ leads, leaderboard: [], userId: "admin-1", role: "manager", now });

    expect(stats.pipeline.lost).toBe(1);
    expect(stats.leaderboard).toEqual({
      rank: 0,
      totalReps: 0,
      percentageVsFirst: 0,
      percentageVsAverage: 0,
    });
  });

  it("computes rank when missing and uses client fallback", () => {
    const now = new Date("2026-01-27T12:00:00Z");
    const leads = [
      {
        lead_id: "lead-7",
        status: "contacted",
        follow_up_date: "2026-01-20",
        created_at: "2026-01-20",
        sales_rep_id: "rep-9",
      },
    ];
    const leaderboard = [
      { sales_rep_id: "rep-8", total_revenue: 400, rank: null },
      { sales_rep_id: "rep-9", total_revenue: 200, rank: null },
    ];

    const stats = buildSalesStats({ leads, leaderboard, userId: "rep-9", role: "sales_rep", now });

    expect(stats.followUps[0].customer_name).toBe("Client");
    expect(stats.leaderboard.rank).toBe(2);
    expect(stats.leaderboard.percentageVsFirst).toBe(-50);
    expect(stats.leaderboard.percentageVsAverage).toBe(-33.3);
  });
});
