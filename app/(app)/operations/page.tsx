"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { useEffect, useState } from "react";

type IncidentRow = {
  incident_id: string;
  description: string;
  severity: string;
  status: string;
};

type QualityRow = {
  issue_id: string;
  description: string;
  severity: string;
  status: string;
};

type ChecklistRow = {
  checklist_id: string;
  technician_id: string;
  work_date: string;
  shift_status: string;
};

export default function OperationsPage() {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [qualityIssues, setQualityIssues] = useState<QualityRow[]>([]);
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [incidentStatus, setIncidentStatus] = useState("");
  const [qualityStatus, setQualityStatus] = useState("");
  const [checklistStatus, setChecklistStatus] = useState("");
  const [incidentForm, setIncidentForm] = useState({
    jobId: "",
    technicianId: "",
    description: "",
    incidentType: "property_damage",
    severity: "moderate",
    estimatedCost: "",
  });
  const [qualityForm, setQualityForm] = useState({
    jobId: "",
    customerId: "",
    complaintType: "cleanliness",
    description: "",
    severity: "major",
  });
  const [checklistForm, setChecklistForm] = useState({
    technicianId: "",
    workDate: "",
    startItems: "Ladder, Supplies, PPE",
    endItems: "Vehicle clean, Tools stored",
    shiftStatus: "pending",
  });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const [incidentsRes, qualityRes, checklistsRes] = await Promise.all([
      fetch("/api/reports/incidents"),
      fetch("/api/reports/quality-issues"),
      fetch("/api/reports/checklists"),
    ]);
    const incidentsJson = await incidentsRes.json().catch(() => ({ data: [] }));
    const qualityJson = await qualityRes.json().catch(() => ({ data: [] }));
    const checklistJson = await checklistsRes.json().catch(() => ({ data: [] }));
    setIncidents(incidentsJson.data ?? []);
    setQualityIssues(qualityJson.data ?? []);
    setChecklists(checklistJson.data ?? []);
  }

  async function submitIncident(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIncidentStatus("");
    const response = await fetch("/api/reports/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: incidentForm.jobId || undefined,
        technicianId: incidentForm.technicianId || undefined,
        description: incidentForm.description,
        incidentType: incidentForm.incidentType,
        severity: incidentForm.severity,
        estimatedCost: incidentForm.estimatedCost ? Number(incidentForm.estimatedCost) : undefined,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setIncidentStatus(json.error ?? "Unable to log incident");
      return;
    }
    setIncidentStatus("Incident logged.");
    setIncidentForm({
      jobId: "",
      technicianId: "",
      description: "",
      incidentType: "property_damage",
      severity: "moderate",
      estimatedCost: "",
    });
    void loadData();
  }

  async function submitQuality(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQualityStatus("");
    const response = await fetch("/api/reports/quality-issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(qualityForm),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setQualityStatus(json.error ?? "Unable to log issue");
      return;
    }
    setQualityStatus("Quality issue logged.");
    setQualityForm({ jobId: "", customerId: "", complaintType: "cleanliness", description: "", severity: "major" });
    void loadData();
  }

  async function submitChecklist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecklistStatus("");
    const startItems = checklistForm.startItems
      .split(",")
      .map((item) => ({ item: item.trim(), status: "ok" }))
      .filter((item) => item.item);
    const endItems = checklistForm.endItems
      .split(",")
      .map((item) => ({ item: item.trim(), status: "ok" }))
      .filter((item) => item.item);
    const response = await fetch("/api/reports/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        technicianId: checklistForm.technicianId,
        workDate: checklistForm.workDate,
        startItems,
        endItems,
        shiftStatus: checklistForm.shiftStatus,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setChecklistStatus(json.error ?? "Unable to save checklist");
      return;
    }
    setChecklistStatus("Checklist saved.");
    setChecklistForm({
      technicianId: "",
      workDate: "",
      startItems: "Ladder, Supplies, PPE",
      endItems: "Vehicle clean, Tools stored",
      shiftStatus: "pending",
    });
    void loadData();
  }

  return (
    <div className="page">
      <TopBar
        title="Operations"
        subtitle="Quality control, incidents, and shift readiness"
        actions={<span className="pill">Safety first</span>}
      />

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Incidents</h3>
          <div className="list" style={{ marginTop: 12 }}>
            {incidents.map((incident) => (
              <div className="list-item" key={incident.incident_id}>
                <div>
                  <strong>{incident.description}</strong>
                  <div className="card-meta">Severity: {incident.severity}</div>
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
              <div className="list-item" key={issue.issue_id}>
                <div>
                  <strong>{issue.description}</strong>
                  <div className="card-meta">Severity: {issue.severity}</div>
                </div>
                <StatusBadge status={issue.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <h3 className="card-title">Log incident</h3>
          <form className="form-grid" onSubmit={submitIncident}>
            <div className="form-row">
              <label className="label" htmlFor="incidentJob">Job ID</label>
              <input
                id="incidentJob"
                className="input"
                value={incidentForm.jobId}
                onChange={(event) => setIncidentForm({ ...incidentForm, jobId: event.target.value })}
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="incidentTech">Technician ID</label>
              <input
                id="incidentTech"
                className="input"
                value={incidentForm.technicianId}
                onChange={(event) => setIncidentForm({ ...incidentForm, technicianId: event.target.value })}
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="incidentDesc">Description</label>
              <textarea
                id="incidentDesc"
                className="textarea"
                value={incidentForm.description}
                onChange={(event) => setIncidentForm({ ...incidentForm, description: event.target.value })}
                required
              />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="incidentType">Type</label>
                <select
                  id="incidentType"
                  className="select"
                  value={incidentForm.incidentType}
                  onChange={(event) => setIncidentForm({ ...incidentForm, incidentType: event.target.value })}
                >
                  <option value="property_damage">Property damage</option>
                  <option value="injury">Injury</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="incidentSeverity">Severity</label>
                <select
                  id="incidentSeverity"
                  className="select"
                  value={incidentForm.severity}
                  onChange={(event) => setIncidentForm({ ...incidentForm, severity: event.target.value })}
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="incidentCost">Estimated cost</label>
              <input
                id="incidentCost"
                className="input"
                type="number"
                value={incidentForm.estimatedCost}
                onChange={(event) => setIncidentForm({ ...incidentForm, estimatedCost: event.target.value })}
              />
            </div>
            <button className="button-primary" type="submit">Save incident</button>
            {incidentStatus ? <div className="hint">{incidentStatus}</div> : null}
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Log quality issue</h3>
          <form className="form-grid" onSubmit={submitQuality}>
            <div className="form-row">
              <label className="label" htmlFor="qualityJob">Job ID</label>
              <input
                id="qualityJob"
                className="input"
                value={qualityForm.jobId}
                onChange={(event) => setQualityForm({ ...qualityForm, jobId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="qualityCustomer">Customer ID</label>
              <input
                id="qualityCustomer"
                className="input"
                value={qualityForm.customerId}
                onChange={(event) => setQualityForm({ ...qualityForm, customerId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="qualityType">Type</label>
              <input
                id="qualityType"
                className="input"
                value={qualityForm.complaintType}
                onChange={(event) => setQualityForm({ ...qualityForm, complaintType: event.target.value })}
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="qualityDesc">Description</label>
              <textarea
                id="qualityDesc"
                className="textarea"
                value={qualityForm.description}
                onChange={(event) => setQualityForm({ ...qualityForm, description: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="qualitySeverity">Severity</label>
              <select
                id="qualitySeverity"
                className="select"
                value={qualityForm.severity}
                onChange={(event) => setQualityForm({ ...qualityForm, severity: event.target.value })}
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <button className="button-primary" type="submit">Save issue</button>
            {qualityStatus ? <div className="hint">{qualityStatus}</div> : null}
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Shift checklist</h3>
          <form className="form-grid" onSubmit={submitChecklist}>
            <div className="form-row">
              <label className="label" htmlFor="checklistTech">Technician ID</label>
              <input
                id="checklistTech"
                className="input"
                value={checklistForm.technicianId}
                onChange={(event) => setChecklistForm({ ...checklistForm, technicianId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="checklistDate">Work date</label>
              <input
                id="checklistDate"
                className="input"
                type="date"
                value={checklistForm.workDate}
                onChange={(event) => setChecklistForm({ ...checklistForm, workDate: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="checklistStart">Start items</label>
              <textarea
                id="checklistStart"
                className="textarea"
                value={checklistForm.startItems}
                onChange={(event) => setChecklistForm({ ...checklistForm, startItems: event.target.value })}
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="checklistEnd">End items</label>
              <textarea
                id="checklistEnd"
                className="textarea"
                value={checklistForm.endItems}
                onChange={(event) => setChecklistForm({ ...checklistForm, endItems: event.target.value })}
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="checklistStatus">Shift status</label>
              <select
                id="checklistStatus"
                className="select"
                value={checklistForm.shiftStatus}
                onChange={(event) => setChecklistForm({ ...checklistForm, shiftStatus: event.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
            <button className="button-primary" type="submit">Save checklist</button>
            {checklistStatus ? <div className="hint">{checklistStatus}</div> : null}
          </form>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Shift checklist log</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Checklist</th>
              <th>Technician</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {checklists.map((checklist) => (
              <tr key={checklist.checklist_id}>
                <td>{checklist.checklist_id}</td>
                <td>{checklist.technician_id}</td>
                <td>{checklist.work_date}</td>
                <td>{checklist.shift_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
