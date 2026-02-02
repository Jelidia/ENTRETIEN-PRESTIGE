"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";

type JobRow = {
  job_id: string;
  service_type: string;
  status: string;
  scheduled_date: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  address?: string;
  estimated_revenue?: number;
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTimeRange(start?: string, end?: string) {
  const safeStart = start ? start.slice(0, 5) : "";
  const safeEnd = end ? end.slice(0, 5) : "";
  if (safeStart && safeEnd) return `${safeStart} - ${safeEnd}`;
  return safeStart || safeEnd || "";
}

export default function SalesSchedulePage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadJobs();
  }, []);

  async function loadJobs() {
    setStatus("");
    const response = await fetch("/api/jobs");
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to load schedule");
      return;
    }
    setJobs(json.data ?? []);
  }

  const upcoming = useMemo(() => jobs.slice(0, 8), [jobs]);

  return (
    <div className="page">
      <TopBar
        title="My Schedule"
        subtitle="Upcoming appointments"
        actions={
          <button className="button-ghost" type="button" onClick={loadJobs}>
            Refresh
          </button>
        }
      />

      {upcoming.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "32px" }}>
          <div className="card-title">No appointments</div>
          <div className="card-meta">Your upcoming visits will appear here.</div>
        </div>
      ) : (
        <div className="list">
          {upcoming.map((job) => (
            <div className="list-item" key={job.job_id}>
              <div>
                <strong>{job.service_type || "Service"}</strong>
                <div className="card-meta">
                  {formatDate(job.scheduled_date)} · {formatTimeRange(job.scheduled_start_time, job.scheduled_end_time)}
                </div>
                <div className="card-meta">{job.address ?? "Address pending"}</div>
              </div>
              <div style={{ display: "grid", gap: "8px", justifyItems: "end" }}>
                <StatusBadge status={job.status ?? "Scheduled"} />
                {job.estimated_revenue ? <span className="tag">${job.estimated_revenue}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
