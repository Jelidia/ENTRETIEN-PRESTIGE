import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { getIncidents, getQualityIssues } from "@/lib/queries";

export default async function OperationsPage() {
  const incidents = await getIncidents();
  const qualityIssues = await getQualityIssues();

  return (
    <div className="page">
      <TopBar
        title="Operations"
        subtitle="Quality control and incident tracking"
        actions={<button className="button-secondary" type="button">Log incident</button>}
      />

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Incidents</h3>
          <div className="list" style={{ marginTop: 12 }}>
            {incidents.map((incident) => (
              <div className="list-item" key={incident.id}>
                <div>
                  <strong>{incident.title}</strong>
                  <div className="card-meta">{incident.detail}</div>
                </div>
                <StatusBadge status={incident.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Quality issues</h3>
          <div className="list" style={{ marginTop: 12 }}>
            {qualityIssues.map((issue) => (
              <div className="list-item" key={issue.id}>
                <div>
                  <strong>{issue.title}</strong>
                  <div className="card-meta">{issue.detail}</div>
                </div>
                <StatusBadge status={issue.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
