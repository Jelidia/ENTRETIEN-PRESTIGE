"use client";

import { useState } from "react";

interface LeadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LeadForm({ onSuccess, onCancel }: LeadFormProps) {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    estimatedValue: "",
    notes: "",
    followUpDate: "",
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          customer_name: form.customerName,
          phone: form.phone,
          email: form.email || null,
          address: form.address || null,
          estimated_value: form.estimatedValue ? parseFloat(form.estimatedValue) : 0,
          notes: form.notes || null,
          follow_up_date: form.followUpDate || null,
          status: "new",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Unable to create lead");
        setLoading(false);
        return;
      }

      setStatus("Lead created successfully!");

      // Reset form
      setForm({
        customerName: "",
        phone: "",
        email: "",
        address: "",
        estimatedValue: "",
        notes: "",
        followUpDate: "",
      });

      // Call success callback after a brief delay
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (error) {
      setStatus("Error creating lead");
      setLoading(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="label" htmlFor="customerName">
          Nom du client *
        </label>
        <input
          id="customerName"
          className="input"
          value={form.customerName}
          onChange={(event) => updateField("customerName", event.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <label className="label" htmlFor="phone">
          Téléphone *
        </label>
        <input
          id="phone"
          className="input"
          type="tel"
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="514-555-1234"
          required
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <label className="label" htmlFor="email">
          Courriel
        </label>
        <input
          id="email"
          className="input"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <label className="label" htmlFor="address">
          Adresse
        </label>
        <input
          id="address"
          className="input"
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <label className="label" htmlFor="estimatedValue">
          Valeur estimée ($)
        </label>
        <input
          id="estimatedValue"
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={form.estimatedValue}
          onChange={(event) => updateField("estimatedValue", event.target.value)}
          placeholder="0.00"
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <label className="label" htmlFor="followUpDate">
          Date de suivi
        </label>
        <input
          id="followUpDate"
          className="input"
          type="date"
          value={form.followUpDate}
          onChange={(event) => updateField("followUpDate", event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <label className="label" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          className="textarea"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={3}
          disabled={loading}
        />
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          className="button-primary"
          type="submit"
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? "Création..." : "Créer le lead"}
        </button>
        {onCancel && (
          <button
            className="button-secondary"
            type="button"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </button>
        )}
      </div>

      {status && (
        <div className={status.includes("success") ? "hint" : "alert"}>
          {status}
        </div>
      )}
    </form>
  );
}
