"use client";

import StatusBadge from "@/components/StatusBadge";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  customer?: { phone?: string | null } | null;
};

const SWIPE_THRESHOLD = 60;
const SWIPE_VERTICAL_LIMIT = 40;

export default function TechnicianPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [status, setStatus] = useState("");
  const [completedJobId, setCompletedJobId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [swipeStart, setSwipeStart] = useState<{ id: string; x: number; y: number } | null>(null);

  const loadJobs = useCallback(async () => {
    const response = await fetch("/api/jobs");
    const json = await response.json().catch(() => ({ data: [] }));
    setJobs(json.data ?? []);
  }, []);

  const sendGpsPing = useCallback(async (next: { latitude: number; longitude: number; accuracy: number }) => {
    await fetch("/api/gps/hourly-ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: next.latitude,
        longitude: next.longitude,
        accuracyMeters: next.accuracy,
      }),
    });
  }, []);

  const loadLocation = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setLocation(next);
          void sendGpsPing(next);
          resolve();
        },
        () => resolve()
      );
    });
  }, [sendGpsPing]);

  useEffect(() => {
    void loadJobs();
    void loadLocation();
  }, [loadJobs, loadLocation]);

  function formatRange(start?: string, end?: string) {
    if (!start && !end) return "";
    const safeStart = start ? start.slice(0, 5) : "";
    const safeEnd = end ? end.slice(0, 5) : "";
    return safeStart && safeEnd ? `${safeStart} - ${safeEnd}` : safeStart || safeEnd;
  }

  function getJobTimestamp(job: JobRow) {
    const datePart = job.scheduled_date ?? "";
    const timePart = job.scheduled_start_time ?? "00:00";
    const iso = datePart.length > 10 ? datePart : `${datePart}T${timePart}`;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
      return 0;
    }
    return parsed.getTime();
  }

  function isActiveStatus(value?: string | null) {
    if (!value) return true;
    const normalized = value.toLowerCase();
    return !normalized.includes("complete") && !normalized.includes("cancel");
  }

  function copyAddress(value?: string | null) {
    if (!value) {
      setStatus("Adresse indisponible.");
      return;
    }
    void navigator.clipboard
      .writeText(value)
      .then(() => setStatus("Adresse copiée."))
      .catch(() => setStatus("Copie impossible."));
  }

  const normalizePhone = (value?: string | null) => (value ? value.replace(/\s+/g, "") : "");

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
    void handleCheck(job.job_id, "check-out");
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
      setStatus(json.error ?? "Impossible de mettre à jour le travail");
      return;
    }
    setStatus(`Travail ${jobId} mis à jour.`);
    if (action === "check-out") {
      setCompletedJobId(jobId);
    }
    void loadJobs();
  }

  async function handleRunningLate(jobId: string) {
    setStatus("");
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "En retard" }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Impossible de signaler le retard.");
      return;
    }
    const smsResponse = await fetch("/api/sms/triggers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "running_late", jobId }),
    });
    const smsJson = await smsResponse.json().catch(() => ({}));
    if (!smsResponse.ok) {
      setStatus(smsJson.error ?? "Retard signalé, mais le SMS n'a pas été envoyé.");
      return;
    }
    setStatus("Retard signalé au client.");
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

  const nextJob = useMemo(() => {
    if (!completedJobId) return null;
    const sorted = jobs.slice().sort((a, b) => getJobTimestamp(a) - getJobTimestamp(b));
    const currentIndex = sorted.findIndex((job) => job.job_id === completedJobId);
    if (currentIndex === -1) return null;
    return sorted.slice(currentIndex + 1).find((job) => isActiveStatus(job.status)) ?? null;
  }, [completedJobId, jobs]);

  const nextJobMapUrl = useMemo(() => {
    if (!nextJob?.address) return "";
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nextJob.address)}`;
  }, [nextJob]);

  const todayLabel = new Date().toLocaleDateString("fr-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Travaux d'aujourd'hui</div>
          <div className="tech-title">{todayLabel}</div>
        </div>
        <a className="button-ghost" href="/notifications">Alertes</a>
      </div>

      <div className="tech-gps">
        <span className="pill">GPS {location ? "activé" : "désactivé"}</span>
        {location ? (
          <div className="tech-gps-meta">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} · ±{Math.round(location.accuracy)}m
          </div>
        ) : (
          <div className="tech-gps-meta">Activez la localisation pour améliorer l'itinéraire.</div>
        )}
      </div>

      <div className="tech-stats">
        <div className="card">
          <div className="card-label">Aujourd'hui</div>
          <div className="card-value">{stats.totalJobs}</div>
          <div className="card-meta">Travaux planifiés</div>
        </div>
        <div className="card">
          <div className="card-label">Revenus</div>
          <div className="card-value">${stats.revenuePotential.toFixed(0)}</div>
          <div className="card-meta">Revenus potentiels</div>
        </div>
        <div className="card">
          <div className="card-label">Plage horaire</div>
          <div className="card-value">{stats.timeWindow || "--"}</div>
          <div className="card-meta">Horaire estimé</div>
        </div>
      </div>

      <div className="tech-jobs">
        {jobs.map((job) => {
          const phone = job.customer?.phone ?? "";
          const phoneHref = normalizePhone(phone);
          return (
            <div
              className="mobile-card"
              key={job.job_id}
              onTouchStart={(event) => handleSwipeStart(event, job.job_id)}
              onTouchMove={handleSwipeMove}
              onTouchEnd={(event) => handleSwipeEnd(event, job, phoneHref)}
            >
              <div className="mobile-card-title">{formatRange(job.scheduled_start_time, job.scheduled_end_time)}</div>
              <div className="mobile-card-meta">{job.service_type}</div>
              <div className="mobile-card-meta">{job.address ?? job.customer_id ?? ""}</div>
              {phone ? <div className="mobile-card-meta">{phone}</div> : null}
              <div className="table-actions">
                <StatusBadge status={job.status} />
                {job.estimated_revenue ? <span className="tag">${job.estimated_revenue}</span> : null}
                {job.address ? (
                  <button
                    className="tag"
                    type="button"
                    onClick={() => copyAddress(job.address)}
                    aria-label="Copier l'adresse"
                    title="Copier l'adresse"
                  >
                    Copier l'adresse
                  </button>
                ) : null}
              </div>
              {phoneHref ? (
                <div className="table-actions">
                  <a className="button-ghost" href={`tel:${phoneHref}`}>Appeler</a>
                  <a className="button-ghost" href={`sms:${phoneHref}`}>SMS</a>
                </div>
              ) : null}
              <div className="table-actions">
                <button className="button-secondary" type="button" onClick={() => handleCheck(job.job_id, "check-in")}>Débuter</button>
                <button className="button-ghost" type="button" onClick={() => handleCheck(job.job_id, "check-out")}>Terminer</button>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={() => handleRunningLate(job.job_id)}
                  disabled={!isActiveStatus(job.status)}
                >
                  En retard
                </button>
              </div>
              <div className="mobile-card-meta">Glissez à gauche pour appeler, à droite pour terminer.</div>
            </div>
          );
        })}
      </div>

      {nextJob ? (
        <div className="card">
          <div className="card-label">Prochain travail</div>
          <div className="card-title">Naviguer vers le prochain rendez-vous</div>
          <div className="card-meta">
            {formatRange(nextJob.scheduled_start_time, nextJob.scheduled_end_time)}
            {nextJob.address ? ` · ${nextJob.address}` : " · Adresse à confirmer"}
          </div>
          <div className="table-actions" style={{ marginTop: 12 }}>
            {nextJobMapUrl ? (
              <a className="button-primary" href={nextJobMapUrl} target="_blank" rel="noreferrer">
                Naviguer
              </a>
            ) : (
              <span className="tag">Adresse à confirmer</span>
            )}
            <button className="button-ghost" type="button" onClick={() => setCompletedJobId(null)}>
              Masquer
            </button>
          </div>
        </div>
      ) : null}

      <div className="tech-actions">
        <a className="button-secondary" href="/technician/schedule">Horaire</a>
        <a className="button-secondary" href="/technician/equipment">Équipement</a>
        <a className="button-secondary" href="/technician/earnings">Revenus</a>
        <a className="button-secondary" href="/technician/profile">Paramètres</a>
      </div>

      <div className="card tech-shift">
        <h3 className="card-title">Fin de quart</h3>
        <div className="table-actions">
          <button className="button-primary" type="button" onClick={() => setStatus("Quart terminé.")}>Terminer le quart</button>
          <button className="button-ghost" type="button">Photo du quart</button>
        </div>
      </div>

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
