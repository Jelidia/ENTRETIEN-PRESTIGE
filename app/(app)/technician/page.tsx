import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { getTechnicianSchedule } from "@/lib/queries";

export default async function TechnicianPage() {
  const jobs = await getTechnicianSchedule();

  return (
    <div className="page">
      <TopBar title="Technician" subtitle="Mobile schedule view" />

      <div className="card" style={{ maxWidth: 420 }}>
        <div className="card-title">Today jobs</div>
        <div className="list" style={{ marginTop: 12 }}>
          {jobs.map((job) => (
            <div className="list-item" key={job.id}>
              <div>
                <strong>{job.time}</strong>
                <div>{job.customer}</div>
                <div className="card-meta">{job.address}</div>
                <div className="card-meta">{job.service}</div>
              </div>
              <StatusBadge status={job.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
