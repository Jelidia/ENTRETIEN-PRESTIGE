"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import InvoiceForm from "@/components/forms/InvoiceForm";
import { useEffect, useMemo, useState } from "react";
import { useCompany } from "@/contexts/company/CompanyContext";

type InvoiceRow = {
  invoice_id: string;
  invoice_number: string;
  payment_status: string;
  total_amount?: number;
  due_date?: string;
};

export default function InvoicesPage() {
  const { company } = useCompany();
  const companyName = company?.name ?? "Entreprise";
  const defaultSubject = useMemo(() => `Facture de ${companyName}`, [companyName]);
  const defaultBody = "Bonjour, votre facture est prête. Merci pour votre confiance.";
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [sendStatus, setSendStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [invoiceLimit, setInvoiceLimit] = useState(50);
  const [sendForm, setSendForm] = useState({
    invoiceId: "",
    to: "",
    subject: "",
    body: "",
    channel: "email",
  });
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "",
    status: "paid",
    paidAmount: "",
  });

  useEffect(() => {
    void loadInvoices();
  }, []);

  useEffect(() => {
    setSendForm((prev) => ({
      ...prev,
      subject: prev.subject || defaultSubject,
      body: prev.body || defaultBody,
    }));
  }, [defaultSubject, defaultBody]);

  async function loadInvoices() {
    const response = await fetch("/api/invoices");
    const json = await response.json().catch(() => ({ data: [] }));
    const data = Array.isArray(json.data) ? json.data : [];
    setInvoices(data);
    setSelectedInvoices((prev) => {
      if (!prev.size) return prev;
      const validIds = new Set(data.map((invoice: InvoiceRow) => invoice.invoice_id));
      return new Set(Array.from(prev).filter((id) => validIds.has(id)));
    });
  }

  const selectedCount = selectedInvoices.size;
  const allSelected = invoices.length > 0 && selectedCount === invoices.length;
  const visibleInvoices = useMemo(() => invoices.slice(0, invoiceLimit), [invoices, invoiceLimit]);

  function toggleInvoiceSelection(invoiceId: string) {
    setSelectedInvoices((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) {
        next.delete(invoiceId);
      } else {
        next.add(invoiceId);
      }
      return next;
    });
  }

  function toggleAllInvoices() {
    setSelectedInvoices((prev) => {
      if (invoices.length === 0) return prev;
      if (prev.size === invoices.length) return new Set();
      return new Set(invoices.map((invoice) => invoice.invoice_id));
    });
  }

  async function bulkUpdatePaymentStatus(nextStatus: string) {
    if (!selectedCount) {
      setBulkStatus("Aucune facture sélectionnée.");
      return;
    }
    setBulkLoading(true);
    setBulkStatus("");
    let successCount = 0;
    await Promise.all(
      Array.from(selectedInvoices).map(async (invoiceId) => {
        try {
          const res = await fetch(`/api/invoices/${invoiceId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment_status: nextStatus }),
          });
          if (res.ok) {
            successCount += 1;
          }
        } catch {
          return null;
        }
        return null;
      })
    );
    setBulkStatus(
      successCount === selectedCount
        ? `Statut mis à jour pour ${successCount} factures.`
        : `Statut mis à jour pour ${successCount}/${selectedCount} factures.`
    );
    setBulkLoading(false);
    setSelectedInvoices(new Set());
    void loadInvoices();
  }

  async function submitSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendStatus("");
    const response = await fetch(`/api/invoices/${sendForm.invoiceId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: sendForm.to,
        subject: sendForm.subject,
        body: sendForm.body,
        channel: sendForm.channel,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSendStatus(json.error ?? "Impossible d'envoyer la facture");
      return;
    }
    setSendStatus("Facture envoyée.");
    setSendForm({ invoiceId: "", to: "", subject: sendForm.subject, body: sendForm.body, channel: "email" });
    void loadInvoices();
  }

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaymentStatus("");
    const response = await fetch(`/api/invoices/${paymentForm.invoiceId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: paymentForm.status,
        paidAmount: Number(paymentForm.paidAmount),
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPaymentStatus(json.error ?? "Impossible d'enregistrer le paiement");
      return;
    }
    setPaymentStatus("Paiement enregistré.");
    setPaymentForm({ invoiceId: "", status: "paid", paidAmount: "" });
    void loadInvoices();
  }

  return (
    <div className="page">
      <TopBar
        title="Factures"
        subtitle="Suivi de facturation et encaissements"
        actions={<button className="button-primary" type="button">Nouvelle facture</button>}
      />

      <div className="grid-2">
        <div className="card">
          <div className="table-actions" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAllInvoices}
                disabled={bulkLoading || invoices.length === 0}
                aria-label="Tout sélectionner"
              />
              <span className="card-meta">Tout sélectionner</span>
            </label>
            {selectedCount ? <span className="tag">{selectedCount} sélectionnées</span> : null}
          </div>
          {selectedCount ? (
            <div className="stack" style={{ marginBottom: 12 }}>
              <div className="table-actions" style={{ flexWrap: "wrap" }}>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => bulkUpdatePaymentStatus("paid")}
                  disabled={bulkLoading}
                >
                  Marquer payées
                </button>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={() => bulkUpdatePaymentStatus("overdue")}
                  disabled={bulkLoading}
                >
                  Marquer en retard
                </button>
              </div>
              {bulkStatus ? <div className="hint">{bulkStatus}</div> : null}
            </div>
          ) : null}
          <table className="table table-desktop">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAllInvoices}
                    disabled={bulkLoading || invoices.length === 0}
                    aria-label="Tout sélectionner"
                  />
                </th>
                <th>Facture</th>
                <th>Date d'échéance</th>
                <th>Statut</th>
                <th>Total</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.invoice_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedInvoices.has(invoice.invoice_id)}
                      onChange={() => toggleInvoiceSelection(invoice.invoice_id)}
                      disabled={bulkLoading}
                      aria-label={`Sélectionner la facture ${invoice.invoice_number}`}
                    />
                  </td>
                  <td>{invoice.invoice_number}</td>
                  <td>{invoice.due_date ?? ""}</td>
                  <td>
                    <StatusBadge status={invoice.payment_status} />
                  </td>
                  <td>{invoice.total_amount ? `$${invoice.total_amount}` : "$0"}</td>
                  <td>
                    <a className="button-ghost" href={`/api/invoices/${invoice.invoice_id}/pdf`}>
                      Télécharger
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-list-mobile" style={{ marginTop: 12 }}>
            {invoices.map((invoice) => (
              <div className="mobile-card" key={invoice.invoice_id}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedInvoices.has(invoice.invoice_id)}
                    onChange={() => toggleInvoiceSelection(invoice.invoice_id)}
                    disabled={bulkLoading}
                    aria-label={`Sélectionner la facture ${invoice.invoice_number}`}
                  />
                  <span className="card-meta">Sélectionner</span>
                </label>
                <div className="mobile-card-title">Facture {invoice.invoice_number}</div>
                <div className="mobile-card-meta">Échéance : {invoice.due_date ?? ""}</div>
                <div className="table-actions">
                  <StatusBadge status={invoice.payment_status} />
                  <span className="tag">{invoice.total_amount ? `$${invoice.total_amount}` : "$0"}</span>
                </div>
                <div className="table-actions">
                  <a className="button-ghost" href={`/api/invoices/${invoice.invoice_id}/pdf`}>
                    Télécharger
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h3 className="card-title">Créer une facture</h3>
            <InvoiceForm />
          </div>
          <div className="card">
            <h3 className="card-title">Envoyer une facture</h3>
            <form className="form-grid" onSubmit={submitSend}>
              <div className="form-row">
                <label className="label" htmlFor="sendInvoiceId">ID facture</label>
                <input
                  id="sendInvoiceId"
                  className="input"
                  list="invoice-picker"
                  value={sendForm.invoiceId}
                  onChange={(event) => setSendForm({ ...sendForm, invoiceId: event.target.value })}
                  required
                />
                <datalist id="invoice-picker">
                  {visibleInvoices.map((invoice) => {
                    const label = [invoice.invoice_number, invoice.due_date].filter(Boolean).join(" · ");
                    return (
                      <option
                        key={invoice.invoice_id}
                        value={invoice.invoice_id}
                        label={label || invoice.invoice_id}
                      />
                    );
                  })}
                </datalist>
                {invoices.length > invoiceLimit ? (
                  <button
                    className="button-ghost"
                    type="button"
                    onClick={() => setInvoiceLimit((prev) => prev + 50)}
                  >
                    Afficher plus de factures
                  </button>
                ) : null}
              </div>
              <div className="form-row">
                <label className="label" htmlFor="sendTo">Destinataire</label>
                <input
                  id="sendTo"
                  className="input"
                  value={sendForm.to}
                  onChange={(event) => setSendForm({ ...sendForm, to: event.target.value })}
                  required
                />
              </div>
              <div className="grid-2">
                <div className="form-row">
                  <label className="label" htmlFor="sendChannel">Canal</label>
                  <select
                    id="sendChannel"
                    className="select"
                    value={sendForm.channel}
                    onChange={(event) => setSendForm({ ...sendForm, channel: event.target.value })}
                  >
                    <option value="email">Courriel</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="sendSubject">Sujet</label>
                  <input
                    id="sendSubject"
                    className="input"
                    value={sendForm.subject}
                    onChange={(event) => setSendForm({ ...sendForm, subject: event.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="sendBody">Message</label>
                <textarea
                  id="sendBody"
                  className="textarea"
                  value={sendForm.body}
                  onChange={(event) => setSendForm({ ...sendForm, body: event.target.value })}
                />
              </div>
              <button className="button-primary" type="submit">Envoyer la facture</button>
              {sendStatus ? <div className="hint">{sendStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Enregistrer un paiement</h3>
            <form className="form-grid" onSubmit={submitPayment}>
              <div className="form-row">
                <label className="label" htmlFor="paymentInvoiceId">ID facture</label>
                <input
                  id="paymentInvoiceId"
                  className="input"
                  list="invoice-picker"
                  value={paymentForm.invoiceId}
                  onChange={(event) => setPaymentForm({ ...paymentForm, invoiceId: event.target.value })}
                  required
                />
              </div>
              <div className="grid-2">
                <div className="form-row">
                  <label className="label" htmlFor="paymentStatus">Statut</label>
                  <select
                    id="paymentStatus"
                    className="select"
                    value={paymentForm.status}
                    onChange={(event) => setPaymentForm({ ...paymentForm, status: event.target.value })}
                  >
                    <option value="paid">Payée</option>
                    <option value="partially_paid">Partiellement payée</option>
                    <option value="overdue">En retard</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="paidAmount">Montant payé</label>
                  <input
                    id="paidAmount"
                    className="input"
                    type="number"
                    value={paymentForm.paidAmount}
                    onChange={(event) => setPaymentForm({ ...paymentForm, paidAmount: event.target.value })}
                  />
                </div>
              </div>
              <button className="button-primary" type="submit">Enregistrer le paiement</button>
              {paymentStatus ? <div className="hint">{paymentStatus}</div> : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
