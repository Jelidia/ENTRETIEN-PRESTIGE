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

const SWIPE_THRESHOLD = 60;
const SWIPE_VERTICAL_LIMIT = 40;

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
  const [swipeStart, setSwipeStart] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    void loadJobs();
  }, []);

  async function loadJobs() {
    setStatus("");
    const response = await fetch("/api/jobs");
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setStatus(json.error ?? "Impossible de charger l'horaire");
      return;
    }
    setJobs(json.data ?? []);
  }

  const upcoming = useMemo(() => jobs.slice(0, 10), [jobs]);

  function isActiveStatus(value?: string | null) {
    if (!value) return true;
    const normalized = value.toLowerCase();
    return !normalized.includes("complete") && !normalized.includes("cancel");
  }

  async function completeJob(jobId: string) {
    setStatus("");
    const response = await fetch(`/api/jobs/${jobId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Impossible de terminer le travail");
      return;
    }
    setStatus("Travail terminé.");
    void loadJobs();
  }

  function handleSwipeStart(event: React.TouchEvent<HTMLDivElement>, jobId: string) {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a")) {
      return;
    }
    const touch = event.touches[0];
    if (!touch) return;
    setSwipeStart({ id: jobId, x: touch.clientX, y: touch.clientY });
  }

  function handleSwipeMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!swipeStart) return;
    const touch = event.touches[0];
    if (!touch) return;
    const dx = Math.abs(touch.clientX - swipeStart.x);
    const dy = Math.abs(touch.clientY - swipeStart.y);
    if (dy > SWIPE_VERTICAL_LIMIT && dy > dx) {
      setSwipeStart(null);
    }
  }

  function handleSwipeEnd(event: React.TouchEvent<HTMLDivElement>, job: JobRow, phoneHref: string) {
    if (!swipeStart || swipeStart.id !== job.job_id) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - swipeStart.x;
    const dy = touch.clientY - swipeStart.y;
    setSwipeStart(null);
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_VERTICAL_LIMIT) {
      return;
    }
    if (dx < 0) {
      if (!phoneHref) {
        setStatus("Aucun numéro à appeler.");
        return;
      }
      window.location.href = `tel:${phoneHref}`;
      return;
    }
    if (!isActiveStatus(job.status)) {
      setStatus("Travail déjà terminé.");
      return;
    }
    void completeJob(job.job_id);
  }

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Mon horaire</div>
          <div className="tech-title">Travaux à venir</div>
        </div>
        <button className="button-ghost" type="button" onClick={loadJobs}>Actualiser</button>
      </div>

      {upcoming.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "32px" }}>
          <div className="card-title">Aucun travail planifié</div>
          <div className="card-meta">Vos prochains rendez-vous apparaîtront ici.</div>
        </div>
      ) : (
        <div className="list">
          {upcoming.map((job) => {
            const phone = job.customer?.phone ?? "";
            const phoneHref = normalizePhone(phone);
            return (
              <div
                className="list-item"
                key={job.job_id}
                onTouchStart={(event) => handleSwipeStart(event, job.job_id)}
                onTouchMove={handleSwipeMove}
                onTouchEnd={(event) => handleSwipeEnd(event, job, phoneHref)}
              >
                <div>
                  <strong>{job.service_type || "Service"}</strong>
                  <div className="card-meta">
                    {formatDate(job.scheduled_date)} · {formatTimeRange(job.scheduled_start_time, job.scheduled_end_time)}
                  </div>
                  <div className="card-meta">{job.address ?? "Adresse à confirmer"}</div>
                  {phone ? <div className="card-meta">{phone}</div> : null}
                  <div className="card-meta">Glissez à gauche pour appeler, à droite pour terminer.</div>
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
                <StatusBadge status={job.status ?? "Planifié"} />
              </div>
            );
          })}
        </div>
      )}

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
