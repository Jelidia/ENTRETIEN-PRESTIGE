"use client";

import { useEffect, useState } from "react";

type AccessResponse = {
  role?: string;
};

export default function TechnicianProfilePage() {
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadAccess();
  }, []);

  async function loadAccess() {
    const response = await fetch("/api/access");
    const json = (await response.json().catch(() => ({}))) as AccessResponse;
    if (json.role) {
      setRole(json.role);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Profile</div>
          <div className="tech-title">Technician account</div>
        </div>
      </div>

      <div className="card profile-card">
        <div>
          <div className="card-label">Role</div>
          <div className="card-value">{role || "technician"}</div>
        </div>
        <div>
          <div className="card-label">Support</div>
          <div className="card-meta">Need help? Contact dispatch.</div>
        </div>
        <div className="table-actions">
          <button className="button-secondary" type="button" onClick={() => setStatus("Support ticket opened.")}>Support</button>
          <button className="button-primary" type="button" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
