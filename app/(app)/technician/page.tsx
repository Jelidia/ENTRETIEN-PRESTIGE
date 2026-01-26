"use client";

import StatusBadge from "@/components/StatusBadge";
import { useEffect, useMemo, useState } from "react";

type JobRow = {
  job_id: string;
  service_type: string;
  status: string;
  scheduled_date: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  address?: string;
  estimated_revenue?: number;
  customer_id?: string;
};

export default function TechnicianPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);

  useEffect(() => {
    void loadJobs();
    void loadLocation();
  }, []);

  async function loadJobs() {
    const response = await fetch("/api/jobs");
    const json = await response.json().catch(() => ({ data: [] }));
    setJobs(json.data ?? []);
  }

  function loadLocation(): Promise<void> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          resolve();
        },
        () => resolve()
      );
    });
  }

  function formatRange(start?: string, end?: string) {
    if (!start && !end) return "";
    const safeStart = start ? start.slice(0, 5) : "";
    const safeEnd = end ? end.slice(0, 5) : "";
    return safeStart && safeEnd ? `${safeStart} - ${safeEnd}` : safeStart || safeEnd;
  }

  async function handleCheck(jobId: string, action: "check-in" | "check-out") {
    setStatus("");
    const position = await getCurrentPosition();
    const response = await fetch(`/api/jobs/${jobId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to update job");
      return;
    }
    setStatus(`Job ${jobId} updated.`);
    void loadJobs();
  }

  function getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: 0, longitude: 0, accuracy: 0 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
        () => resolve({ latitude: 0, longitude: 0, accuracy: 0 })
      );
    });
  }

  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const revenuePotential = jobs.reduce((sum, job) => sum + (job.estimated_revenue ?? 0), 0);
    const times = jobs
      .map((job) => job.scheduled_start_time)
      .filter((value): value is string => Boolean(value))
      .sort();
    const earliest = times[0];
    const latest = jobs
      .map((job) => job.scheduled_end_time)
      .filter((value): value is string => Boolean(value))
      .sort()
      .slice(-1)[0];
    return {
      totalJobs,
      revenuePotential,
      timeWindow: earliest && latest ? `${earliest.slice(0, 5)} - ${latest.slice(0, 5)}` : "",
    };
  }, [jobs]);

  const todayLabel = new Date().toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Today's jobs</div>
          <div className="tech-title">{todayLabel}</div>
        </div>
        <a className="button-ghost" href="/notifications">Alerts</a>
      </div>

      <div className="tech-gps">
        <span className="pill">GPS {location ? "On" : "Off"}</span>
        {location ? (
          <div className="tech-gps-meta">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} · ±{Math.round(location.accuracy)}m
          </div>
        ) : (
          <div className="tech-gps-meta">Enable location to improve routing.</div>
        )}
      </div>

      <div className="tech-stats">
        <div className="card">
          <div className="card-label">Today</div>
          <div className="card-value">{stats.totalJobs}</div>
          <div className="card-meta">Jobs scheduled</div>
        </div>
        <div className="card">
          <div className="card-label">Revenue</div>
          <div className="card-value">${stats.revenuePotential.toFixed(0)}</div>
          <div className="card-meta">Potential earnings</div>
        </div>
        <div className="card">
          <div className="card-label">Time window</div>
          <div className="card-value">{stats.timeWindow || "--"}</div>
          <div className="card-meta">Estimated schedule</div>
        </div>
      </div>

      <div className="tech-jobs">
        {jobs.map((job) => (
          <div className="mobile-card" key={job.job_id}>
            <div className="mobile-card-title">{formatRange(job.scheduled_start_time, job.scheduled_end_time)}</div>
            <div className="mobile-card-meta">{job.service_type}</div>
            <div className="mobile-card-meta">{job.address ?? job.customer_id ?? ""}</div>
            <div className="table-actions">
              <StatusBadge status={job.status} />
              {job.estimated_revenue ? <span className="tag">${job.estimated_revenue}</span> : null}
            </div>
            <div className="table-actions">
              <button className="button-secondary" type="button" onClick={() => handleCheck(job.job_id, "check-in")}>Check in</button>
              <button className="button-ghost" type="button" onClick={() => handleCheck(job.job_id, "check-out")}>Check out</button>
            </div>
          </div>
        ))}
      </div>

      <div className="tech-actions">
        <a className="button-secondary" href="/technician/map">Directions</a>
        <a className="button-secondary" href="/technician/customers">Customers</a>
        <a className="button-secondary" href="/technician/earnings">Earnings</a>
        <a className="button-secondary" href="/technician/profile">Profile</a>
      </div>

      <div className="card tech-shift">
        <h3 className="card-title">End of shift</h3>
        <div className="table-actions">
          <button className="button-primary" type="button" onClick={() => setStatus("Shift ended.")}>End shift</button>
          <button className="button-ghost" type="button">Shift photo</button>
        </div>
      </div>

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
