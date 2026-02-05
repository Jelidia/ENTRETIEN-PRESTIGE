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

type DashboardPageProps = {
  searchParams?: { layout?: string };
};

const layoutOptions = [
  { key: "default", label: "Vue complète" },
  { key: "compact", label: "Vue compacte" },
  { key: "focus", label: "Vue horaire" },
] as const;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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

  const layout = layoutOptions.some((option) => option.key === searchParams?.layout)
    ? (searchParams?.layout as typeof layoutOptions[number]["key"])
    : "default";
  const showKpis = layout !== "focus";
  const showTrend = layout === "default";
  const showQuickActions = layout !== "compact";
  const scheduleCard = (
    <div className="card">
      <h3 className="card-title">Horaire du jour</h3>
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
  );
  const trendCard = (
    <div className="card">
      <h3 className="card-title">Tendance des revenus</h3>
      <div className="card-meta">30 derniers jours</div>
      <div className="chart" style={{ marginTop: 16 }}>
        {revenueBars.map((bar, index) => (
          <div key={index} className="chart-bar" style={{ height: `${bar}%` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="page">
      <TopBar
        title="Tableau de bord"
        subtitle="Vue d'ensemble des opérations"
        actions={
          errorDetails
            ? undefined
            : (
                <>
                  <div className="table-actions">
                    {layoutOptions.map((option) => (
                      <Link
                        key={option.key}
                        className={`pill pill-small${layout === option.key ? " pill-active" : ""}`}
                        href={option.key === "default" ? "/dashboard" : `/dashboard?layout=${option.key}`}
                        aria-current={layout === option.key ? "page" : undefined}
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                  <span className="pill">Répartition en direct</span>
                  <button className="button-secondary" type="button">
                    Exporter
                  </button>
                  <button className="button-primary" type="button">
                    Nouveau travail
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
          {showKpis ? (
            <section className="kpi-grid">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} {...kpi} />
              ))}
            </section>
          ) : null}

          {showTrend ? (
            <section className="grid-2">
              {trendCard}
              {scheduleCard}
            </section>
          ) : (
            <section>{scheduleCard}</section>
          )}

          {showQuickActions ? (
            <section className="card">
              <h3 className="card-title">Actions rapides</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <button className="button-secondary" type="button">
                  Répartir l'équipe
                </button>
                <button className="button-secondary" type="button">
                  Ajouter un client
                </button>
                <button className="button-secondary" type="button">
                  Créer une estimation
                </button>
                <button className="button-secondary" type="button">
                  Exporter un rapport
                </button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
