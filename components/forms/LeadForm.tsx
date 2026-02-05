"use client";

import { useState } from "react";
import { normalizePhoneE164 } from "@/lib/smsTemplates";

type QuickDateOption = { label: string; value: string };

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function getFirstMonday(baseDate: Date) {
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const offset = (8 - firstOfMonth.getDay()) % 7;
  let firstMonday = new Date(year, month, 1 + offset);
  if (firstMonday < base) {
    const nextMonth = new Date(year, month + 1, 1);
    const nextOffset = (8 - nextMonth.getDay()) % 7;
    firstMonday = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1 + nextOffset);
  }
  return firstMonday;
}

function getQuickDateOptions(baseDate = new Date()): QuickDateOption[] {
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return [
    { label: "Demain", value: toDateInputValue(addDays(base, 1)) },
    { label: "Semaine prochaine", value: toDateInputValue(addDays(base, 7)) },
    { label: "Premier lundi du mois", value: toDateInputValue(getFirstMonday(base)) },
  ];
}

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
  const [statusTone, setStatusTone] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(false);
  const quickDates = getQuickDateOptions();

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setStatusTone("error");
    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneE164(form.phone);
      if (!normalizedPhone) {
        setStatus("Téléphone invalide. Utilisez le format (514) 555-0123.");
        setLoading(false);
        return;
      }
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          customer_name: form.customerName,
          phone: normalizedPhone,
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
        setStatus(data.error ?? "Impossible de créer le lead");
        setLoading(false);
        return;
      }

      setStatusTone("success");
      setStatus("Lead créé avec succès.");

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
      setStatus("Erreur lors de la création du lead");
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
          placeholder="(514) 555-0123"
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
        <div className="table-actions" style={{ marginTop: 6 }}>
          {quickDates.map((option) => (
            <button
              key={option.label}
              className="tag"
              type="button"
              onClick={() => updateField("followUpDate", option.value)}
              disabled={loading}
            >
              {option.label}
            </button>
          ))}
        </div>
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

      {status ? <div className={statusTone === "success" ? "hint" : "alert"}>{status}</div> : null}
    </form>
  );
}
