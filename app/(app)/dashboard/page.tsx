import KpiCard from "@/components/KpiCard";
import StatusBadge from "@/components/StatusBadge";
import TopBar from "@/components/TopBar";
import { getDashboardData } from "@/lib/queries";

export default async function DashboardPage() {
  const { kpis, revenueBars, scheduleToday } = await getDashboardData();

  return (
    <div className="page">
      <TopBar
        title="Dashboard"
        subtitle="Live operations overview"
        actions={
          <>
            <span className="pill">Live dispatch</span>
            <button className="button-secondary" type="button">
              Export
            </button>
            <button className="button-primary" type="button">
              New job
            </button>
          </>
        }
      />

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
    </div>
  );
}
