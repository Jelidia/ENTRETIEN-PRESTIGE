"use client";

import { useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

type JobRow = {
  job_id: string;
  service_type: string;
  status: string;
  scheduled_date: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  address?: string;
  customer?: { phone?: string | null } | null;
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

function copyAddress(value?: string | null, onResult?: (message: string) => void) {
  if (!value) {
    onResult?.("Adresse indisponible.");
    return;
  }
  void navigator.clipboard
    .writeText(value)
    .then(() => onResult?.("Adresse copiée."))
    .catch(() => onResult?.("Copie impossible."));
}

const normalizePhone = (value?: string | null) => (value ? value.replace(/\s+/g, "") : "");

export default function TechnicianSchedulePage() {
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

  const upcoming = useMemo(() => jobs.slice(0, 10), [jobs]);

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">My schedule</div>
          <div className="tech-title">Upcoming jobs</div>
        </div>
        <button className="button-ghost" type="button" onClick={loadJobs}>Refresh</button>
      </div>

      {upcoming.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "32px" }}>
          <div className="card-title">No scheduled jobs</div>
          <div className="card-meta">Your next appointments will show here.</div>
        </div>
      ) : (
        <div className="list">
          {upcoming.map((job) => {
            const phone = job.customer?.phone ?? "";
            const phoneHref = normalizePhone(phone);
            return (
              <div className="list-item" key={job.job_id}>
                <div>
                  <strong>{job.service_type || "Service"}</strong>
                  <div className="card-meta">
                    {formatDate(job.scheduled_date)} · {formatTimeRange(job.scheduled_start_time, job.scheduled_end_time)}
                  </div>
                  <div className="card-meta">{job.address ?? "Address pending"}</div>
                  {phone ? <div className="card-meta">{phone}</div> : null}
                  {(job.address || phoneHref) ? (
                    <div className="list-item-actions">
                      {job.address ? (
                        <button
                          className="tag"
                          type="button"
                          onClick={() => copyAddress(job.address, setStatus)}
                          aria-label="Copier l'adresse"
                          title="Copier l'adresse"
                        >
                          Copier l'adresse
                        </button>
                      ) : null}
                      {phoneHref ? (
                        <>
                          <a className="button-ghost" href={`tel:${phoneHref}`}>Appeler</a>
                          <a className="button-ghost" href={`sms:${phoneHref}`}>SMS</a>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <StatusBadge status={job.status ?? "Scheduled"} />
              </div>
            );
          })}
        </div>
      )}

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
