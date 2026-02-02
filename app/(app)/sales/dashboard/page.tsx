"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import Link from "next/link";

type SalesStats = {
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
  followUps: FollowUp[];
};

type FollowUp = {
  lead_id: string;
  customer_name: string;
  follow_up_date: string;
  status: string;
  estimated_value: number;
};

export default function SalesDashboard() {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/sales/dashboard");
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Unable to load sales dashboard");
      setStats(null);
      setLoading(false);
      return;
    }
    if (!data) {
      setError("");
      setStats(null);
      setLoading(false);
      return;
    }
    setStats(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="page">
        <TopBar title="Sales Dashboard" subtitle="Loading..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page">
        <TopBar
          title="Sales Dashboard"
          subtitle="Unable to load stats"
          actions={
            <button className="button-secondary" onClick={loadStats}>
              ↻ Refresh
            </button>
          }
        />
        <div className="alert" style={{ marginTop: "16px" }}>
          {error || "No data available."}
        </div>
      </div>
    );
  }

  const conversionRate = stats.thisMonth.leads > 0
    ? ((stats.thisMonth.conversions / stats.thisMonth.leads) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="page">
      <TopBar
        title="Sales Dashboard"
        subtitle="Your performance overview"
        actions={
          <button className="button-secondary" onClick={loadStats}>
            ↻ Refresh
          </button>
        }
      />

      {/* KPIs - This Month */}
      <section className="kpi-grid">
        <div className="card">
          <div className="card-label">This Month Revenue</div>
          <div className="card-value">${stats.thisMonth.revenue.toLocaleString()}</div>
          <div className="card-meta">{stats.thisMonth.conversions} jobs won</div>
        </div>

        <div className="card">
          <div className="card-label">This Week</div>
          <div className="card-value">${stats.thisWeek.revenue.toLocaleString()}</div>
          <div className="card-meta">{stats.thisWeek.leads} new leads</div>
        </div>

        <div className="card">
          <div className="card-label">Conversion Rate</div>
          <div className="card-value">{conversionRate}%</div>
          <div className="card-meta">{stats.thisMonth.conversions} / {stats.thisMonth.leads} leads</div>
        </div>

        <div className="card">
          <div className="card-label">Avg Deal Size</div>
          <div className="card-value">${stats.thisMonth.avgDealSize.toFixed(0)}</div>
          <div className="card-meta">Per job</div>
        </div>
      </section>

      {/* Leaderboard Rank */}
      <section className="card" style={{ marginTop: "24px" }}>
        <h3 className="card-title">Leaderboard Position</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "12px" }}>
          <div style={{ fontSize: "48px", fontWeight: "bold", color: "var(--accent)" }}>
            #{stats.leaderboard.rank}
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>
              of {stats.leaderboard.totalReps} sales reps
            </div>
            <div className="card-meta" style={{ marginTop: "4px" }}>
              {stats.leaderboard.percentageVsFirst > 0 && `+${stats.leaderboard.percentageVsFirst}% above #1`}
              {stats.leaderboard.percentageVsFirst < 0 && `${stats.leaderboard.percentageVsFirst}% below #1`}
              {stats.leaderboard.percentageVsFirst === 0 && "You're #1! 🎉"}
            </div>
            <div className="card-meta">
              {stats.leaderboard.percentageVsAverage > 0 && `+${stats.leaderboard.percentageVsAverage}% above average`}
              {stats.leaderboard.percentageVsAverage < 0 && `${stats.leaderboard.percentageVsAverage}% below average`}
              {stats.leaderboard.percentageVsAverage === 0 && "At average"}
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Visualization */}
      <section className="card" style={{ marginTop: "24px" }}>
        <h3 className="card-title">Sales Pipeline</h3>
        <div className="card-meta" style={{ marginBottom: "16px" }}>
          Track your leads through each stage
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
          {[
            { label: "New", count: stats.pipeline.new, color: "#64748b" },
            { label: "Contacted", count: stats.pipeline.contacted, color: "#3b82f6" },
            { label: "Estimated", count: stats.pipeline.estimated, color: "#f59e0b" },
            { label: "Won", count: stats.pipeline.won, color: "#10b981" },
            { label: "Lost", count: stats.pipeline.lost, color: "#ef4444" },
          ].map((stage) => (
            <div
              key={stage.label}
              className="card-muted"
              style={{
                padding: "16px",
                textAlign: "center",
                borderLeft: `3px solid ${stage.color}`,
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: "bold", color: stage.color }}>
                {stage.count}
              </div>
              <div className="card-meta" style={{ marginTop: "4px", fontSize: "11px" }}>
                {stage.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Follow-up Reminders */}
      <section className="card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            Follow-up Reminders
          </h3>
          <Link href="/sales/leads" className="button-ghost" style={{ padding: "8px 12px" }}>
            View All
          </Link>
        </div>

        {stats.followUps.length === 0 && (
          <p className="card-meta">No follow-ups scheduled</p>
        )}

        <div className="list">
          {stats.followUps.slice(0, 5).map((followUp) => (
            <div key={followUp.lead_id} className="list-item">
              <div>
                <strong>{followUp.customer_name}</strong>
                <div className="card-meta">
                  Follow up: {new Date(followUp.follow_up_date).toLocaleDateString("fr-CA")}
                </div>
                <div style={{ marginTop: "4px" }}>
                  Est. ${followUp.estimated_value.toLocaleString()}
                </div>
              </div>
              <div>
                <Link href={`/sales/leads?id=${followUp.lead_id}`}>
                  <button className="button-secondary">Contact</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
