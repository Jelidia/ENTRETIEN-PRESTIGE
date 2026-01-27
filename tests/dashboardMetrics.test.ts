import { describe, expect, it } from "vitest";
import { buildDashboardData } from "@/lib/dashboardMetrics";

describe("buildDashboardData", () => {
  it("maps KPI values, revenue bars, and schedule", () => {
    const now = new Date("2026-01-27T12:00:00Z");
    const jobs = [
      {
        job_id: "job-1",
        customer_id: "cust-1",
        service_type: "Window cleaning",
        status: "scheduled",
        scheduled_date: "2026-01-27",
        scheduled_start_time: "09:00:00",
        scheduled_end_time: "10:00:00",
        estimated_revenue: 200,
      },
      {
        job_id: "job-2",
        customer_id: "cust-2",
        service_type: "Gutter cleaning",
        status: "completed",
        scheduled_date: "2026-01-10",
        scheduled_start_time: "11:00:00",
        actual_revenue: 150,
        estimated_revenue: 100,
      },
      {
        job_id: "job-3",
        customer_id: "cust-3",
        service_type: "Roof wash",
        status: "completed",
        scheduled_date: "2025-12-15",
        estimated_revenue: 300,
      },
    ];
    const customers = [
      { customer_id: "cust-1", first_name: "Marie", last_name: "Curie", status: "active", average_rating: 4.5 },
      { customer_id: "cust-2", first_name: "Louis", last_name: "Pasteur", status: "inactive", average_rating: 5 },
      { customer_id: "cust-3", first_name: "Anne", last_name: "Hidalgo", status: "active", average_rating: 4 },
    ];

    const result = buildDashboardData({ jobs, customers, now });

    expect(result.kpis[0]).toEqual({ label: "Today jobs", value: "1", meta: "Scheduled today" });
    expect(result.kpis[1].value).toBe("$350");
    expect(result.kpis[2].value).toBe("2");
    expect(result.kpis[3].value).toBe("4.5");

    expect(result.scheduleToday[0]).toMatchObject({
      customer: "Marie Curie",
      time: "09:00 - 10:00",
      service: "Window cleaning",
      revenue: "$200",
      status: "scheduled",
    });

    expect(result.revenueBars).toHaveLength(12);
    expect(result.revenueBars[10]).toBe(86);
    expect(result.revenueBars[11]).toBe(100);
  });

  it("returns zeros when data is missing", () => {
    const now = new Date("2026-01-27T12:00:00Z");
    const jobs = [
      {
        job_id: "job-1",
        scheduled_date: "not-a-date",
        estimated_revenue: 200,
      },
    ];

    const result = buildDashboardData({ jobs, customers: [], now });

    expect(result.kpis[0].value).toBe("0");
    expect(result.kpis[1].value).toBe("$0");
    expect(result.kpis[2].value).toBe("0");
    expect(result.kpis[3].value).toBe("0.0");
    expect(result.scheduleToday).toHaveLength(0);
    expect(result.revenueBars.every((value) => value === 0)).toBe(true);
  });

  it("uses fallbacks for missing schedule details", () => {
    const now = new Date("2026-01-27T12:00:00Z");
    const jobs = [
      {
        job_id: "job-1",
        scheduled_date: "2026-01-27",
        estimated_revenue: 0,
      },
      {
        job_id: "job-2",
        scheduled_date: "2024-01-01",
        estimated_revenue: 100,
      },
    ];

    const result = buildDashboardData({ jobs, customers: [], now });

    expect(result.kpis[0].value).toBe("1");
    expect(result.scheduleToday[0].time).toBe("--");
    expect(result.scheduleToday[0].customer).toBe("Client");
    expect(result.revenueBars.every((value) => value === 0)).toBe(true);
  });
});
