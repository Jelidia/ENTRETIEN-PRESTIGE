"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import CustomerForm from "@/components/forms/CustomerForm";
import { normalizePhoneE164 } from "@/lib/smsTemplates";
import { useCallback, useEffect, useMemo, useState } from "react";

type CustomerRow = {
  customer_id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  status: string;
  customer_type: string;
  last_service_date?: string;
  account_balance?: number;
};

type JobOption = {
  job_id: string;
  service_type?: string | null;
  scheduled_date?: string | null;
  customer_id?: string | null;
};

type SmsRow = {
  sms_id: string;
  phone_number: string;
  content: string;
  direction: string;
  status: string;
  created_at: string;
};

type TimelineEvent = {
  id: string;
  title: string;
  detail: string;
  timestamp: number;
  timestampLabel: string;
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

const normalizePhone = (value?: string | null) => (value ? value.replace(/\s+/g, "") : "");
const normalizePhoneDigits = (value?: string | null) => (value ? value.replace(/\D/g, "") : "");

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [customerLimit, setCustomerLimit] = useState(25);
  const [jobLimit, setJobLimit] = useState(50);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
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
  const [portalForm, setPortalForm] = useState({
    customerId: "",
    expiresInDays: "14",
  });
  const [portalStatus, setPortalStatus] = useState("");
  const [portalLink, setPortalLink] = useState("");
  const [portalExpiry, setPortalExpiry] = useState("");
  const [portalCustomerName, setPortalCustomerName] = useState("");

  const toggleQuickView = (customerId: string) => {
    setQuickViewId((prev) => (prev === customerId ? null : customerId));
  };

  useEffect(() => {
    void loadCustomers();
    void loadJobs();
  }, []);

  useEffect(() => {
    setSelectedCustomers((prev) => {
      if (!prev.size) return prev;
      const validIds = new Set(customers.map((customer) => customer.customer_id));
      return new Set(Array.from(prev).filter((id) => validIds.has(id)));
    });
  }, [customers]);

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

  async function loadJobs() {
    const response = await fetch("/api/jobs");
    const json = await response.json().catch(() => ({ data: [] }));
    const data = Array.isArray(json.data) ? json.data : [];
    setJobs(data);
  }

  const visibleCustomers = useMemo(() => customers.slice(0, customerLimit), [customers, customerLimit]);
  const visibleJobs = useMemo(() => jobs.slice(0, jobLimit), [jobs, jobLimit]);
  const filteredCustomers = useMemo(() => {
    const trimmed = filterQuery.trim().toLowerCase();
    if (!trimmed) return customers;
    return customers.filter((customer) => {
      const haystack = [
        customer.first_name,
        customer.last_name,
        customer.phone,
        typeLabels[customer.customer_type],
        statusLabels[customer.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [customers, filterQuery]);

  const smsByPhone = useMemo(() => {
    const map = new Map<string, SmsRow[]>();
    smsMessages.forEach((sms) => {
      const key = normalizePhoneDigits(sms.phone_number);
      if (!key) return;
      const list = map.get(key) ?? [];
      list.push(sms);
      map.set(key, list);
    });
    return map;
  }, [smsMessages]);

  const jobsByCustomer = useMemo(() => {
    const map = new Map<string, JobOption[]>();
    jobs.forEach((job) => {
      if (!job.customer_id) return;
      const list = map.get(job.customer_id) ?? [];
      list.push(job);
      map.set(job.customer_id, list);
    });
    return map;
  }, [jobs]);

  const getCustomerTimeline = useCallback(
    (customer: CustomerRow): TimelineEvent[] => {
      const events: TimelineEvent[] = [];
      const phoneKey = normalizePhoneDigits(customer.phone);
      const smsList = phoneKey ? smsByPhone.get(phoneKey) ?? [] : [];
      smsList.forEach((sms) => {
        const createdAt = new Date(sms.created_at);
        const timestamp = Number.isNaN(createdAt.getTime()) ? 0 : createdAt.getTime();
        const directionLabel = directionLabels[sms.direction] ?? sms.direction;
        events.push({
          id: `sms-${sms.sms_id}`,
          title: `SMS ${directionLabel}`,
          detail: sms.content,
          timestamp,
          timestampLabel: Number.isNaN(createdAt.getTime()) ? sms.created_at : createdAt.toLocaleString("fr-CA"),
        });
      });

      const jobList = jobsByCustomer.get(customer.customer_id) ?? [];
      jobList.forEach((job) => {
        const dateLabel = formatServiceDate(job.scheduled_date) || "Date à confirmer";
        const timestamp = job.scheduled_date ? new Date(`${job.scheduled_date}T00:00:00`).getTime() : 0;
        const serviceLabel = job.service_type || "Travail";
        events.push({
          id: `job-${job.job_id}`,
          title: `Travail · ${serviceLabel}`,
          detail: `Prévu le ${dateLabel}`,
          timestamp,
          timestampLabel: dateLabel,
        });
      });

      events.sort((a, b) => b.timestamp - a.timestamp);
      return events.slice(0, 6);
    },
    [jobsByCustomer, smsByPhone]
  );

  useEffect(() => {
    setSelectedCustomers((prev) => {
      if (!prev.size) return prev;
      const validIds = new Set(filteredCustomers.map((customer) => customer.customer_id));
      return new Set(Array.from(prev).filter((id) => validIds.has(id)));
    });
  }, [filteredCustomers]);

  const selectedCount = useMemo(
    () => filteredCustomers.filter((customer) => selectedCustomers.has(customer.customer_id)).length,
    [filteredCustomers, selectedCustomers]
  );
  const allSelected = filteredCustomers.length > 0 && selectedCount === filteredCustomers.length;

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

  function toggleCustomerSelection(customerId: string) {
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  }

  function toggleAllCustomers() {
    setSelectedCustomers((prev) => {
      if (filteredCustomers.length === 0) return prev;
      const next = new Set(prev);
      const hasAll = filteredCustomers.every((customer) => next.has(customer.customer_id));
      if (hasAll) {
        filteredCustomers.forEach((customer) => next.delete(customer.customer_id));
        return next;
      }
      filteredCustomers.forEach((customer) => next.add(customer.customer_id));
      return next;
    });
  }

  async function bulkSendSms() {
    if (!selectedCount) {
      setBulkStatus("Aucun client sélectionné.");
      return;
    }
    if (!bulkMessage.trim()) {
      setBulkStatus("Ajoutez un message SMS.");
      return;
    }
    const selectedRows = filteredCustomers.filter((customer) => selectedCustomers.has(customer.customer_id));
    const targets = selectedRows
      .map((customer) => ({
        id: customer.customer_id,
        phone: normalizePhoneE164(customer.phone ?? ""),
      }))
      .filter((target) => Boolean(target.phone)) as Array<{ id: string; phone: string }>;
    const invalidCount = selectedRows.length - targets.length;
    if (!targets.length) {
      setBulkStatus("Aucun numéro valide pour l'envoi.");
      return;
    }

    const uniqueTargets = Array.from(
      new Map(targets.map((target) => [target.phone, target])).values()
    );

    setBulkLoading(true);
    setBulkStatus("");
    let successCount = 0;
    await Promise.all(
      uniqueTargets.map(async (target) => {
        try {
          const response = await fetch("/api/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: target.phone, message: bulkMessage.trim() }),
          });
          if (response.ok) {
            successCount += 1;
          }
        } catch {
          return null;
        }
        return null;
      })
    );
    const suffix = invalidCount ? ` · ${invalidCount} sans numéro valide.` : "";
    setBulkStatus(
      successCount === uniqueTargets.length
        ? `SMS envoyés à ${successCount} clients.${suffix}`
        : `SMS envoyés: ${successCount}/${uniqueTargets.length}.${suffix}`
    );
    setBulkLoading(false);
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

  async function submitPortalLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPortalStatus("");
    setPortalLink("");
    setPortalExpiry("");
    setPortalCustomerName("");
    const expiresInDays = Number.parseInt(portalForm.expiresInDays, 10);
    const payload: { customerId: string; expiresInDays?: number } = {
      customerId: portalForm.customerId,
    };
    if (Number.isFinite(expiresInDays) && expiresInDays > 0) {
      payload.expiresInDays = expiresInDays;
    }
    const response = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPortalStatus(json.error ?? "Impossible de générer le lien");
      return;
    }
    setPortalLink(json.link ?? "");
    setPortalExpiry(json.expires_at ?? "");
    setPortalCustomerName(json.customer_name ?? "");
    setPortalStatus("Lien généré.");
  }

  async function copyPortalLink() {
    if (!portalLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(portalLink);
      setPortalStatus("Lien copié.");
    } catch {
      setPortalStatus("Copie impossible.");
    }
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
          <div
            className="table-actions"
            style={{ justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap" }}
          >
            <input
              className="input"
              style={{ flex: "1 1 220px", minWidth: 220 }}
              placeholder="Rechercher un client (nom, téléphone, statut)"
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAllCustomers}
                disabled={bulkLoading || filteredCustomers.length === 0}
                aria-label="Tout sélectionner"
              />
              <span className="card-meta">Tout sélectionner (filtre)</span>
            </label>
            {selectedCount ? <span className="tag">{selectedCount} sélectionnés</span> : null}
          </div>
          {selectedCount ? (
            <div className="stack" style={{ marginBottom: 12 }}>
              <div className="form-row">
                <label className="label" htmlFor="bulkSmsMessage">Message SMS (diffusion)</label>
                <textarea
                  id="bulkSmsMessage"
                  className="textarea"
                  value={bulkMessage}
                  onChange={(event) => setBulkMessage(event.target.value)}
                  rows={2}
                  placeholder="Ex. Fermeture exceptionnelle lundi prochain."
                  disabled={bulkLoading}
                />
              </div>
              <div className="table-actions">
                <button
                  className="button-secondary"
                  type="button"
                  onClick={bulkSendSms}
                  disabled={bulkLoading}
                >
                  Diffuser le SMS
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
                    onChange={toggleAllCustomers}
                    disabled={bulkLoading || filteredCustomers.length === 0}
                    aria-label="Tout sélectionner"
                  />
                </th>
                <th>Nom</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Dernier service</th>
                <th>Solde</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const typeLabel = typeLabels[customer.customer_type] ?? customer.customer_type;
                const statusLabel = statusLabels[customer.status] ?? customer.status;
                const phone = customer.phone ?? "";
                const phoneHref = normalizePhone(phone);
                const lastServiceLabel = formatServiceDate(customer.last_service_date) || "-";
                const balanceLabel = formatBalance(customer.account_balance);
                const isQuickViewOpen = quickViewId === customer.customer_id;
                const timeline = isQuickViewOpen ? getCustomerTimeline(customer) : [];
                return (
                  <tr key={customer.customer_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCustomers.has(customer.customer_id)}
                        onChange={() => toggleCustomerSelection(customer.customer_id)}
                        disabled={bulkLoading}
                        aria-label={`Sélectionner le client ${customer.first_name} ${customer.last_name}`}
                      />
                    </td>
                    <td>{customer.first_name} {customer.last_name}</td>
                    <td>{typeLabel}</td>
                    <td>
                      <StatusBadge status={statusLabel} />
                    </td>
                    <td>{lastServiceLabel}</td>
                    <td>{balanceLabel}</td>
                    <td>
                      <div className="quick-view-wrap">
                        <div className="table-actions">
                          <button
                            className="button-ghost"
                            type="button"
                            onClick={() => toggleQuickView(customer.customer_id)}
                          >
                            {isQuickViewOpen ? "Fermer" : "Aperçu"}
                          </button>
                          {phoneHref ? (
                            <>
                              <a className="button-ghost" href={`tel:${phoneHref}`}>Appeler</a>
                              <a className="button-ghost" href={`sms:${phoneHref}`}>SMS</a>
                            </>
                          ) : null}
                        </div>
                        {isQuickViewOpen ? (
                          <div className="quick-view-panel quick-view-popover">
                            <div className="card-label">Aperçu rapide</div>
                            <div className="card-meta">Type : {typeLabel}</div>
                            <div className="card-meta">Statut : {statusLabel}</div>
                            <div className="card-meta">Dernier service : {lastServiceLabel}</div>
                            <div className="card-meta">Solde : {balanceLabel}</div>
                            <div className="card-meta">Téléphone : {phone || "-"}</div>
                            <div className="card-label" style={{ marginTop: 6 }}>Historique</div>
                            {timeline.length ? (
                              timeline.map((event) => (
                                <div key={event.id}>
                                  <div className="card-meta"><strong>{event.title}</strong></div>
                                  <div className="card-meta">{event.detail}</div>
                                  <div className="card-meta">{event.timestampLabel}</div>
                                </div>
                              ))
                            ) : (
                              <div className="card-meta">Aucune interaction récente.</div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="card-list-mobile" style={{ marginTop: 12 }}>
            {filteredCustomers.map((customer) => {
              const typeLabel = typeLabels[customer.customer_type] ?? customer.customer_type;
              const statusLabel = statusLabels[customer.status] ?? customer.status;
              const phone = customer.phone ?? "";
              const phoneHref = normalizePhone(phone);
              const lastServiceLabel = formatServiceDate(customer.last_service_date) || "-";
              const balanceLabel = formatBalance(customer.account_balance);
              const isQuickViewOpen = quickViewId === customer.customer_id;
              const timeline = isQuickViewOpen ? getCustomerTimeline(customer) : [];
              return (
                <div className="mobile-card" key={customer.customer_id}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.customer_id)}
                      onChange={() => toggleCustomerSelection(customer.customer_id)}
                      disabled={bulkLoading}
                      aria-label={`Sélectionner le client ${customer.first_name} ${customer.last_name}`}
                    />
                    <span className="card-meta">Sélectionner</span>
                  </label>
                  <div className="mobile-card-title">
                    {customer.first_name} {customer.last_name}
                  </div>
                  <div className="mobile-card-meta">{typeLabel}</div>
                  {phone ? <div className="mobile-card-meta">{phone}</div> : null}
                  <div className="mobile-card-meta">Dernier service : {lastServiceLabel}</div>
                  <div className="table-actions">
                    <StatusBadge status={statusLabel} />
                    <span className="tag">{balanceLabel}</span>
                  </div>
                  <div className="table-actions">
                    <button
                      className="button-ghost"
                      type="button"
                      onClick={() => toggleQuickView(customer.customer_id)}
                    >
                      {isQuickViewOpen ? "Fermer" : "Aperçu"}
                    </button>
                    {phoneHref ? (
                      <>
                        <a className="button-ghost" href={`tel:${phoneHref}`}>Appeler</a>
                        <a className="button-ghost" href={`sms:${phoneHref}`}>SMS</a>
                      </>
                    ) : null}
                  </div>
                  {isQuickViewOpen ? (
                    <div className="quick-view-panel">
                      <div className="card-label">Aperçu rapide</div>
                      <div className="card-meta">Type : {typeLabel}</div>
                      <div className="card-meta">Statut : {statusLabel}</div>
                      <div className="card-meta">Dernier service : {lastServiceLabel}</div>
                      <div className="card-meta">Solde : {balanceLabel}</div>
                      <div className="card-meta">Téléphone : {phone || "-"}</div>
                      <div className="card-label" style={{ marginTop: 6 }}>Historique</div>
                      {timeline.length ? (
                        timeline.map((event) => (
                          <div key={event.id}>
                            <div className="card-meta"><strong>{event.title}</strong></div>
                            <div className="card-meta">{event.detail}</div>
                            <div className="card-meta">{event.timestampLabel}</div>
                          </div>
                        ))
                      ) : (
                        <div className="card-meta">Aucune interaction récente.</div>
                      )}
                    </div>
                  ) : null}
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
                  list="customers-picker"
                  value={blacklistForm.customerId}
                  onChange={(event) => setBlacklistForm({ ...blacklistForm, customerId: event.target.value })}
                  required
                />
                <datalist id="customers-picker">
                  {visibleCustomers.map((customer) => {
                    const name = `${customer.first_name} ${customer.last_name}`.trim();
                    const meta = [customer.phone, customer.customer_type].filter(Boolean).join(" · ");
                    return (
                      <option
                        key={customer.customer_id}
                        value={customer.customer_id}
                        label={[name, meta].filter(Boolean).join(" — ")}
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
                  list="customers-picker"
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
                  list="jobs-picker"
                  value={complaintForm.jobId}
                  onChange={(event) => setComplaintForm({ ...complaintForm, jobId: event.target.value })}
                  required
                />
                <datalist id="jobs-picker">
                  {visibleJobs.map((job) => {
                    const meta = [job.service_type, job.scheduled_date].filter(Boolean).join(" · ");
                    return (
                      <option key={job.job_id} value={job.job_id} label={meta || job.job_id} />
                    );
                  })}
                </datalist>
                {jobs.length > jobLimit ? (
                  <button
                    className="button-ghost"
                    type="button"
                    onClick={() => setJobLimit((prev) => prev + 50)}
                  >
                    Afficher plus de jobs
                  </button>
                ) : null}
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
            <h3 className="card-title">Portail client</h3>
            <form className="form-grid" onSubmit={submitPortalLink}>
              <div className="form-row">
                <label className="label" htmlFor="portalCustomer">ID client</label>
                <input
                  id="portalCustomer"
                  className="input"
                  list="customers-picker"
                  value={portalForm.customerId}
                  onChange={(event) => setPortalForm({ ...portalForm, customerId: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="portalExpiry">Expiration (jours)</label>
                <input
                  id="portalExpiry"
                  className="input"
                  type="number"
                  min={1}
                  max={90}
                  value={portalForm.expiresInDays}
                  onChange={(event) => setPortalForm({ ...portalForm, expiresInDays: event.target.value })}
                />
              </div>
              <button className="button-primary" type="submit">Générer le lien</button>
              {portalStatus ? <div className="hint">{portalStatus}</div> : null}
            </form>
            {portalLink ? (
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div className="form-row">
                  <label className="label" htmlFor="portalLink">Lien sécurisé</label>
                  <textarea
                    id="portalLink"
                    className="textarea"
                    value={portalLink}
                    readOnly
                  />
                </div>
                <div className="table-actions">
                  <button className="button-secondary" type="button" onClick={copyPortalLink}>
                    Copier le lien
                  </button>
                  <a className="button-ghost" href={portalLink} target="_blank" rel="noreferrer">
                    Ouvrir
                  </a>
                  {portalExpiry ? (
                    <span className="tag">Expire le {formatServiceDate(portalExpiry)}</span>
                  ) : null}
                </div>
                {portalCustomerName ? (
                  <div className="card-meta">Client: {portalCustomerName}</div>
                ) : null}
              </div>
            ) : null}
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
