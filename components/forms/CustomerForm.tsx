"use client";

import { useState } from "react";

export default function CustomerForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    type: "residential",
    address: "",
    city: "",
    postalCode: "",
  });
  const [status, setStatus] = useState("");

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to create customer");
      return;
    }

    setStatus("Customer saved.");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="grid-2">
        <div className="form-row">
          <label className="label" htmlFor="firstName">First name</label>
          <input
            id="firstName"
            className="input"
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            className="input"
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            required
          />
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          className="input"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
        />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="phone">Phone</label>
        <input
          id="phone"
          className="input"
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
        />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="type">Type</label>
        <select
          id="type"
          className="select"
          value={form.type}
          onChange={(event) => updateField("type", event.target.value)}
        >
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="industrial">Industrial</option>
        </select>
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
      <button className="button-primary" type="submit">
        Save customer
      </button>
      {status ? <div className="hint">{status}</div> : null}
    </form>
  );
}
