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
      setError(data?.error ?? "Impossible de charger le tableau de bord des ventes");
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
        <TopBar title="Tableau de bord ventes" subtitle="Chargement..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page">
        <TopBar
          title="Tableau de bord ventes"
          subtitle="Impossible de charger les statistiques"
          actions={
            <button className="button-secondary" onClick={loadStats}>
              ↻ Rafraichir
            </button>
          }
        />
        <div className="alert" style={{ marginTop: "16px" }}>
          {error || "Aucune donnee disponible."}
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
        title="Tableau de bord ventes"
        subtitle="Apercu de votre performance"
        actions={
          <button className="button-secondary" onClick={loadStats}>
            ↻ Rafraichir
          </button>
        }
      />

      {/* KPIs - This Month */}
      <section className="kpi-grid">
        <div className="card">
          <div className="card-label">Revenu du mois</div>
          <div className="card-value">${stats.thisMonth.revenue.toLocaleString()}</div>
          <div className="card-meta">{stats.thisMonth.conversions} travaux gagnes</div>
        </div>

        <div className="card">
          <div className="card-label">Cette semaine</div>
          <div className="card-value">${stats.thisWeek.revenue.toLocaleString()}</div>
          <div className="card-meta">{stats.thisWeek.leads} nouveaux leads</div>
        </div>

        <div className="card">
          <div className="card-label">Taux de conversion</div>
          <div className="card-value">{conversionRate}%</div>
          <div className="card-meta">{stats.thisMonth.conversions} / {stats.thisMonth.leads} leads</div>
        </div>

        <div className="card">
          <div className="card-label">Valeur moyenne</div>
          <div className="card-value">${stats.thisMonth.avgDealSize.toFixed(0)}</div>
          <div className="card-meta">Par travail</div>
        </div>
      </section>

      {/* Leaderboard Rank */}
      <section className="card" style={{ marginTop: "24px" }}>
        <h3 className="card-title">Position au classement</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "12px" }}>
          <div style={{ fontSize: "48px", fontWeight: "bold", color: "var(--accent)" }}>
            #{stats.leaderboard.rank}
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>
              sur {stats.leaderboard.totalReps} representants
            </div>
            <div className="card-meta" style={{ marginTop: "4px" }}>
              {stats.leaderboard.percentageVsFirst > 0 && `+${stats.leaderboard.percentageVsFirst}% au-dessus du #1`}
              {stats.leaderboard.percentageVsFirst < 0 && `${stats.leaderboard.percentageVsFirst}% en dessous du #1`}
              {stats.leaderboard.percentageVsFirst === 0 && "Vous etes #1! 🎉"}
            </div>
            <div className="card-meta">
              {stats.leaderboard.percentageVsAverage > 0 && `+${stats.leaderboard.percentageVsAverage}% au-dessus de la moyenne`}
              {stats.leaderboard.percentageVsAverage < 0 && `${stats.leaderboard.percentageVsAverage}% sous la moyenne`}
              {stats.leaderboard.percentageVsAverage === 0 && "Dans la moyenne"}
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Visualization */}
      <section className="card" style={{ marginTop: "24px" }}>
        <h3 className="card-title">Pipeline des ventes</h3>
        <div className="card-meta" style={{ marginBottom: "16px" }}>
          Suivez vos leads par etape
        </div>

        <div className="pipeline-grid">
          {[
            { label: "Nouveau", count: stats.pipeline.new, color: "#64748b" },
            { label: "Contacte", count: stats.pipeline.contacted, color: "#3b82f6" },
            { label: "Estime", count: stats.pipeline.estimated, color: "#f59e0b" },
            { label: "Gagne", count: stats.pipeline.won, color: "#10b981" },
            { label: "Perdu", count: stats.pipeline.lost, color: "#ef4444" },
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
            Rappels de suivi
          </h3>
          <Link href="/sales/leads" className="button-ghost" style={{ padding: "8px 12px" }}>
            Tout voir
          </Link>
        </div>

        {stats.followUps.length === 0 && (
          <p className="card-meta">Aucun suivi planifie</p>
        )}

        <div className="list">
          {stats.followUps.slice(0, 5).map((followUp) => (
            <div key={followUp.lead_id} className="list-item">
                <div>
                  <strong>{followUp.customer_name}</strong>
                  <div className="card-meta">
                    Suivi: {new Date(followUp.follow_up_date).toLocaleDateString("fr-CA")}
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
