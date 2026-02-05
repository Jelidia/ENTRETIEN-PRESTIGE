"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import BottomSheet from "@/components/BottomSheet";
import Pagination from "@/components/Pagination";
import LeadForm from "@/components/forms/LeadForm";
import { normalizePhoneE164 } from "@/lib/smsTemplates";

type Lead = {
  lead_id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  status: "new" | "contacted" | "estimated" | "won" | "lost";
  estimated_value: number;
  follow_up_date: string | null;
  notes: string;
  created_at: string;
};

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

  async function updateLeadStatus(leadId: string, newStatus: Lead["status"]) {
    setActionStatus("");
    setActionStatusTone("success");
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setLeads((prev) =>
        prev.map((lead) => (lead.lead_id === leadId ? { ...lead, status: newStatus } : lead))
      );
      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setActionStatus("Statut mis à jour.");
      void loadLeads();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionStatusTone("error");
      setActionStatus(data.error ?? "Échec de la mise à jour du lead");
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
            {paginatedLeads.map((lead) => (
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
                      Suivi: {new Date(lead.follow_up_date).toLocaleDateString("fr-CA")}
                    </div>
                  )}
                </div>
                <div>
                  <span
                    className="badge"
                    style={{
                      background: tabs.find((t) => t.key === lead.status)?.color + "20",
                      color: tabs.find((t) => t.key === lead.status)?.color,
                    }}
                  >
                    {tabs.find((t) => t.key === lead.status)?.label ?? lead.status}
                  </span>
                </div>
              </div>
            ))}
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
                  <strong>Suivi:</strong> {new Date(selectedLead.follow_up_date).toLocaleDateString("fr-CA")}
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
                className="button-primary"
                onClick={() => updateLeadStatus(selectedLead.lead_id, "won")}
                style={{ marginTop: "16px", background: "#10b981" }}
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
