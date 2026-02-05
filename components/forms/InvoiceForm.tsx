"use client";

import { useState } from "react";

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

export default function InvoiceForm() {
  const [form, setForm] = useState({
    customerId: "",
    invoiceNumber: "",
    dueDate: "",
    totalAmount: "",
    status: "draft",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const quickDates = getQuickDateOptions();

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatusMessage(data.error ?? "Impossible de creer la facture");
      return;
    }

    setStatusMessage("Facture creee.");
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
        <label className="label" htmlFor="invoiceNumber">Numero de facture</label>
        <input
          id="invoiceNumber"
          className="input"
          value={form.invoiceNumber}
          onChange={(event) => updateField("invoiceNumber", event.target.value)}
          required
        />
      </div>
      <div className="grid-2">
        <div className="form-row">
          <label className="label" htmlFor="dueDate">Date d'echeance</label>
          <input
            id="dueDate"
            className="input"
            type="date"
            value={form.dueDate}
            onChange={(event) => updateField("dueDate", event.target.value)}
            required
          />
          <div className="table-actions" style={{ marginTop: 6 }}>
            {quickDates.map((option) => (
              <button
                key={option.label}
                className="tag"
                type="button"
                onClick={() => updateField("dueDate", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label className="label" htmlFor="totalAmount">Total</label>
          <input
            id="totalAmount"
            className="input"
            type="number"
            value={form.totalAmount}
            onChange={(event) => updateField("totalAmount", event.target.value)}
            required
          />
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="status">Statut</label>
        <select
          id="status"
          className="select"
          value={form.status}
          onChange={(event) => updateField("status", event.target.value)}
        >
          <option value="draft">Brouillon</option>
          <option value="sent">Envoyee</option>
          <option value="paid">Payee</option>
          <option value="overdue">En retard</option>
        </select>
      </div>
      <button className="button-primary" type="submit">
        Enregistrer la facture
      </button>
      {statusMessage ? <div className="hint">{statusMessage}</div> : null}
    </form>
  );
}
