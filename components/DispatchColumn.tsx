import StatusBadge from "./StatusBadge";
import type { DispatchColumn } from "@/lib/types";

type DispatchColumnProps = {
  column: DispatchColumn;
};

export default function DispatchColumn({ column }: DispatchColumnProps) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div className="card-label">Technician</div>
          <div style={{ fontWeight: 700 }}>{column.technician}</div>
        </div>
        <span className="tag">{column.jobs.length} jobs</span>
      </div>
      <div className="list">
        {column.jobs.map((job) => (
          <div className="list-item" key={job.id}>
            <div>
              <strong>{job.time}</strong>
              <div>{job.address}</div>
              <div className="card-meta">
                {job.service} · {job.price}
              </div>
            </div>
            <StatusBadge status={job.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
