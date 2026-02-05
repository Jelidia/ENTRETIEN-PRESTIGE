"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import BottomSheet from "@/components/BottomSheet";
import Pagination from "@/components/Pagination";
import LeadForm from "@/components/forms/LeadForm";
import { isQuoteExpired } from "@/lib/leads";
import { normalizePhoneE164 } from "@/lib/smsTemplates";

type Lead = {
  lead_id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  status: "new" | "contacted" | "estimated" | "won" | "lost";
  estimated_value: number;
  follow_up_date: string | null;
  quote_valid_until: string | null;
  notes: string | null;
  created_at: string | null;
};

function formatLeadDate(value?: string | null) {
  if (!value) return "";
  const raw = value.length <= 10 ? `${value}T00:00:00` : value;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-CA");
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedTab, setSelectedTab] = useState<"new" | "contacted" | "estimated" | "won" | "lost">("new");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionStatus, setActionStatus] = useState("");
  const [actionStatusTone, setActionStatusTone] = useState<"success" | "error">("success");
  const [smsDraft, setSmsDraft] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [quoteValidUntilDraft, setQuoteValidUntilDraft] = useState("");
  const itemsPerPage = 5;

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    // Filter leads by selected tab
    const filtered = leads.filter((lead) => lead.status === selectedTab);
    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [selectedTab, leads]);

  useEffect(() => {
    setActionStatus("");
    setSmsDraft("");
    setSmsSending(false);
    setQuoteValidUntilDraft(selectedLead?.quote_valid_until ?? "");
  }, [selectedLead]);

  async function loadLeads() {
    setLoading(true);
    const res = await fetch("/api/leads");
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads || []);
    }
    setLoading(false);
  }

  function applyLeadUpdate(updatedLead: Lead) {
    setLeads((prev) => prev.map((lead) => (lead.lead_id === updatedLead.lead_id ? updatedLead : lead)));
    setSelectedLead(updatedLead);
  }

  async function updateLeadStatus(leadId: string, newStatus: Lead["status"]) {
    if (newStatus === "won" && selectedLead && isQuoteExpired(selectedLead.quote_valid_until)) {
      setActionStatusTone("error");
      setActionStatus("Devis expiré. Mettez à jour la date de validité pour convertir.");
      return;
    }
    setActionStatus("");
    setActionStatusTone("success");
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const updatedLead = data.lead ?? data.data?.lead ?? null;
      if (updatedLead) {
        applyLeadUpdate(updatedLead as Lead);
      } else {
        setLeads((prev) =>
          prev.map((lead) => (lead.lead_id === leadId ? { ...lead, status: newStatus } : lead))
        );
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
      setActionStatus("Statut mis à jour.");
      void loadLeads();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionStatusTone("error");
      setActionStatus(data.error ?? "Échec de la mise à jour du lead");
    }
  }

  async function updateLeadQuoteValidity() {
    if (!selectedLead) return;
    setActionStatus("");
    setActionStatusTone("success");
    const res = await fetch(`/api/leads/${selectedLead.lead_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_valid_until: quoteValidUntilDraft || null }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const updatedLead = data.lead ?? data.data?.lead ?? null;
      if (updatedLead) {
        applyLeadUpdate(updatedLead as Lead);
      } else {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.lead_id === selectedLead.lead_id
              ? { ...lead, quote_valid_until: quoteValidUntilDraft || null }
              : lead
          )
        );
        setSelectedLead((prev) =>
          prev ? { ...prev, quote_valid_until: quoteValidUntilDraft || null } : prev
        );
      }
      setActionStatus("Validité du devis mise à jour.");
      void loadLeads();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionStatusTone("error");
      setActionStatus(data.error ?? "Échec de la mise à jour de la validité");
    }
  }

  async function callCustomer(phone: string) {
    const normalizedPhone = normalizePhoneE164(phone);
    if (!normalizedPhone) {
      setActionStatusTone("error");
      setActionStatus("Téléphone invalide. Utilisez le format (514) 555-0123.");
      return;
    }
    window.location.href = `tel:${normalizedPhone}`;
    // Log the call attempt
    if (selectedLead) {
      await fetch(`/api/leads/${selectedLead.lead_id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "call",
          notes: "Appel au client",
        }),
      });
    }
  }

  async function sendSMS() {
    if (!selectedLead) return;
    const message = smsDraft.trim();
    if (!message) {
      setActionStatusTone("error");
      setActionStatus("Message requis.");
      return;
    }
    const normalizedPhone = normalizePhoneE164(selectedLead.phone);
    if (!normalizedPhone) {
      setActionStatusTone("error");
      setActionStatus("Téléphone invalide. Utilisez le format (514) 555-0123.");
      return;
    }
    setSmsSending(true);

    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: normalizedPhone,
        message,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setActionStatusTone("success");
      setActionStatus("SMS envoye.");
      setSmsDraft("");
      await fetch(`/api/leads/${selectedLead.lead_id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sms",
          notes: message,
        }),
      });
    } else {
      setActionStatusTone("error");
      setActionStatus(data.error ?? "Échec de l'envoi du SMS");
    }
    setSmsSending(false);
  }

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabs: Array<{ key: Lead["status"]; label: string; color: string }> = [
    { key: "new", label: "Nouveau", color: "#64748b" },
    { key: "contacted", label: "Contacte", color: "#3b82f6" },
    { key: "estimated", label: "Estime", color: "#f59e0b" },
    { key: "won", label: "Gagne", color: "#10b981" },
    { key: "lost", label: "Perdu", color: "#ef4444" },
  ];
  const selectedTabLabel = tabs.find((tab) => tab.key === selectedTab)?.label ?? "";
  const quoteExpired = selectedLead ? isQuoteExpired(selectedLead.quote_valid_until) : false;

  return (
    <div className="page">
      <TopBar
        title="Leads et clients"
        subtitle="Gérer votre pipeline de ventes"
        actions={
          <button className="button-primary" onClick={() => setShowCreateForm(true)}>
            + Nouveau lead
          </button>
        }
      />

      {/* Tabs */}
      <div className="tabs-row">
        {tabs.map((tab) => {
          const count = leads.filter((l) => l.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={selectedTab === tab.key ? "button-primary" : "button-secondary"}
              style={{
                padding: "10px 16px",
                borderRadius: "999px",
                fontSize: "14px",
                whiteSpace: "nowrap",
                background: selectedTab === tab.key ? tab.color : undefined,
                borderColor: tab.color,
              }}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Leads List */}
      {loading && <p>Chargement...</p>}

      {!loading && filteredLeads.length === 0 && (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <h3>Aucun lead {selectedTabLabel.toLowerCase()}</h3>
          <p className="card-meta">Les leads apparaitront ici apres creation</p>
        </div>
      )}

      {!loading && paginatedLeads.length > 0 && (
        <>
          <div className="list" style={{ marginTop: "20px" }}>
            {paginatedLeads.map((lead) => {
              const phoneHref = normalizePhoneE164(lead.phone);
              const quoteExpired = isQuoteExpired(lead.quote_valid_until);
              return (
                <div
                  key={lead.lead_id}
                  className="list-item"
                  onClick={() => setSelectedLead(lead)}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <strong>{lead.customer_name}</strong>
                    <div className="card-meta">{lead.phone}</div>
                    <div style={{ marginTop: "8px", fontSize: "14px" }}>
                      Est. ${lead.estimated_value.toLocaleString()}
                    </div>
                    {lead.follow_up_date && (
                      <div className="card-meta" style={{ marginTop: "4px" }}>
                        Suivi: {formatLeadDate(lead.follow_up_date)}
                      </div>
                    )}
                    {lead.quote_valid_until && (
                      <div className="card-meta" style={{ marginTop: "4px" }}>
                        Validité devis: {formatLeadDate(lead.quote_valid_until)}
                      </div>
                    )}
                    {quoteExpired ? (
                      <div style={{ marginTop: "6px" }}>
                        <span className="badge badge-danger">Devis expiré</span>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: "grid", gap: "8px", justifyItems: "end" }}>
                    <span
                      className="badge"
                      style={{
                        background: tabs.find((t) => t.key === lead.status)?.color + "20",
                        color: tabs.find((t) => t.key === lead.status)?.color,
                      }}
                    >
                      {tabs.find((t) => t.key === lead.status)?.label ?? lead.status}
                    </span>
                    {phoneHref ? (
                      <div
                        className="list-item-actions"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <a
                          className="button-ghost"
                          href={`tel:${phoneHref}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Appeler
                        </a>
                        <a
                          className="button-ghost"
                          href={`sms:${phoneHref}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          SMS
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredLeads.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Create Lead Modal */}
      {showCreateForm && (
        <BottomSheet
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          title="Nouveau Lead"
          height="90%"
        >
          <LeadForm
            onSuccess={() => {
              setShowCreateForm(false);
              loadLeads();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </BottomSheet>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <BottomSheet
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title={selectedLead.customer_name}
          height="90%"
        >
          <div className="stack">
            <div className="card-muted" style={{ padding: "16px" }}>
              <div><strong>Téléphone :</strong> {selectedLead.phone}</div>
              <div style={{ marginTop: "8px" }}><strong>Courriel:</strong> {selectedLead.email || "N/A"}</div>
              <div style={{ marginTop: "8px" }}><strong>Adresse:</strong> {selectedLead.address || "N/A"}</div>
              <div style={{ marginTop: "8px" }}>
                <strong>Valeur estimée :</strong> ${selectedLead.estimated_value.toLocaleString()}
              </div>
              <div style={{ marginTop: "8px" }}>
                <strong>Statut:</strong> {tabs.find((tab) => tab.key === selectedLead.status)?.label ?? selectedLead.status}
              </div>
              {selectedLead.follow_up_date && (
                <div style={{ marginTop: "8px" }}>
                  <strong>Suivi:</strong> {formatLeadDate(selectedLead.follow_up_date)}
                </div>
              )}
              {selectedLead.quote_valid_until && (
                <div style={{ marginTop: "8px" }}>
                  <strong>Validité du devis :</strong> {formatLeadDate(selectedLead.quote_valid_until)}
                  {quoteExpired ? (
                    <span className="badge badge-danger" style={{ marginLeft: "8px" }}>
                      Expiré
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {selectedLead.notes && (
              <div>
                <h4>Notes</h4>
                <p className="card-meta">{selectedLead.notes}</p>
              </div>
            )}

            <h4>Actions rapides</h4>
            <div className="lead-actions">
              <button
                className="button-primary"
                onClick={() => callCustomer(selectedLead.phone)}
              >
                📞 APPEL
              </button>
            </div>

            <div className="form-row" style={{ marginTop: "16px" }}>
              <label className="label" htmlFor="leadSmsMessage">Message SMS</label>
              <textarea
                id="leadSmsMessage"
                className="textarea"
                value={smsDraft}
                onChange={(event) => setSmsDraft(event.target.value)}
                rows={3}
              />
            </div>
            <div className="table-actions">
              <button
                className="button-secondary"
                type="button"
                onClick={sendSMS}
                disabled={smsSending}
              >
                {smsSending ? "Envoi..." : "Envoyer le SMS"}
              </button>
            </div>

            <h4 style={{ marginTop: "24px" }}>Validité du devis</h4>
            <div className="form-row">
              <label className="label" htmlFor="leadQuoteValidUntil">Date de validité</label>
              <input
                id="leadQuoteValidUntil"
                className="input"
                type="date"
                value={quoteValidUntilDraft}
                onChange={(event) => setQuoteValidUntilDraft(event.target.value)}
              />
            </div>
            <div className="table-actions">
              <button
                className="button-secondary"
                type="button"
                onClick={updateLeadQuoteValidity}
              >
                Mettre à jour la validité
              </button>
            </div>
            {quoteExpired ? (
              <div className="alert">
                Devis expiré. Mettez à jour la date de validité pour convertir.
              </div>
            ) : null}

            <h4 style={{ marginTop: "24px" }}>Mettre à jour le statut</h4>
            <div style={{ display: "grid", gap: "8px" }}>
              {tabs
                .filter((tab) => tab.key !== selectedLead.status)
                .map((tab) => (
                  <button
                    key={tab.key}
                    className="button-secondary"
                    onClick={() => updateLeadStatus(selectedLead.lead_id, tab.key)}
                    style={{
                      borderColor: tab.color,
                      color: tab.color,
                    }}
                  >
                    Passer à {tab.label}
                  </button>
                ))}
            </div>

            {selectedLead.status !== "won" && (
              <button
                className={`button-primary${quoteExpired ? " disabled" : ""}`}
                onClick={() => updateLeadStatus(selectedLead.lead_id, "won")}
                style={{ marginTop: "16px", background: "#10b981" }}
                disabled={quoteExpired}
              >
                ✅ CONVERTIR EN TRAVAIL
              </button>
            )}
            {actionStatus ? (
              <div className={actionStatusTone === "success" ? "hint" : "alert"}>
                {actionStatus}
              </div>
            ) : null}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
