"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import JobForm from "@/components/forms/JobForm";
import { normalizePhoneE164 } from "@/lib/smsTemplates";
import { useEffect, useMemo, useRef, useState } from "react";

type JobRow = {
  job_id: string;
  service_type: string;
  service_package?: string | null;
  status: string;
  scheduled_date?: string;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  description?: string | null;
  estimated_revenue?: number;
  actual_revenue?: number | null;
  customer_id?: string | null;
  customer?: { phone?: string | null } | null;
};

type TechnicianRow = {
  user_id: string;
  full_name: string;
  role: string;
};

type JobPrefill = {
  token: string;
  data: {
    customerId?: string;
    serviceType?: string;
    servicePackage?: string;
    scheduledDate?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    estimatedRevenue?: string;
    description?: string;
  };
};

const normalizePhone = (value?: string | null) => (value ? value.replace(/\s+/g, "") : "");

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianRow[]>([]);
  const [jobLimit, setJobLimit] = useState(50);
  const [techLimit, setTechLimit] = useState(50);
  const [clonePrefill, setClonePrefill] = useState<JobPrefill | null>(null);
  const formCardRef = useRef<HTMLDivElement | null>(null);
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
    void loadTechnicians();
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

  async function loadTechnicians() {
    const response = await fetch("/api/users");
    const json = await response.json().catch(() => ({ data: [] }));
    const data = Array.isArray(json.data) ? json.data : [];
    setTechnicians(data.filter((user: TechnicianRow) => user.role === "technician"));
  }

  function handleClone(job: JobRow) {
    const revenue = job.actual_revenue ?? job.estimated_revenue;
    setClonePrefill({
      token: `${job.job_id}-${Date.now()}`,
      data: {
        customerId: job.customer_id ?? "",
        serviceType: job.service_type ?? "",
        servicePackage: job.service_package ?? "",
        scheduledDate: "",
        scheduledStartTime: "",
        scheduledEndTime: "",
        address: job.address ?? "",
        city: job.city ?? "",
        postalCode: job.postal_code ?? "",
        estimatedRevenue: revenue !== null && revenue !== undefined ? String(revenue) : "",
        description: job.description ?? "",
      },
    });
    requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const selectedCount = selectedJobs.size;
  const allSelected = jobs.length > 0 && selectedCount === jobs.length;
  const selectedRows = useMemo(
    () => jobs.filter((job) => selectedJobs.has(job.job_id)),
    [jobs, selectedJobs]
  );
  const visibleJobs = useMemo(() => jobs.slice(0, jobLimit), [jobs, jobLimit]);
  const visibleTechnicians = useMemo(
    () => technicians.slice(0, techLimit),
    [technicians, techLimit]
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
      setAssignStatus(json.error ?? "Impossible d'assigner le travail");
      return;
    }
    setAssignStatus("Travail assigné.");
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
      setUpdateStatus(json.error ?? "Impossible de mettre à jour le statut");
      return;
    }
    setUpdateStatus("Statut mis à jour.");
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
      setActionStatus(json.error ?? "Impossible de mettre à jour le travail");
      return;
    }
    setActionStatus("Action appliquée au travail.");
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
        setUpsellStatus("JSON des ajouts de service invalide.");
        return;
      }
      upsells = parsed;
    } catch (error) {
      setUpsellStatus("JSON des ajouts de service invalide.");
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
      setUpsellStatus(json.error ?? "Impossible d'enregistrer l'ajout de service");
      return;
    }
    setUpsellStatus("Ajout de service enregistré.");
    setUpsellForm({ jobId: "", upsells: "[]", actualRevenue: "" });
    void loadJobs();
  }

  return (
    <div className="page">
      <TopBar
        title="Travaux"
        subtitle="Travaux actifs et horaires à venir"
        actions={<button className="button-primary" type="button">Créer un travail</button>}
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
                <th>Travail</th>
                <th>Service</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Revenu</th>
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
                      <div className="table-actions">
                        <button className="button-ghost" type="button" onClick={() => handleClone(job)}>
                          Dupliquer
                        </button>
                        {phoneHref ? (
                          <>
                            <a className="button-ghost" href={`tel:${phoneHref}`}>Appeler</a>
                            <a className="button-ghost" href={`sms:${phoneHref}`}>SMS</a>
                          </>
                        ) : null}
                      </div>
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
                  <div className="mobile-card-title">Travail #{job.job_id}</div>
                  <div className="mobile-card-meta">{job.service_type}</div>
                  <div className="mobile-card-meta">{job.scheduled_date ?? ""}</div>
                  {phone ? <div className="mobile-card-meta">{phone}</div> : null}
                  <div className="table-actions">
                    <StatusBadge status={job.status} />
                    <span className="tag">{job.estimated_revenue ? `$${job.estimated_revenue}` : ""}</span>
                  </div>
                  <div className="table-actions">
                    <button className="button-ghost" type="button" onClick={() => handleClone(job)}>
                      Dupliquer
                    </button>
                    {phoneHref ? (
                      <>
                        <a className="button-ghost" href={`tel:${phoneHref}`}>Appeler</a>
                        <a className="button-ghost" href={`sms:${phoneHref}`}>SMS</a>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="stack">
          <div className="card" ref={formCardRef}>
            <h3 className="card-title">Créer un travail</h3>
            <JobForm prefill={clonePrefill?.data ?? null} prefillToken={clonePrefill?.token ?? null} />
          </div>
          <div className="card">
            <h3 className="card-title">Assigner un technicien</h3>
            <form className="form-grid" onSubmit={submitAssign}>
              <div className="form-row">
                <label className="label" htmlFor="assignJob">ID du travail</label>
                <input
                  id="assignJob"
                  className="input"
                  list="jobs-picker"
                  value={assignForm.jobId}
                  onChange={(event) => setAssignForm({ ...assignForm, jobId: event.target.value })}
                  required
                />
                <datalist id="jobs-picker">
                  {visibleJobs.map((job) => {
                    const meta = [job.service_type, job.scheduled_date].filter(Boolean).join(" · ");
                    return (
                      <option
                        key={job.job_id}
                        value={job.job_id}
                        label={meta || job.job_id}
                      />
                    );
                  })}
                </datalist>
                {jobs.length > jobLimit ? (
                  <button
                    className="button-ghost"
                    type="button"
                    onClick={() => setJobLimit((prev) => prev + 50)}
                  >
                    Afficher plus de travaux
                  </button>
                ) : null}
              </div>
              <div className="form-row">
                <label className="label" htmlFor="assignTech">ID du technicien</label>
                <input
                  id="assignTech"
                  className="input"
                  list="tech-picker"
                  value={assignForm.technicianId}
                  onChange={(event) => setAssignForm({ ...assignForm, technicianId: event.target.value })}
                  required
                />
                <datalist id="tech-picker">
                  {visibleTechnicians.map((tech) => (
                    <option
                      key={tech.user_id}
                      value={tech.user_id}
                      label={tech.full_name || tech.user_id}
                    />
                  ))}
                </datalist>
                {technicians.length > techLimit ? (
                  <button
                    className="button-ghost"
                    type="button"
                    onClick={() => setTechLimit((prev) => prev + 50)}
                  >
                    Afficher plus de techniciens
                  </button>
                ) : null}
              </div>
              <button className="button-primary" type="submit">Assigner le travail</button>
              {assignStatus ? <div className="hint">{assignStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Mettre à jour le statut</h3>
            <form className="form-grid" onSubmit={submitStatus}>
              <div className="form-row">
                <label className="label" htmlFor="statusJob">ID du travail</label>
                <input
                  id="statusJob"
                  className="input"
                  list="jobs-picker"
                  value={statusForm.jobId}
                  onChange={(event) => setStatusForm({ ...statusForm, jobId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="statusValue">Statut</label>
                <select
                  id="statusValue"
                  className="select"
                  value={statusForm.status}
                  onChange={(event) => setStatusForm({ ...statusForm, status: event.target.value })}
                >
                  <option value="created">Créé</option>
                  <option value="quoted">Proposé</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="dispatched">Assigné</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="no_show">Absence</option>
                </select>
              </div>
              <button className="button-primary" type="submit">Mettre à jour</button>
              {updateStatus ? <div className="hint">{updateStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Actions sur travail</h3>
            <form className="form-grid" onSubmit={submitAction}>
              <div className="form-row">
                <label className="label" htmlFor="actionJob">ID du travail</label>
                <input
                  id="actionJob"
                  className="input"
                  list="jobs-picker"
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
                  <option value="complete">Terminer</option>
                  <option value="no-show">Absence</option>
                </select>
              </div>
              <button className="button-secondary" type="submit">Appliquer</button>
              {actionStatus ? <div className="hint">{actionStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Ajout de service</h3>
            <form className="form-grid" onSubmit={submitUpsell}>
              <div className="form-row">
                <label className="label" htmlFor="upsellJob">ID du travail</label>
                <input
                  id="upsellJob"
                  className="input"
                  list="jobs-picker"
                  value={upsellForm.jobId}
                  onChange={(event) => setUpsellForm({ ...upsellForm, jobId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="upsellItems">Ajouts de service (JSON)</label>
                <textarea
                  id="upsellItems"
                  className="textarea"
                  value={upsellForm.upsells}
                  onChange={(event) => setUpsellForm({ ...upsellForm, upsells: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="upsellRevenue">Revenu réel</label>
                <input
                  id="upsellRevenue"
                  className="input"
                  type="number"
                  value={upsellForm.actualRevenue}
                  onChange={(event) => setUpsellForm({ ...upsellForm, actualRevenue: event.target.value })}
                />
              </div>
              <button className="button-ghost" type="submit">Enregistrer l'ajout</button>
              {upsellStatus ? <div className="hint">{upsellStatus}</div> : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
