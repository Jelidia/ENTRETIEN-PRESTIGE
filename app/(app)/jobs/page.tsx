"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import JobForm from "@/components/forms/JobForm";
import { useEffect, useState } from "react";

type JobRow = {
  job_id: string;
  service_type: string;
  status: string;
  scheduled_date?: string;
  estimated_revenue?: number;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [assignForm, setAssignForm] = useState({ jobId: "", technicianId: "" });
  const [statusForm, setStatusForm] = useState({ jobId: "", status: "confirmed" });
  const [assignStatus, setAssignStatus] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");

  useEffect(() => {
    void loadJobs();
  }, []);

  async function loadJobs() {
    const response = await fetch("/api/jobs");
    const json = await response.json().catch(() => ({ data: [] }));
    setJobs(json.data ?? []);
  }

  async function submitAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAssignStatus("");
    const response = await fetch(`/api/jobs/${assignForm.jobId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicianId: assignForm.technicianId }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAssignStatus(json.error ?? "Unable to assign job");
      return;
    }
    setAssignStatus("Job assigned.");
    setAssignForm({ jobId: "", technicianId: "" });
    void loadJobs();
  }

  async function submitStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUpdateStatus("");
    const response = await fetch(`/api/jobs/${statusForm.jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusForm.status }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setUpdateStatus(json.error ?? "Unable to update status");
      return;
    }
    setUpdateStatus("Status updated.");
    setStatusForm({ jobId: "", status: "confirmed" });
    void loadJobs();
  }

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
                <th>Service</th>
                <th>Date</th>
                <th>Status</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.job_id}>
                  <td>{job.job_id}</td>
                  <td>{job.service_type}</td>
                  <td>{job.scheduled_date ?? ""}</td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td>{job.estimated_revenue ? `$${job.estimated_revenue}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="stack">
          <div className="card">
            <h3 className="card-title">Create job</h3>
            <JobForm />
          </div>
          <div className="card">
            <h3 className="card-title">Assign technician</h3>
            <form className="form-grid" onSubmit={submitAssign}>
              <div className="form-row">
                <label className="label" htmlFor="assignJob">Job ID</label>
                <input
                  id="assignJob"
                  className="input"
                  value={assignForm.jobId}
                  onChange={(event) => setAssignForm({ ...assignForm, jobId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="assignTech">Technician ID</label>
                <input
                  id="assignTech"
                  className="input"
                  value={assignForm.technicianId}
                  onChange={(event) => setAssignForm({ ...assignForm, technicianId: event.target.value })}
                  required
                />
              </div>
              <button className="button-primary" type="submit">Assign job</button>
              {assignStatus ? <div className="hint">{assignStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Update status</h3>
            <form className="form-grid" onSubmit={submitStatus}>
              <div className="form-row">
                <label className="label" htmlFor="statusJob">Job ID</label>
                <input
                  id="statusJob"
                  className="input"
                  value={statusForm.jobId}
                  onChange={(event) => setStatusForm({ ...statusForm, jobId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="statusValue">Status</label>
                <select
                  id="statusValue"
                  className="select"
                  value={statusForm.status}
                  onChange={(event) => setStatusForm({ ...statusForm, status: event.target.value })}
                >
                  <option value="created">Created</option>
                  <option value="quoted">Quoted</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No show</option>
                </select>
              </div>
              <button className="button-primary" type="submit">Update status</button>
              {updateStatus ? <div className="hint">{updateStatus}</div> : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
