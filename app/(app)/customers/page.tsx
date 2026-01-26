"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import CustomerForm from "@/components/forms/CustomerForm";
import { useEffect, useState } from "react";

type CustomerRow = {
  customer_id: string;
  first_name: string;
  last_name: string;
  status: string;
  customer_type: string;
  last_service_date?: string;
  account_balance?: number;
};

type SmsRow = {
  sms_id: string;
  phone_number: string;
  content: string;
  direction: string;
  status: string;
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [blacklistStatus, setBlacklistStatus] = useState("");
  const [complaintStatus, setComplaintStatus] = useState("");
  const [smsStatus, setSmsStatus] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [blacklistForm, setBlacklistForm] = useState({
    customerId: "",
    reason: "non_payment",
    riskLevel: "medium",
    description: "",
    recommendedAction: "prepayment_required",
  });
  const [complaintForm, setComplaintForm] = useState({
    customerId: "",
    jobId: "",
    complaintType: "cleanliness",
    description: "",
    severity: "major",
  });
  const [smsForm, setSmsForm] = useState({ to: "", message: "" });
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", html: "" });
  const [smsMessages, setSmsMessages] = useState<SmsRow[]>([]);

  useEffect(() => {
    void loadCustomers();
  }, []);

  async function loadCustomers() {
    const response = await fetch("/api/customers");
    const json = await response.json().catch(() => ({ data: [] }));
    setCustomers(json.data ?? []);
    const smsResponse = await fetch("/api/sms/list");
    if (smsResponse.ok) {
      const smsJson = await smsResponse.json().catch(() => ({ data: [] }));
      setSmsMessages(smsJson.data ?? []);
    }
  }

  async function submitBlacklist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBlacklistStatus("");
    const response = await fetch(`/api/customers/${blacklistForm.customerId}/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: blacklistForm.reason,
        description: blacklistForm.description,
        riskLevel: blacklistForm.riskLevel,
        recommendedAction: blacklistForm.recommendedAction,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setBlacklistStatus(json.error ?? "Unable to blacklist");
      return;
    }
    setBlacklistStatus("Customer blacklisted.");
    setBlacklistForm({
      customerId: "",
      reason: "non_payment",
      riskLevel: "medium",
      description: "",
      recommendedAction: "prepayment_required",
    });
  }

  async function submitComplaint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setComplaintStatus("");
    const response = await fetch(`/api/customers/${complaintForm.customerId}/complaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: complaintForm.jobId,
        complaintType: complaintForm.complaintType,
        description: complaintForm.description,
        severity: complaintForm.severity,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setComplaintStatus(json.error ?? "Unable to file complaint");
      return;
    }
    setComplaintStatus("Complaint logged.");
    setComplaintForm({
      customerId: "",
      jobId: "",
      complaintType: "cleanliness",
      description: "",
      severity: "major",
    });
  }

  async function submitSms(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSmsStatus("");
    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smsForm),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSmsStatus(json.error ?? "Unable to send SMS");
      return;
    }
    setSmsStatus("SMS sent.");
    setSmsForm({ to: "", message: "" });
    void loadCustomers();
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailStatus("");
    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailForm),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setEmailStatus(json.error ?? "Unable to send email");
      return;
    }
    setEmailStatus("Email sent.");
    setEmailForm({ to: "", subject: "", html: "" });
  }

  return (
    <div className="page">
      <TopBar
        title="Customers"
        subtitle="CRM overview and account health"
        actions={<button className="button-primary" type="button">Add customer</button>}
      />
      <div className="grid-2">
        <div className="card">
          <table className="table table-desktop">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last service</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customer_id}>
                  <td>{customer.first_name} {customer.last_name}</td>
                  <td>{customer.customer_type}</td>
                  <td>
                    <StatusBadge status={customer.status} />
                  </td>
                  <td>{customer.last_service_date ?? ""}</td>
                  <td>{customer.account_balance ? `$${customer.account_balance}` : "$0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-list-mobile" style={{ marginTop: 12 }}>
            {customers.map((customer) => (
              <div className="mobile-card" key={customer.customer_id}>
                <div className="mobile-card-title">
                  {customer.first_name} {customer.last_name}
                </div>
                <div className="mobile-card-meta">{customer.customer_type}</div>
                <div className="mobile-card-meta">Last service: {customer.last_service_date ?? ""}</div>
                <div className="table-actions">
                  <StatusBadge status={customer.status} />
                  <span className="tag">{customer.account_balance ? `$${customer.account_balance}` : "$0"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h3 className="card-title">New customer</h3>
            <CustomerForm />
          </div>
          <div className="card">
            <h3 className="card-title">Blacklist customer</h3>
            <form className="form-grid" onSubmit={submitBlacklist}>
              <div className="form-row">
                <label className="label" htmlFor="blacklistCustomer">Customer ID</label>
                <input
                  id="blacklistCustomer"
                  className="input"
                  value={blacklistForm.customerId}
                  onChange={(event) => setBlacklistForm({ ...blacklistForm, customerId: event.target.value })}
                  required
                />
              </div>
              <div className="grid-2">
                <div className="form-row">
                  <label className="label" htmlFor="blacklistReason">Reason</label>
                  <select
                    id="blacklistReason"
                    className="select"
                    value={blacklistForm.reason}
                    onChange={(event) => setBlacklistForm({ ...blacklistForm, reason: event.target.value })}
                  >
                    <option value="non_payment">Non payment</option>
                    <option value="dispute">Dispute</option>
                    <option value="difficult_customer">Difficult customer</option>
                    <option value="fraud">Fraud</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="riskLevel">Risk level</label>
                  <select
                    id="riskLevel"
                    className="select"
                    value={blacklistForm.riskLevel}
                    onChange={(event) => setBlacklistForm({ ...blacklistForm, riskLevel: event.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="recommendedAction">Recommended action</label>
                <input
                  id="recommendedAction"
                  className="input"
                  value={blacklistForm.recommendedAction}
                  onChange={(event) =>
                    setBlacklistForm({ ...blacklistForm, recommendedAction: event.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="blacklistDescription">Description</label>
                <textarea
                  id="blacklistDescription"
                  className="textarea"
                  value={blacklistForm.description}
                  onChange={(event) => setBlacklistForm({ ...blacklistForm, description: event.target.value })}
                />
              </div>
              <button className="button-primary" type="submit">Save blacklist</button>
              {blacklistStatus ? <div className="hint">{blacklistStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">File complaint</h3>
            <form className="form-grid" onSubmit={submitComplaint}>
              <div className="form-row">
                <label className="label" htmlFor="complaintCustomer">Customer ID</label>
                <input
                  id="complaintCustomer"
                  className="input"
                  value={complaintForm.customerId}
                  onChange={(event) => setComplaintForm({ ...complaintForm, customerId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="complaintJob">Job ID</label>
                <input
                  id="complaintJob"
                  className="input"
                  value={complaintForm.jobId}
                  onChange={(event) => setComplaintForm({ ...complaintForm, jobId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="complaintType">Complaint type</label>
                <input
                  id="complaintType"
                  className="input"
                  value={complaintForm.complaintType}
                  onChange={(event) => setComplaintForm({ ...complaintForm, complaintType: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="complaintSeverity">Severity</label>
                <select
                  id="complaintSeverity"
                  className="select"
                  value={complaintForm.severity}
                  onChange={(event) => setComplaintForm({ ...complaintForm, severity: event.target.value })}
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="complaintDesc">Description</label>
                <textarea
                  id="complaintDesc"
                  className="textarea"
                  value={complaintForm.description}
                  onChange={(event) => setComplaintForm({ ...complaintForm, description: event.target.value })}
                />
              </div>
              <button className="button-primary" type="submit">Submit complaint</button>
              {complaintStatus ? <div className="hint">{complaintStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Communications</h3>
            <form className="form-grid" onSubmit={submitSms}>
              <div className="form-row">
                <label className="label" htmlFor="smsTo">SMS to</label>
                <input
                  id="smsTo"
                  className="input"
                  value={smsForm.to}
                  onChange={(event) => setSmsForm({ ...smsForm, to: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="smsMessage">Message</label>
                <textarea
                  id="smsMessage"
                  className="textarea"
                  value={smsForm.message}
                  onChange={(event) => setSmsForm({ ...smsForm, message: event.target.value })}
                  required
                />
              </div>
              <button className="button-primary" type="submit">Send SMS</button>
              {smsStatus ? <div className="hint">{smsStatus}</div> : null}
            </form>

            <form className="form-grid" onSubmit={submitEmail} style={{ marginTop: 20 }}>
              <div className="form-row">
                <label className="label" htmlFor="emailTo">Email to</label>
                <input
                  id="emailTo"
                  className="input"
                  type="email"
                  value={emailForm.to}
                  onChange={(event) => setEmailForm({ ...emailForm, to: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="emailSubject">Subject</label>
                <input
                  id="emailSubject"
                  className="input"
                  value={emailForm.subject}
                  onChange={(event) => setEmailForm({ ...emailForm, subject: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="emailBody">Body</label>
                <textarea
                  id="emailBody"
                  className="textarea"
                  value={emailForm.html}
                  onChange={(event) => setEmailForm({ ...emailForm, html: event.target.value })}
                  required
                />
              </div>
              <button className="button-secondary" type="submit">Send email</button>
              {emailStatus ? <div className="hint">{emailStatus}</div> : null}
            </form>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title">SMS log</div>
              <div className="list" style={{ marginTop: 12 }}>
                {smsMessages.map((sms) => (
                  <div className="list-item" key={sms.sms_id}>
                    <div>
                      <strong>{sms.phone_number}</strong>
                      <div className="card-meta">{sms.content}</div>
                      <div className="card-meta">{new Date(sms.created_at).toLocaleString()}</div>
                    </div>
                    <span className="tag">{sms.direction}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
