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

const statusLabels: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
};

const typeLabels: Record<string, string> = {
  residential: "Résidentiel",
  commercial: "Commercial",
  industrial: "Industriel",
};

const directionLabels: Record<string, string> = {
  inbound: "Entrant",
  outbound: "Sortant",
};

const complaintTypeOptions = [
  { value: "cleanliness", label: "Propreté" },
  { value: "damage", label: "Dommages" },
  { value: "no_show", label: "Absence" },
  { value: "billing", label: "Facturation" },
  { value: "other", label: "Autre" },
];

const recommendedActionOptions = [
  { value: "prepayment_required", label: "Pré-paiement requis" },
  { value: "credit_hold", label: "Blocage de crédit" },
  { value: "manager_review", label: "Révision par gestionnaire" },
  { value: "no_action", label: "Aucune action" },
];

const formatBalance = (value?: number | null) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(value ?? 0);

const formatServiceDate = (value?: string | null) => {
  if (!value) return "";
  const raw = value.length <= 10 ? `${value}T00:00:00` : value;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-CA");
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
      setBlacklistStatus(json.error ?? "Impossible d'ajouter à la liste noire");
      return;
    }
    setBlacklistStatus("Client ajouté à la liste noire.");
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
      setComplaintStatus(json.error ?? "Impossible de déposer la plainte");
      return;
    }
    setComplaintStatus("Plainte enregistrée.");
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
      setSmsStatus(json.error ?? "Impossible d'envoyer le SMS");
      return;
    }
    setSmsStatus("SMS envoyé.");
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
      setEmailStatus(json.error ?? "Impossible d'envoyer le courriel");
      return;
    }
    setEmailStatus("Courriel envoyé.");
    setEmailForm({ to: "", subject: "", html: "" });
  }

  return (
    <div className="page">
      <TopBar
        title="Clients"
        subtitle="Aperçu CRM et santé des comptes"
        actions={<button className="button-primary" type="button">Ajouter un client</button>}
      />
      <div className="stack">
        <div className="card">
          <table className="table table-desktop">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Dernier service</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const typeLabel = typeLabels[customer.customer_type] ?? customer.customer_type;
                const statusLabel = statusLabels[customer.status] ?? customer.status;
                return (
                  <tr key={customer.customer_id}>
                    <td>{customer.first_name} {customer.last_name}</td>
                    <td>{typeLabel}</td>
                    <td>
                      <StatusBadge status={statusLabel} />
                    </td>
                    <td>{formatServiceDate(customer.last_service_date)}</td>
                    <td>{formatBalance(customer.account_balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="card-list-mobile" style={{ marginTop: 12 }}>
            {customers.map((customer) => {
              const typeLabel = typeLabels[customer.customer_type] ?? customer.customer_type;
              const statusLabel = statusLabels[customer.status] ?? customer.status;
              return (
                <div className="mobile-card" key={customer.customer_id}>
                  <div className="mobile-card-title">
                    {customer.first_name} {customer.last_name}
                  </div>
                  <div className="mobile-card-meta">{typeLabel}</div>
                  <div className="mobile-card-meta">Dernier service : {formatServiceDate(customer.last_service_date)}</div>
                  <div className="table-actions">
                    <StatusBadge status={statusLabel} />
                    <span className="tag">{formatBalance(customer.account_balance)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h3 className="card-title">Nouveau client</h3>
            <CustomerForm />
          </div>
          <div className="card">
            <h3 className="card-title">Mettre sur liste noire</h3>
            <form className="form-grid" onSubmit={submitBlacklist}>
              <div className="form-row">
                <label className="label" htmlFor="blacklistCustomer">ID client</label>
                <input
                  id="blacklistCustomer"
                  className="input"
                  value={blacklistForm.customerId}
                  onChange={(event) => setBlacklistForm({ ...blacklistForm, customerId: event.target.value })}
                  required
                />
              </div>
              <div className="stack">
                <div className="form-row">
                  <label className="label" htmlFor="blacklistReason">Raison</label>
                  <select
                    id="blacklistReason"
                    className="select"
                    value={blacklistForm.reason}
                    onChange={(event) => setBlacklistForm({ ...blacklistForm, reason: event.target.value })}
                  >
                    <option value="non_payment">Non paiement</option>
                    <option value="dispute">Litige</option>
                    <option value="difficult_customer">Client difficile</option>
                    <option value="fraud">Fraude</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="riskLevel">Niveau de risque</label>
                  <select
                    id="riskLevel"
                    className="select"
                    value={blacklistForm.riskLevel}
                    onChange={(event) => setBlacklistForm({ ...blacklistForm, riskLevel: event.target.value })}
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyen</option>
                    <option value="high">Élevé</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="recommendedAction">Action recommandée</label>
                <select
                  id="recommendedAction"
                  className="select"
                  value={blacklistForm.recommendedAction}
                  onChange={(event) =>
                    setBlacklistForm({ ...blacklistForm, recommendedAction: event.target.value })
                  }
                >
                  {recommendedActionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
              <button className="button-primary" type="submit">Enregistrer la liste noire</button>
              {blacklistStatus ? <div className="hint">{blacklistStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Déposer une plainte</h3>
            <form className="form-grid" onSubmit={submitComplaint}>
              <div className="form-row">
                <label className="label" htmlFor="complaintCustomer">ID client</label>
                <input
                  id="complaintCustomer"
                  className="input"
                  value={complaintForm.customerId}
                  onChange={(event) => setComplaintForm({ ...complaintForm, customerId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="complaintJob">ID travail</label>
                <input
                  id="complaintJob"
                  className="input"
                  value={complaintForm.jobId}
                  onChange={(event) => setComplaintForm({ ...complaintForm, jobId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="complaintType">Type de plainte</label>
                <select
                  id="complaintType"
                  className="select"
                  value={complaintForm.complaintType}
                  onChange={(event) => setComplaintForm({ ...complaintForm, complaintType: event.target.value })}
                >
                  {complaintTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="complaintSeverity">Gravité</label>
                <select
                  id="complaintSeverity"
                  className="select"
                  value={complaintForm.severity}
                  onChange={(event) => setComplaintForm({ ...complaintForm, severity: event.target.value })}
                >
                  <option value="minor">Mineure</option>
                  <option value="major">Majeure</option>
                  <option value="critical">Critique</option>
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
              <button className="button-primary" type="submit">Soumettre la plainte</button>
              {complaintStatus ? <div className="hint">{complaintStatus}</div> : null}
            </form>
          </div>
          <div className="card">
            <h3 className="card-title">Communications</h3>
            <form className="form-grid" onSubmit={submitSms}>
              <div className="form-row">
                <label className="label" htmlFor="smsTo">SMS à</label>
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
              <button className="button-primary" type="submit">Envoyer le SMS</button>
              {smsStatus ? <div className="hint">{smsStatus}</div> : null}
            </form>

            <form className="form-grid" onSubmit={submitEmail} style={{ marginTop: 20 }}>
              <div className="form-row">
                <label className="label" htmlFor="emailTo">Courriel à</label>
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
                <label className="label" htmlFor="emailSubject">Sujet</label>
                <input
                  id="emailSubject"
                  className="input"
                  value={emailForm.subject}
                  onChange={(event) => setEmailForm({ ...emailForm, subject: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="emailBody">Message</label>
                <textarea
                  id="emailBody"
                  className="textarea"
                  value={emailForm.html}
                  onChange={(event) => setEmailForm({ ...emailForm, html: event.target.value })}
                  required
                />
              </div>
              <button className="button-secondary" type="submit">Envoyer le courriel</button>
              {emailStatus ? <div className="hint">{emailStatus}</div> : null}
            </form>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title">Journal SMS</div>
              <div className="list" style={{ marginTop: 12 }}>
                {smsMessages.map((sms) => {
                  const directionLabel = directionLabels[sms.direction] ?? sms.direction;
                  return (
                    <div className="list-item" key={sms.sms_id}>
                      <div>
                        <strong>{sms.phone_number}</strong>
                        <div className="card-meta">{sms.content}</div>
                        <div className="card-meta">{new Date(sms.created_at).toLocaleString("fr-CA")}</div>
                      </div>
                      <span className="tag">{directionLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
