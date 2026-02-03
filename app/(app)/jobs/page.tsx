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
  const [actionForm, setActionForm] = useState({ jobId: "", action: "complete" });
  const [upsellForm, setUpsellForm] = useState({ jobId: "", upsells: "[]", actualRevenue: "" });
  const [assignStatus, setAssignStatus] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [upsellStatus, setUpsellStatus] = useState("");

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

  async function submitAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionStatus("");
    const response = await fetch(`/api/jobs/${actionForm.jobId}/${actionForm.action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setActionStatus(json.error ?? "Unable to update job");
      return;
    }
    setActionStatus(`Job ${actionForm.action} updated.`);
    setActionForm({ jobId: "", action: "complete" });
    void loadJobs();
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  async function submitUpsell(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUpsellStatus("");
    let upsells: Record<string, unknown>[] = [];
    try {
      const parsed = JSON.parse(upsellForm.upsells) as unknown;
      if (!Array.isArray(parsed) || !parsed.every(isRecord)) {
        setUpsellStatus("Upsells JSON is invalid.");
        return;
      }
      upsells = parsed;
    } catch (error) {
      setUpsellStatus("Upsells JSON is invalid.");
      return;
    }
    const response = await fetch(`/api/jobs/${upsellForm.jobId}/upsell`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upsells,
        actualRevenue: Number(upsellForm.actualRevenue || 0),
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setUpsellStatus(json.error ?? "Unable to save upsell");
      return;
    }
    setUpsellStatus("Upsell recorded.");
    setUpsellForm({ jobId: "", upsells: "[]", actualRevenue: "" });
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
          <table className="table table-desktop">
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
          <div className="card-list-mobile" style={{ marginTop: 12 }}>
            {jobs.map((job) => (
              <div className="mobile-card" key={job.job_id}>
                <div className="mobile-card-title">Job #{job.job_id}</div>
                <div className="mobile-card-meta">{job.service_type}</div>
                <div className="mobile-card-meta">{job.scheduled_date ?? ""}</div>
                <div className="table-actions">
                  <StatusBadge status={job.status} />
                  <span className="tag">{job.estimated_revenue ? `$${job.estimated_revenue}` : ""}</span>
                </div>
              </div>
            ))}
          </div>
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
          <div className="card">
            <h3 className="card-title">Job actions</h3>
            <form className="form-grid" onSubmit={submitAction}>
              <div className="form-row">
                <label className="label" htmlFor="actionJob">Job ID</label>
                <input
                  id="actionJob"
                  className="input"
                  value={actionForm.jobId}
                  onChange={(event) => setActionForm({ ...actionForm, jobId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="actionType">Action</label>
                <select
                  id="actionType"
                  className="select"
                  value={actionForm.action}
                  onChange={(event) => setActionForm({ ...actionForm, action: event.target.value })}
                >
                  <option value="complete">Complete</option>
                  <option value="no-show">No show</option>
                </select>
              </div>
              <button className="button-secondary" type="submit">Apply action</button>
              {actionStatus ? <div className="hint">{actionStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Upsell</h3>
            <form className="form-grid" onSubmit={submitUpsell}>
              <div className="form-row">
                <label className="label" htmlFor="upsellJob">Job ID</label>
                <input
                  id="upsellJob"
                  className="input"
                  value={upsellForm.jobId}
                  onChange={(event) => setUpsellForm({ ...upsellForm, jobId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="upsellItems">Upsells JSON</label>
                <textarea
                  id="upsellItems"
                  className="textarea"
                  value={upsellForm.upsells}
                  onChange={(event) => setUpsellForm({ ...upsellForm, upsells: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="upsellRevenue">Actual revenue</label>
                <input
                  id="upsellRevenue"
                  className="input"
                  type="number"
                  value={upsellForm.actualRevenue}
                  onChange={(event) => setUpsellForm({ ...upsellForm, actualRevenue: event.target.value })}
                />
              </div>
              <button className="button-ghost" type="submit">Record upsell</button>
              {upsellStatus ? <div className="hint">{upsellStatus}</div> : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
