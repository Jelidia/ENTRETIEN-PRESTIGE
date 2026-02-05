"use client";

import { useEffect, useState } from "react";

type CompanyService = {
  service_id: string;
  name: string;
  active: boolean;
};

export default function JobForm() {
  const [form, setForm] = useState({
    customerId: "",
    serviceType: "",
    servicePackage: "",
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
  const [services, setServices] = useState<CompanyService[]>([]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/company/services")
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        const data = Array.isArray(json?.data) ? json.data : [];
        setServices(data.filter((service: CompanyService) => service.active !== false));
      })
      .catch(() => {
        if (!mounted) return;
        setServices([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

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
      setStatus(data.error ?? "Impossible de créer le travail");
      return;
    }

    setStatus("Travail créé.");
    window.location.reload();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="label" htmlFor="customerId">ID client</label>
        <input
          id="customerId"
          className="input"
          value={form.customerId}
          onChange={(event) => updateField("customerId", event.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="serviceType">Type de service</label>
        <input
          id="serviceType"
          className="input"
          value={form.serviceType}
          onChange={(event) => updateField("serviceType", event.target.value)}
          placeholder="Ex. Lavage de vitres"
          required
          list="company-service-types"
        />
        <datalist id="company-service-types">
          {services.map((service) => (
            <option key={service.service_id} value={service.name} />
          ))}
        </datalist>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="servicePackage">Forfait</label>
        <input
          id="servicePackage"
          className="input"
          value={form.servicePackage}
          onChange={(event) => updateField("servicePackage", event.target.value)}
          placeholder="Ex. Standard"
          required
        />
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
          <label className="label" htmlFor="start">Début</label>
          <input
            id="start"
            className="input"
            type="time"
            value={form.scheduledStartTime}
            onChange={(event) => updateField("scheduledStartTime", event.target.value)}
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="end">Fin</label>
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
        <label className="label" htmlFor="address">Adresse</label>
        <input
          id="address"
          className="input"
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
        />
      </div>
      <div className="grid-2">
        <div className="form-row">
          <label className="label" htmlFor="city">Ville</label>
          <input
            id="city"
            className="input"
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="postalCode">Code postal</label>
          <input
            id="postalCode"
            className="input"
            value={form.postalCode}
            onChange={(event) => updateField("postalCode", event.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="estimatedRevenue">Revenu estimé</label>
        <input
          id="estimatedRevenue"
          className="input"
          type="number"
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
        Enregistrer le travail
      </button>
      {status ? <div className="hint">{status}</div> : null}
    </form>
  );
}
