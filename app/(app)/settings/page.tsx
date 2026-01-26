"use client";

import TopBar from "@/components/TopBar";
import NotificationSettingsForm from "@/components/forms/NotificationSettingsForm";
import { useState } from "react";

export default function SettingsPage() {
  const [otpAuth, setOtpAuth] = useState("");
  const [status, setStatus] = useState("");

  async function handleSetup2fa() {
    setStatus("");
    const response = await fetch("/api/auth/setup-2fa", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to enable 2FA");
      return;
    }
    setOtpAuth(json.otpauth ?? "");
    setStatus("Authenticator setup ready.");
  }

  async function handleDisable2fa() {
    setStatus("");
    const response = await fetch("/api/auth/disable-2fa", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to disable 2FA");
      return;
    }
    setOtpAuth("");
    setStatus("Two-factor disabled.");
  }

  return (
    <div className="page">
      <TopBar
        title="Settings"
        subtitle="Security, access control, and notifications"
        actions={<button className="button-primary" type="button">Save changes</button>}
      />

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Security controls</h3>
          <div className="list" style={{ marginTop: 12 }}>
            <div className="list-item">
              <div>
                <strong>Two-factor required</strong>
                <div className="card-meta">SMS and authenticator enforced</div>
              </div>
              <span className="tag">Enabled</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Session timeout</strong>
                <div className="card-meta">15 minutes for all roles</div>
              </div>
              <span className="tag">Active</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Account lockout</strong>
                <div className="card-meta">5 attempts, 30 minute hold</div>
              </div>
              <span className="tag">Active</span>
            </div>
          </div>

          <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
            <button className="button-secondary" type="button" onClick={handleSetup2fa}>
              Generate authenticator setup
            </button>
            <button className="button-ghost" type="button" onClick={handleDisable2fa}>
              Disable two-factor
            </button>
            {otpAuth ? (
              <div className="card" style={{ padding: 12 }}>
                <div className="card-meta">Scan with your authenticator app:</div>
                <code style={{ fontSize: 12, wordBreak: "break-all" }}>{otpAuth}</code>
              </div>
            ) : null}
            {status ? <div className="hint">{status}</div> : null}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Notification rules</h3>
          <NotificationSettingsForm />
        </div>
      </div>
    </div>
  );
}
