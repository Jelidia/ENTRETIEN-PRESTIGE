"use client";

import DispatchColumn from "@/components/DispatchColumn";
import TopBar from "@/components/TopBar";
import { useEffect, useState } from "react";

type DispatchJob = {
  id: string;
  time: string;
  address: string;
  service: string;
  price: string;
  status: string;
};

type DispatchColumnType = {
  technician: string;
  jobs: DispatchJob[];
};

type ConflictRow = {
  job_id: string;
  technician_id: string;
  scheduled_date: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
};

type GpsRow = {
  location_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

export default function DispatchPage() {
  const [board, setBoard] = useState<DispatchColumnType[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [status, setStatus] = useState("");
  const [reassignForm, setReassignForm] = useState({ jobId: "", technicianId: "" });
  const [weatherForm, setWeatherForm] = useState({ startDate: "", endDate: "" });
  const [gpsForm, setGpsForm] = useState({ technicianId: "", start: "", end: "" });
  const [gpsResults, setGpsResults] = useState<GpsRow[]>([]);

  useEffect(() => {
    void loadDispatch();
  }, []);

  async function loadDispatch() {
    const [boardRes, conflictsRes] = await Promise.all([
      fetch("/api/dispatch/calendar"),
      fetch("/api/dispatch/conflicts"),
    ]);
    const boardJson = await boardRes.json().catch(() => ({ data: [] }));
    const conflictsJson = await conflictsRes.json().catch(() => ({ data: [] }));
    setBoard(boardJson.data ?? []);
    setConflicts(conflictsJson.data ?? []);
  }

  async function autoAssign() {
    setStatus("");
    const response = await fetch("/api/dispatch/auto-assign", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to auto-assign");
      return;
    }
    setStatus(`Auto-assigned ${json.assigned ?? 0} jobs.`);
    void loadDispatch();
  }

  async function submitReassign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/dispatch/reassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reassignForm),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to reassign job");
      return;
    }
    setStatus("Job reassigned.");
    setReassignForm({ jobId: "", technicianId: "" });
    void loadDispatch();
  }

  async function submitWeather(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/dispatch/weather-cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weatherForm),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to cancel jobs");
      return;
    }
    setStatus("Weather cancellations applied.");
    setWeatherForm({ startDate: "", endDate: "" });
    void loadDispatch();
  }

  async function submitGps(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    let url = "/api/gps/history";
    if (gpsForm.technicianId) {
      url = `/api/gps/technician/${gpsForm.technicianId}`;
    }
    if (gpsForm.start || gpsForm.end) {
      const params = new URLSearchParams();
      if (gpsForm.start) params.set("start", gpsForm.start);
      if (gpsForm.end) params.set("end", gpsForm.end);
      url = `/api/gps/history?${params.toString()}`;
    }

    const response = await fetch(url);
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to load GPS");
      return;
    }
    setGpsResults(json.data ?? []);
  }

  return (
    <div className="page">
      <TopBar
        title="Dispatch"
        subtitle="Week view, reassignments, and conflicts"
        actions={
          <>
            <button className="button-secondary" type="button" onClick={autoAssign}>
              Auto-assign
            </button>
            <button className="button-primary" type="button">
              New job
            </button>
          </>
        }
      />

      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {board.map((column) => (
          <DispatchColumn key={column.technician} column={column} />
        ))}
      </div>

      <div className="grid-3">
        <div className="card">
          <h3 className="card-title">Reassign job</h3>
          <form className="form-grid" onSubmit={submitReassign}>
            <div className="form-row">
              <label className="label" htmlFor="reassignJob">Job ID</label>
              <input
                id="reassignJob"
                className="input"
                value={reassignForm.jobId}
                onChange={(event) => setReassignForm({ ...reassignForm, jobId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="reassignTech">Technician ID</label>
              <input
                id="reassignTech"
                className="input"
                value={reassignForm.technicianId}
                onChange={(event) => setReassignForm({ ...reassignForm, technicianId: event.target.value })}
                required
              />
            </div>
            <button className="button-primary" type="submit">Reassign</button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Weather cancel</h3>
          <form className="form-grid" onSubmit={submitWeather}>
            <div className="form-row">
              <label className="label" htmlFor="startDate">Start date</label>
              <input
                id="startDate"
                className="input"
                type="date"
                value={weatherForm.startDate}
                onChange={(event) => setWeatherForm({ ...weatherForm, startDate: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="endDate">End date</label>
              <input
                id="endDate"
                className="input"
                type="date"
                value={weatherForm.endDate}
                onChange={(event) => setWeatherForm({ ...weatherForm, endDate: event.target.value })}
                required
              />
            </div>
            <button className="button-secondary" type="submit">Cancel jobs</button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">GPS lookup</h3>
          <form className="form-grid" onSubmit={submitGps}>
            <div className="form-row">
              <label className="label" htmlFor="gpsTech">Technician ID</label>
              <input
                id="gpsTech"
                className="input"
                value={gpsForm.technicianId}
                onChange={(event) => setGpsForm({ ...gpsForm, technicianId: event.target.value })}
              />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="gpsStart">Start</label>
                <input
                  id="gpsStart"
                  className="input"
                  type="datetime-local"
                  value={gpsForm.start}
                  onChange={(event) => setGpsForm({ ...gpsForm, start: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="gpsEnd">End</label>
                <input
                  id="gpsEnd"
                  className="input"
                  type="datetime-local"
                  value={gpsForm.end}
                  onChange={(event) => setGpsForm({ ...gpsForm, end: event.target.value })}
                />
              </div>
            </div>
            <button className="button-ghost" type="submit">Load GPS</button>
          </form>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Conflicts</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Technician</th>
                <th>Date</th>
                <th>Window</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((conflict) => (
                <tr key={conflict.job_id}>
                  <td>{conflict.job_id}</td>
                  <td>{conflict.technician_id}</td>
                  <td>{conflict.scheduled_date}</td>
                  <td>
                    {conflict.scheduled_start_time ?? ""} - {conflict.scheduled_end_time ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="card-title">GPS results</h3>
          <div className="list" style={{ marginTop: 12 }}>
            {gpsResults.map((point) => (
              <div className="list-item" key={point.location_id}>
                <div>
                  <strong>{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</strong>
                  <div className="card-meta">{new Date(point.timestamp).toLocaleString()}</div>
                </div>
                <span className="tag">GPS</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
