import KpiCard from "@/components/KpiCard";
import TopBar from "@/components/TopBar";
import { getReportSummary } from "@/lib/queries";

export default async function ReportsPage() {
  const summary = await getReportSummary();

  return (
    <div className="page">
      <TopBar
        title="Reports"
        subtitle="Performance, revenue, and quality signals"
        actions={<button className="button-secondary" type="button">Download PDF</button>}
      />

      <section className="kpi-grid">
        {summary.kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="card">
        <h3 className="card-title">Monthly revenue</h3>
        <div className="chart" style={{ marginTop: 16 }}>
          {summary.revenueBars.map((bar, index) => (
            <div key={index} className="chart-bar" style={{ height: `${bar}%` }} />
          ))}
        </div>
      </section>
    </div>
  );
}
