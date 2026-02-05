"use client";

import { useEffect, useState } from "react";

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
  const [customers, setCustomers] = useState<Array<{ customer_id: string; first_name: string; last_name: string }>>(
    []
  );
  const [customerLimit, setCustomerLimit] = useState(25);
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
      setStatusMessage(data.error ?? "Impossible de créer la facture");
      return;
    }

    setStatusMessage("Facture créée.");
    window.location.reload();
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/customers")
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        const data = Array.isArray(json?.data) ? json.data : [];
        setCustomers(data);
      })
      .catch(() => {
        if (!mounted) return;
        setCustomers([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const visibleCustomers = customers.slice(0, customerLimit);

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="label" htmlFor="customerId">ID client</label>
        <input
          id="customerId"
          className="input"
          list="invoice-form-customers"
          value={form.customerId}
          onChange={(event) => updateField("customerId", event.target.value)}
          required
        />
        <datalist id="invoice-form-customers">
          {visibleCustomers.map((customer) => {
            const name = `${customer.first_name} ${customer.last_name}`.trim();
            return (
              <option
                key={customer.customer_id}
                value={customer.customer_id}
                label={name || customer.customer_id}
              />
            );
          })}
        </datalist>
        {customers.length > customerLimit ? (
          <button
            className="button-ghost"
            type="button"
            onClick={() => setCustomerLimit((prev) => prev + 25)}
          >
            Afficher plus de clients
          </button>
        ) : null}
      </div>
      <div className="form-row">
        <label className="label" htmlFor="invoiceNumber">Numéro de facture</label>
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
          <label className="label" htmlFor="dueDate">Date d'échéance</label>
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
          <option value="sent">Envoyée</option>
          <option value="paid">Payée</option>
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
