"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import InvoiceForm from "@/components/forms/InvoiceForm";
import { useEffect, useState } from "react";

type InvoiceRow = {
  invoice_id: string;
  invoice_number: string;
  payment_status: string;
  total_amount?: number;
  due_date?: string;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [sendStatus, setSendStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [sendForm, setSendForm] = useState({
    invoiceId: "",
    to: "",
    subject: "Invoice from Entretien Prestige",
    body: "Your invoice is ready. Thank you for your business.",
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

  async function loadInvoices() {
    const response = await fetch("/api/invoices");
    const json = await response.json().catch(() => ({ data: [] }));
    setInvoices(json.data ?? []);
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
      setSendStatus(json.error ?? "Unable to send invoice");
      return;
    }
    setSendStatus("Invoice sent.");
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
      setPaymentStatus(json.error ?? "Unable to record payment");
      return;
    }
    setPaymentStatus("Payment recorded.");
    setPaymentForm({ invoiceId: "", status: "paid", paidAmount: "" });
    void loadInvoices();
  }

  return (
    <div className="page">
      <TopBar
        title="Invoices"
        subtitle="Billing status and collections"
        actions={<button className="button-primary" type="button">New invoice</button>}
      />

      <div className="grid-2">
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Due date</th>
                <th>Status</th>
                <th>Total</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.invoice_id}>
                  <td>{invoice.invoice_number}</td>
                  <td>{invoice.due_date ?? ""}</td>
                  <td>
                    <StatusBadge status={invoice.payment_status} />
                  </td>
                  <td>{invoice.total_amount ? `$${invoice.total_amount}` : "$0"}</td>
                  <td>
                    <a className="button-ghost" href={`/api/invoices/${invoice.invoice_id}/pdf`}>
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="stack">
          <div className="card">
            <h3 className="card-title">Create invoice</h3>
            <InvoiceForm />
          </div>
          <div className="card">
            <h3 className="card-title">Send invoice</h3>
            <form className="form-grid" onSubmit={submitSend}>
              <div className="form-row">
                <label className="label" htmlFor="sendInvoiceId">Invoice ID</label>
                <input
                  id="sendInvoiceId"
                  className="input"
                  value={sendForm.invoiceId}
                  onChange={(event) => setSendForm({ ...sendForm, invoiceId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="sendTo">To</label>
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
                  <label className="label" htmlFor="sendChannel">Channel</label>
                  <select
                    id="sendChannel"
                    className="select"
                    value={sendForm.channel}
                    onChange={(event) => setSendForm({ ...sendForm, channel: event.target.value })}
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="sendSubject">Subject</label>
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
              <button className="button-primary" type="submit">Send invoice</button>
              {sendStatus ? <div className="hint">{sendStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Record payment</h3>
            <form className="form-grid" onSubmit={submitPayment}>
              <div className="form-row">
                <label className="label" htmlFor="paymentInvoiceId">Invoice ID</label>
                <input
                  id="paymentInvoiceId"
                  className="input"
                  value={paymentForm.invoiceId}
                  onChange={(event) => setPaymentForm({ ...paymentForm, invoiceId: event.target.value })}
                  required
                />
              </div>
              <div className="grid-2">
                <div className="form-row">
                  <label className="label" htmlFor="paymentStatus">Status</label>
                  <select
                    id="paymentStatus"
                    className="select"
                    value={paymentForm.status}
                    onChange={(event) => setPaymentForm({ ...paymentForm, status: event.target.value })}
                  >
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partial</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="paidAmount">Paid amount</label>
                  <input
                    id="paidAmount"
                    className="input"
                    type="number"
                    value={paymentForm.paidAmount}
                    onChange={(event) => setPaymentForm({ ...paymentForm, paidAmount: event.target.value })}
                  />
                </div>
              </div>
              <button className="button-primary" type="submit">Record payment</button>
              {paymentStatus ? <div className="hint">{paymentStatus}</div> : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
