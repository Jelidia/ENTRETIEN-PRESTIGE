"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { useEffect, useState } from "react";

type JobRow = {
  job_id: string;
  service_type: string;
  status: string;
  scheduled_date: string;
  scheduled_start_time?: string;
  address?: string;
};

export default function TechnicianPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadJobs();
  }, []);

  async function loadJobs() {
    const response = await fetch("/api/jobs");
    const json = await response.json().catch(() => ({ data: [] }));
    setJobs(json.data ?? []);
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

  return (
    <div className="page">
      <TopBar title="Technician" subtitle="Mobile schedule view" />

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="card-title">Today jobs</div>
        <div className="list" style={{ marginTop: 12 }}>
          {jobs.map((job) => (
            <div className="list-item" key={job.job_id}>
              <div>
                <strong>{job.scheduled_start_time ?? job.scheduled_date}</strong>
                <div className="card-meta">{job.service_type}</div>
                <div className="card-meta">{job.address ?? ""}</div>
              </div>
              <div className="table-actions">
                <StatusBadge status={job.status} />
                <button className="button-secondary" type="button" onClick={() => handleCheck(job.job_id, "check-in")}>
                  Check in
                </button>
                <button className="button-ghost" type="button" onClick={() => handleCheck(job.job_id, "check-out")}>
                  Check out
                </button>
              </div>
            </div>
          ))}
        </div>
        {status ? <div className="hint">{status}</div> : null}
      </div>
    </div>
  );
}
