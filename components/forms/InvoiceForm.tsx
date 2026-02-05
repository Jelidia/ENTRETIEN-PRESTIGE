"use client";

import { useState } from "react";

export default function InvoiceForm() {
  const [form, setForm] = useState({
    customerId: "",
    invoiceNumber: "",
    dueDate: "",
    totalAmount: "",
    status: "draft",
  });
  const [statusMessage, setStatusMessage] = useState("");

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
