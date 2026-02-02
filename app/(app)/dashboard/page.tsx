import KpiCard from "@/components/KpiCard";
import Link from "next/link";
import { headers } from "next/headers";
import StatusBadge from "@/components/StatusBadge";
import TopBar from "@/components/TopBar";
import { getDashboardData } from "@/lib/queries";
import { REQUEST_ID_HEADER } from "@/lib/requestId";
import { getAccessTokenFromCookies } from "@/lib/session";
import { createUserClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getDefaultDashboard } from "@/lib/types";

export default async function DashboardPage() {
  const requestId = headers().get(REQUEST_ID_HEADER) ?? undefined;

  // Check user role and redirect if not admin/manager
  const token = getAccessTokenFromCookies();
  if (token) {
    const client = createUserClient(token);
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (profile && profile.role !== "admin" && profile.role !== "manager") {
        redirect(getDefaultDashboard(profile.role));
      }
    }
  }

  const { kpis, revenueBars, scheduleToday, error } = await getDashboardData({ requestId });
  const errorDetails =
    error === "session_expired"
      ? {
          title: "Session expirée",
          message: "Votre session a expiré. Veuillez vous reconnecter pour continuer.",
          actionHref: "/login?message=session-expired",
          actionLabel: "Se reconnecter",
        }
      : error === "missing_profile"
      ? {
          title: "Profil introuvable",
          message: "Impossible de charger votre profil. Veuillez contacter un gestionnaire.",
        }
      : error === "load_failed"
      ? {
          title: "Données indisponibles",
          message: "Impossible de charger le tableau de bord. Réessayez dans quelques minutes.",
        }
      : null;

  return (
    <div className="page">
      <TopBar
        title="Dashboard"
        subtitle="Live operations overview"
        actions={
          errorDetails
            ? undefined
            : (
                <>
                  <span className="pill">Live dispatch</span>
                  <button className="button-secondary" type="button">
                    Export
                  </button>
                  <button className="button-primary" type="button">
                    New job
                  </button>
                </>
              )
        }
      />

      {errorDetails ? (
        <section className="card" style={{ marginTop: 24 }}>
          <h3 className="card-title">{errorDetails.title}</h3>
          <div className="card-meta" style={{ marginTop: 8 }}>
            {errorDetails.message}
          </div>
          {errorDetails.actionHref ? (
            <Link
              className="button-primary"
              href={errorDetails.actionHref}
              style={{ marginTop: 16, display: "inline-flex" }}
            >
              {errorDetails.actionLabel}
            </Link>
          ) : null}
        </section>
      ) : (
        <>
          <section className="kpi-grid">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </section>

          <section className="grid-2">
            <div className="card">
              <h3 className="card-title">Revenue trend</h3>
              <div className="card-meta">Last 30 days</div>
              <div className="chart" style={{ marginTop: 16 }}>
                {revenueBars.map((bar, index) => (
                  <div key={index} className="chart-bar" style={{ height: `${bar}%` }} />
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="card-title">Today schedule</h3>
              <div className="list" style={{ marginTop: 12 }}>
                {scheduleToday.map((item) => (
                  <div className="list-item" key={item.id}>
                    <div>
                      <strong>{item.time}</strong>
                      <div>{item.customer}</div>
                      <div className="card-meta">
                        {item.service} · {item.revenue}
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="card-title">Quick actions</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button className="button-secondary" type="button">
                Dispatch crew
              </button>
              <button className="button-secondary" type="button">
                Add customer
              </button>
              <button className="button-secondary" type="button">
                Build estimate
              </button>
              <button className="button-secondary" type="button">
                Export report
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
