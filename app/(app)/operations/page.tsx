"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { useEffect, useState } from "react";

type QuickDateOption = { label: string; value: string };

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function getFirstMonday(baseDate: Date) {
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const offset = (8 - firstOfMonth.getDay()) % 7;
  let firstMonday = new Date(year, month, 1 + offset);
  if (firstMonday < base) {
    const nextMonth = new Date(year, month + 1, 1);
    const nextOffset = (8 - nextMonth.getDay()) % 7;
    firstMonday = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1 + nextOffset);
  }
  return firstMonday;
}

function getQuickDateOptions(baseDate = new Date()): QuickDateOption[] {
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return [
    { label: "Demain", value: toDateInputValue(addDays(base, 1)) },
    { label: "Semaine prochaine", value: toDateInputValue(addDays(base, 7)) },
    { label: "Premier lundi du mois", value: toDateInputValue(getFirstMonday(base)) },
  ];
}

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
  const quickDates = getQuickDateOptions();
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
    startItems: "Echelle, fournitures, EPI",
    endItems: "Vehicule propre, outils ranges",
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
      setIncidentStatus(json.error ?? "Impossible d'enregistrer l'incident");
      return;
    }
    setIncidentStatus("Incident enregistre.");
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
      setQualityStatus(json.error ?? "Impossible d'enregistrer le probleme");
      return;
    }
    setQualityStatus("Probleme de qualite enregistre.");
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
      setChecklistStatus(json.error ?? "Impossible d'enregistrer la checklist");
      return;
    }
    setChecklistStatus("Checklist enregistree.");
    setChecklistForm({
      technicianId: "",
      workDate: "",
      startItems: "Echelle, fournitures, EPI",
      endItems: "Vehicule propre, outils ranges",
      shiftStatus: "pending",
    });
    void loadData();
  }

  return (
    <div className="page">
      <TopBar
        title="Operations"
        subtitle="Controle qualite, incidents et preparation du quart"
        actions={<span className="pill">Securite d'abord</span>}
      />

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Incidents</h3>
          <div className="list" style={{ marginTop: 12 }}>
            {incidents.map((incident) => (
              <div className="list-item" key={incident.incident_id}>
                <div>
                  <strong>{incident.description}</strong>
                  <div className="card-meta">Gravite: {incident.severity}</div>
                </div>
                <StatusBadge status={incident.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Problemes de qualite</h3>
          <div className="list" style={{ marginTop: 12 }}>
            {qualityIssues.map((issue) => (
              <div className="list-item" key={issue.issue_id}>
                <div>
                  <strong>{issue.description}</strong>
                  <div className="card-meta">Gravite: {issue.severity}</div>
                </div>
                <StatusBadge status={issue.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <h3 className="card-title">Declarer un incident</h3>
          <form className="form-grid" onSubmit={submitIncident}>
            <div className="form-row">
              <label className="label" htmlFor="incidentJob">ID du travail</label>
              <input
                id="incidentJob"
                className="input"
                value={incidentForm.jobId}
                onChange={(event) => setIncidentForm({ ...incidentForm, jobId: event.target.value })}
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="incidentTech">ID du technicien</label>
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
                  <option value="property_damage">Dommages materiels</option>
                  <option value="injury">Blessure</option>
                  <option value="equipment">Equipement</option>
                </select>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="incidentSeverity">Gravite</label>
                <select
                  id="incidentSeverity"
                  className="select"
                  value={incidentForm.severity}
                  onChange={(event) => setIncidentForm({ ...incidentForm, severity: event.target.value })}
                >
                  <option value="minor">Mineur</option>
                  <option value="moderate">Modere</option>
                  <option value="severe">Severe</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="incidentCost">Cout estime</label>
              <input
                id="incidentCost"
                className="input"
                type="number"
                value={incidentForm.estimatedCost}
                onChange={(event) => setIncidentForm({ ...incidentForm, estimatedCost: event.target.value })}
              />
            </div>
            <button className="button-primary" type="submit">Enregistrer l'incident</button>
            {incidentStatus ? <div className="hint">{incidentStatus}</div> : null}
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Declarer un probleme de qualite</h3>
          <form className="form-grid" onSubmit={submitQuality}>
            <div className="form-row">
              <label className="label" htmlFor="qualityJob">ID du travail</label>
              <input
                id="qualityJob"
                className="input"
                value={qualityForm.jobId}
                onChange={(event) => setQualityForm({ ...qualityForm, jobId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="qualityCustomer">ID du client</label>
              <input
                id="qualityCustomer"
                className="input"
                value={qualityForm.customerId}
                onChange={(event) => setQualityForm({ ...qualityForm, customerId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="qualityType">Type de plainte</label>
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
              <label className="label" htmlFor="qualitySeverity">Gravite</label>
              <select
                id="qualitySeverity"
                className="select"
                value={qualityForm.severity}
                onChange={(event) => setQualityForm({ ...qualityForm, severity: event.target.value })}
              >
                <option value="minor">Mineur</option>
                <option value="major">Majeur</option>
                <option value="critical">Critique</option>
              </select>
            </div>
            <button className="button-primary" type="submit">Enregistrer le probleme</button>
            {qualityStatus ? <div className="hint">{qualityStatus}</div> : null}
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Checklist de quart</h3>
          <form className="form-grid" onSubmit={submitChecklist}>
            <div className="form-row">
              <label className="label" htmlFor="checklistTech">ID du technicien</label>
              <input
                id="checklistTech"
                className="input"
                value={checklistForm.technicianId}
                onChange={(event) => setChecklistForm({ ...checklistForm, technicianId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="checklistDate">Date de travail</label>
              <input
                id="checklistDate"
                className="input"
                type="date"
                value={checklistForm.workDate}
                onChange={(event) => setChecklistForm({ ...checklistForm, workDate: event.target.value })}
                required
              />
              <div className="table-actions" style={{ marginTop: 6 }}>
                {quickDates.map((option) => (
                  <button
                    key={option.label}
                    className="tag"
                    type="button"
                    onClick={() => setChecklistForm({ ...checklistForm, workDate: option.value })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="checklistStart">Elements de debut</label>
              <textarea
                id="checklistStart"
                className="textarea"
                value={checklistForm.startItems}
                onChange={(event) => setChecklistForm({ ...checklistForm, startItems: event.target.value })}
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="checklistEnd">Elements de fin</label>
              <textarea
                id="checklistEnd"
                className="textarea"
                value={checklistForm.endItems}
                onChange={(event) => setChecklistForm({ ...checklistForm, endItems: event.target.value })}
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="checklistStatus">Statut du quart</label>
              <select
                id="checklistStatus"
                className="select"
                value={checklistForm.shiftStatus}
                onChange={(event) => setChecklistForm({ ...checklistForm, shiftStatus: event.target.value })}
              >
                <option value="pending">En attente</option>
                <option value="approved">Approuve</option>
                <option value="incomplete">Incomplet</option>
              </select>
            </div>
            <button className="button-primary" type="submit">Enregistrer la checklist</button>
            {checklistStatus ? <div className="hint">{checklistStatus}</div> : null}
          </form>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Historique des checklists de quart</h3>
        <table className="table table-desktop">
          <thead>
            <tr>
              <th>Checklist</th>
              <th>Technicien</th>
              <th>Date</th>
              <th>Statut</th>
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
        <div className="card-list-mobile" style={{ marginTop: 12 }}>
          {checklists.map((checklist) => (
            <div className="mobile-card" key={checklist.checklist_id}>
              <div className="mobile-card-title">Checklist #{checklist.checklist_id}</div>
              <div className="mobile-card-meta">Technicien : {checklist.technician_id}</div>
              <div className="mobile-card-meta">Date : {checklist.work_date}</div>
              <div className="table-actions">
                <StatusBadge status={checklist.shift_status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
