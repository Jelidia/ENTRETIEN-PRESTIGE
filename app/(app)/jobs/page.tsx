"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import JobForm from "@/components/forms/JobForm";
import { normalizePhoneE164 } from "@/lib/smsTemplates";
import { useEffect, useMemo, useState } from "react";

type JobRow = {
  job_id: string;
  service_type: string;
  status: string;
  scheduled_date?: string;
  estimated_revenue?: number;
  customer?: { phone?: string | null } | null;
};

const normalizePhone = (value?: string | null) => (value ? value.replace(/\s+/g, "") : "");

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
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    void loadJobs();
  }, []);

  async function loadJobs() {
    const response = await fetch("/api/jobs");
    const json = await response.json().catch(() => ({ data: [] }));
    const data = Array.isArray(json.data) ? json.data : [];
    setJobs(data);
    setSelectedJobs((prev) => {
      if (!prev.size) return prev;
      const validIds = new Set(data.map((job: JobRow) => job.job_id));
      return new Set(Array.from(prev).filter((id) => validIds.has(id)));
    });
  }

  const selectedCount = selectedJobs.size;
  const allSelected = jobs.length > 0 && selectedCount === jobs.length;
  const selectedRows = useMemo(
    () => jobs.filter((job) => selectedJobs.has(job.job_id)),
    [jobs, selectedJobs]
  );

  function toggleJobSelection(jobId: string) {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }

  function toggleAllJobs() {
    setSelectedJobs((prev) => {
      if (jobs.length === 0) return prev;
      if (prev.size === jobs.length) return new Set();
      return new Set(jobs.map((job) => job.job_id));
    });
  }

  async function bulkUpdateStatus(nextStatus: string) {
    if (!selectedCount) {
      setBulkStatus("Aucun travail sélectionné.");
      return;
    }
    setBulkLoading(true);
    setBulkStatus("");
    let successCount = 0;
    await Promise.all(
      Array.from(selectedJobs).map(async (jobId) => {
        try {
          const res = await fetch(`/api/jobs/${jobId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
          });
          if (res.ok) {
            successCount += 1;
          }
        } catch {
          return null;
        }
        return null;
      })
    );
    setBulkStatus(
      successCount === selectedCount
        ? `Statut mis à jour pour ${successCount} travaux.`
        : `Statut mis à jour pour ${successCount}/${selectedCount} travaux.`
    );
    setBulkLoading(false);
    setSelectedJobs(new Set());
    void loadJobs();
  }

  async function bulkSendSms() {
    if (!selectedCount) {
      setBulkStatus("Aucun travail sélectionné.");
      return;
    }
    if (!bulkMessage.trim()) {
      setBulkStatus("Ajoutez un message SMS.");
      return;
    }
    const targets = selectedRows
      .map((job) => ({
        jobId: job.job_id,
        phone: normalizePhoneE164(job.customer?.phone ?? ""),
      }))
      .filter((target) => Boolean(target.phone)) as Array<{ jobId: string; phone: string }>;
    const invalidCount = selectedRows.length - targets.length;
    if (!targets.length) {
      setBulkStatus("Aucun numéro valide pour l'envoi.");
      return;
    }
    setBulkLoading(true);
    setBulkStatus("");
    let successCount = 0;
    await Promise.all(
      targets.map(async (target) => {
        try {
          const res = await fetch("/api/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: target.phone, message: bulkMessage.trim() }),
          });
          if (res.ok) {
            successCount += 1;
          }
        } catch {
          return null;
        }
        return null;
      })
    );
    const suffix = invalidCount ? ` · ${invalidCount} sans numéro valide.` : "";
    setBulkStatus(
      successCount === targets.length
        ? `SMS envoyés à ${successCount} clients.${suffix}`
        : `SMS envoyés: ${successCount}/${targets.length}.${suffix}`
    );
    setBulkLoading(false);
  }

  async function bulkArchiveJobs() {
    if (!selectedCount) {
      setBulkStatus("Aucun travail sélectionné.");
      return;
    }
    setBulkLoading(true);
    setBulkStatus("");
    let successCount = 0;
    await Promise.all(
      Array.from(selectedJobs).map(async (jobId) => {
        try {
          const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
          if (res.ok) {
            successCount += 1;
          }
        } catch {
          return null;
        }
        return null;
      })
    );
    setBulkStatus(
      successCount === selectedCount
        ? `Travaux archivés (${successCount}).`
        : `Travaux archivés: ${successCount}/${selectedCount}.`
    );
    setBulkLoading(false);
    setSelectedJobs(new Set());
    void loadJobs();
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
          <div className="table-actions" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAllJobs}
                disabled={bulkLoading || jobs.length === 0}
                aria-label="Tout sélectionner"
              />
              <span className="card-meta">Tout sélectionner</span>
            </label>
            {selectedCount ? <span className="tag">{selectedCount} sélectionnés</span> : null}
          </div>
          {selectedCount ? (
            <div className="stack" style={{ marginBottom: 12 }}>
              <div className="table-actions" style={{ flexWrap: "wrap" }}>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => bulkUpdateStatus("confirmed")}
                  disabled={bulkLoading}
                >
                  Approuver
                </button>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={bulkSendSms}
                  disabled={bulkLoading}
                >
                  Envoyer SMS
                </button>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={bulkArchiveJobs}
                  disabled={bulkLoading}
                >
                  Archiver
                </button>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="bulkSms">Message SMS (collectif)</label>
                <textarea
                  id="bulkSms"
                  className="textarea"
                  value={bulkMessage}
                  onChange={(event) => setBulkMessage(event.target.value)}
                  rows={2}
                  placeholder="Ex. Votre rendez-vous est confirmé."
                  disabled={bulkLoading}
                />
              </div>
              {bulkStatus ? <div className="hint">{bulkStatus}</div> : null}
            </div>
          ) : null}
          <table className="table table-desktop">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAllJobs}
                    disabled={bulkLoading || jobs.length === 0}
                    aria-label="Tout sélectionner"
                  />
                </th>
                <th>Job</th>
                <th>Service</th>
                <th>Date</th>
                <th>Status</th>
                <th>Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const phone = job.customer?.phone ?? "";
                const phoneHref = normalizePhone(phone);
                return (
                  <tr key={job.job_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedJobs.has(job.job_id)}
                        onChange={() => toggleJobSelection(job.job_id)}
                        disabled={bulkLoading}
                        aria-label={`Sélectionner le travail ${job.job_id}`}
                      />
                    </td>
                    <td>{job.job_id}</td>
                    <td>{job.service_type}</td>
                    <td>{job.scheduled_date ?? ""}</td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td>{job.estimated_revenue ? `$${job.estimated_revenue}` : ""}</td>
                    <td>
                      {phoneHref ? (
                        <div className="table-actions">
                          <a className="button-ghost" href={`tel:${phoneHref}`}>Appeler</a>
                          <a className="button-ghost" href={`sms:${phoneHref}`}>SMS</a>
                        </div>
                      ) : (
                        <span className="card-meta">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="card-list-mobile" style={{ marginTop: 12 }}>
            {jobs.map((job) => {
              const phone = job.customer?.phone ?? "";
              const phoneHref = normalizePhone(phone);
              return (
                <div className="mobile-card" key={job.job_id}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedJobs.has(job.job_id)}
                      onChange={() => toggleJobSelection(job.job_id)}
                      disabled={bulkLoading}
                      aria-label={`Sélectionner le travail ${job.job_id}`}
                    />
                    <span className="card-meta">Sélectionner</span>
                  </label>
                  <div className="mobile-card-title">Job #{job.job_id}</div>
                  <div className="mobile-card-meta">{job.service_type}</div>
                  <div className="mobile-card-meta">{job.scheduled_date ?? ""}</div>
                  {phone ? <div className="mobile-card-meta">{phone}</div> : null}
                  <div className="table-actions">
                    <StatusBadge status={job.status} />
                    <span className="tag">{job.estimated_revenue ? `$${job.estimated_revenue}` : ""}</span>
                  </div>
                  {phoneHref ? (
                    <div className="table-actions">
                      <a className="button-ghost" href={`tel:${phoneHref}`}>Appeler</a>
                      <a className="button-ghost" href={`sms:${phoneHref}`}>SMS</a>
                    </div>
                  ) : null}
                </div>
              );
            })}
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
