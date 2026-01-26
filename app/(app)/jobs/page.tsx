import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import JobForm from "@/components/forms/JobForm";
import { getJobs } from "@/lib/queries";

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <div className="page">
      <TopBar
        title="Jobs"
        subtitle="Active jobs and upcoming schedules"
        actions={<button className="button-primary" type="button">Create job</button>}
      />

      <div className="grid-2">
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Date</th>
                <th>Status</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>{job.customer}</td>
                  <td>{job.service}</td>
                  <td>{job.date}</td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td>{job.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 className="card-title">Create job</h3>
          <JobForm />
        </div>
      </div>
    </div>
  );
}
