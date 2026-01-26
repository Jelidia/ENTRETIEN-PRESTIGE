"use client";

import { useState } from "react";

export default function NotificationSettingsForm() {
  const [form, setForm] = useState({
    jobAlerts: true,
    invoiceReminders: true,
    qualityIncidents: true,
    channel: "sms",
  });
  const [status, setStatus] = useState("");

  function updateField(key: string, value: boolean | string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/notifications/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to save settings");
      return;
    }
    setStatus("Settings saved.");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="list-item" style={{ alignItems: "center" }}>
        <span>
          <strong>Job status alerts</strong>
          <div className="card-meta">Send alerts for delays or no-shows</div>
        </span>
        <input
          type="checkbox"
          checked={form.jobAlerts}
          onChange={(event) => updateField("jobAlerts", event.target.checked)}
        />
      </label>
      <label className="list-item" style={{ alignItems: "center" }}>
        <span>
          <strong>Invoice reminders</strong>
          <div className="card-meta">Send reminders before due date</div>
        </span>
        <input
          type="checkbox"
          checked={form.invoiceReminders}
          onChange={(event) => updateField("invoiceReminders", event.target.checked)}
        />
      </label>
      <label className="list-item" style={{ alignItems: "center" }}>
        <span>
          <strong>Quality incidents</strong>
          <div className="card-meta">Escalate to managers</div>
        </span>
        <input
          type="checkbox"
          checked={form.qualityIncidents}
          onChange={(event) => updateField("qualityIncidents", event.target.checked)}
        />
      </label>
      <div className="form-row">
        <label className="label" htmlFor="channel">Preferred channel</label>
        <select
          id="channel"
          className="select"
          value={form.channel}
          onChange={(event) => updateField("channel", event.target.value)}
        >
          <option value="sms">SMS</option>
          <option value="email">Email</option>
          <option value="in_app">In-app</option>
        </select>
      </div>
      <button className="button-primary" type="submit">
        Save settings
      </button>
      {status ? <div className="hint">{status}</div> : null}
    </form>
  );
}
