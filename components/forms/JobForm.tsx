"use client";

import { useState } from "react";

export default function JobForm() {
  const [form, setForm] = useState({
    customerId: "",
    serviceType: "window_cleaning",
    servicePackage: "premium",
    scheduledDate: "",
    scheduledStartTime: "",
    scheduledEndTime: "",
    address: "",
    city: "",
    postalCode: "",
    estimatedRevenue: "",
    description: "",
  });
  const [status, setStatus] = useState("");

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to create job");
      return;
    }

    setStatus("Job created.");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="label" htmlFor="customerId">Customer ID</label>
        <input
          id="customerId"
          className="input"
          value={form.customerId}
          onChange={(event) => updateField("customerId", event.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="serviceType">Service</label>
        <select
          id="serviceType"
          className="select"
          value={form.serviceType}
          onChange={(event) => updateField("serviceType", event.target.value)}
        >
          <option value="window_cleaning">Window cleaning</option>
          <option value="gutter_cleaning">Gutter cleaning</option>
          <option value="pressure_wash">Pressure wash</option>
          <option value="roof_cleaning">Roof cleaning</option>
        </select>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="servicePackage">Package</label>
        <select
          id="servicePackage"
          className="select"
          value={form.servicePackage}
          onChange={(event) => updateField("servicePackage", event.target.value)}
        >
          <option value="basique">Basique</option>
          <option value="premium">Premium</option>
          <option value="prestige">Prestige</option>
        </select>
      </div>
      <div className="grid-3">
        <div className="form-row">
          <label className="label" htmlFor="scheduledDate">Date</label>
          <input
            id="scheduledDate"
            className="input"
            type="date"
            value={form.scheduledDate}
            onChange={(event) => updateField("scheduledDate", event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="start">Start</label>
          <input
            id="start"
            className="input"
            type="time"
            value={form.scheduledStartTime}
            onChange={(event) => updateField("scheduledStartTime", event.target.value)}
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="end">End</label>
          <input
            id="end"
            className="input"
            type="time"
            value={form.scheduledEndTime}
            onChange={(event) => updateField("scheduledEndTime", event.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="address">Address</label>
        <input
          id="address"
          className="input"
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
        />
      </div>
      <div className="grid-2">
        <div className="form-row">
          <label className="label" htmlFor="city">City</label>
          <input
            id="city"
            className="input"
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="postalCode">Postal code</label>
          <input
            id="postalCode"
            className="input"
            value={form.postalCode}
            onChange={(event) => updateField("postalCode", event.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="estimatedRevenue">Estimated revenue</label>
        <input
          id="estimatedRevenue"
          className="input"
          value={form.estimatedRevenue}
          onChange={(event) => updateField("estimatedRevenue", event.target.value)}
        />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="textarea"
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </div>
      <button className="button-primary" type="submit">
        Save job
      </button>
      {status ? <div className="hint">{status}</div> : null}
    </form>
  );
}
