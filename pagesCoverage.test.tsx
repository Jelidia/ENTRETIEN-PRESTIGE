import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/(app)/dashboard/page";
import SalesDashboard from "@/app/(app)/sales/dashboard/page";
import { getDashboardData } from "@/lib/queries";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/queries", () => ({
  getDashboardData: vi.fn(),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("DashboardPage", () => {
  it("renders KPIs and schedule data", async () => {
    vi.mocked(getDashboardData).mockResolvedValueOnce({
      kpis: [
        { label: "Revenue", value: "$120", meta: "Today" },
        { label: "Jobs", value: "4", meta: "Scheduled" },
      ],
      revenueBars: [30, 60],
      scheduleToday: [
        {
          id: "job-1",
          time: "09:00",
          customer: "Client A",
          service: "Basique",
          revenue: "$120",
          status: "scheduled",
        },
      ],
    });

    const ui = await DashboardPage();
    render(ui);

    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Client A")).toBeInTheDocument();
    expect(screen.getByText("scheduled")).toBeInTheDocument();
  });
});

describe("SalesDashboard", () => {
  const baseStats = {
    thisMonth: { revenue: 12000, leads: 10, conversions: 2, avgDealSize: 6000 },
    thisWeek: { revenue: 2000, leads: 3 },
    leaderboard: {
      rank: 2,
      totalReps: 5,
      percentageVsFirst: 10,
      percentageVsAverage: -5,
    },
    pipeline: { new: 1, contacted: 2, estimated: 3, won: 4, lost: 5 },
    followUps: [],
  };

  it("shows loading state before data arrives", () => {
    fetchMock.mockReturnValueOnce(new Promise(() => undefined));
    render(<SalesDashboard />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error when request fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Boom" }),
    });

    render(<SalesDashboard />);
    expect(await screen.findByText("Boom")).toBeInTheDocument();
  });

  it("shows error when response has no data", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    render(<SalesDashboard />);
    expect(await screen.findByText("Unable to load sales dashboard")).toBeInTheDocument();
  });

  it("renders stats with conversion and leaderboard deltas", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => baseStats,
    });

    render(<SalesDashboard />);
    expect(await screen.findByText("20.0%")).toBeInTheDocument();
    expect(screen.getByText("+10% above #1")).toBeInTheDocument();
    expect(screen.getByText("-5% below average")).toBeInTheDocument();
    expect(screen.getByText("No follow-ups scheduled")).toBeInTheDocument();
  });

  it("renders zero-rate and follow-up list", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...baseStats,
        thisMonth: { revenue: 0, leads: 0, conversions: 0, avgDealSize: 0 },
        leaderboard: {
          rank: 1,
          totalReps: 5,
          percentageVsFirst: 0,
          percentageVsAverage: 0,
        },
        followUps: [
          {
            lead_id: "lead-1",
            customer_name: "Claire",
            follow_up_date: "2026-02-01",
            status: "new",
            estimated_value: 500,
          },
        ],
      }),
    });

    render(<SalesDashboard />);
    expect(await screen.findByText("0.0%")).toBeInTheDocument();
    expect(screen.getByText("You're #1! 🎉")).toBeInTheDocument();
    expect(screen.getByText("At average")).toBeInTheDocument();
    expect(screen.getByText("Claire")).toBeInTheDocument();
  });
});
