"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import BottomSheet from "@/components/BottomSheet";
import Pagination from "@/components/Pagination";

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
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      loadLeads();
      setSelectedLead(null);
    } else {
      alert("Failed to update lead");
    }
  }

  async function callCustomer(phone: string) {
    window.location.href = `tel:${phone}`;
    // Log the call attempt
    if (selectedLead) {
      await fetch(`/api/leads/${selectedLead.lead_id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "call",
          notes: "Called customer",
        }),
      });
    }
  }

  async function sendSMS(phone: string) {
    const message = prompt("Enter message to send:");
    if (!message) return;

    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        message,
      }),
    });

    if (res.ok) {
      alert("SMS sent successfully");
      if (selectedLead) {
        await fetch(`/api/leads/${selectedLead.lead_id}/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "sms",
            notes: message,
          }),
        });
      }
    } else {
      alert("Failed to send SMS");
    }
  }

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabs: Array<{ key: Lead["status"]; label: string; color: string }> = [
    { key: "new", label: "New", color: "#64748b" },
    { key: "contacted", label: "Contacted", color: "#3b82f6" },
    { key: "estimated", label: "Estimated", color: "#f59e0b" },
    { key: "won", label: "Won", color: "#10b981" },
    { key: "lost", label: "Lost", color: "#ef4444" },
  ];

  return (
    <div className="page">
      <TopBar
        title="Leads & Customers"
        subtitle="Manage your sales pipeline"
        actions={
          <button className="button-primary" onClick={() => alert("Add New Lead")}>
            + New Lead
          </button>
        }
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
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
      {loading && <p>Loading...</p>}

      {!loading && filteredLeads.length === 0 && (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <h3>No {selectedTab} leads</h3>
          <p className="card-meta">Leads will appear here as you add them</p>
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
                      Follow up: {new Date(lead.follow_up_date).toLocaleDateString("fr-CA")}
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
                    {lead.status}
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
              <div><strong>Phone:</strong> {selectedLead.phone}</div>
              <div style={{ marginTop: "8px" }}><strong>Email:</strong> {selectedLead.email || "N/A"}</div>
              <div style={{ marginTop: "8px" }}><strong>Address:</strong> {selectedLead.address || "N/A"}</div>
              <div style={{ marginTop: "8px" }}>
                <strong>Estimated Value:</strong> ${selectedLead.estimated_value.toLocaleString()}
              </div>
              <div style={{ marginTop: "8px" }}>
                <strong>Status:</strong> {selectedLead.status}
              </div>
              {selectedLead.follow_up_date && (
                <div style={{ marginTop: "8px" }}>
                  <strong>Follow-up:</strong> {new Date(selectedLead.follow_up_date).toLocaleDateString("fr-CA")}
                </div>
              )}
            </div>

            {selectedLead.notes && (
              <div>
                <h4>Notes</h4>
                <p className="card-meta">{selectedLead.notes}</p>
              </div>
            )}

            <h4>Quick Actions</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                className="button-primary"
                onClick={() => callCustomer(selectedLead.phone)}
              >
                📞 CALL
              </button>
              <button
                className="button-secondary"
                onClick={() => sendSMS(selectedLead.phone)}
              >
                📱 SMS
              </button>
            </div>

            <h4 style={{ marginTop: "24px" }}>Update Status</h4>
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
                    Move to {tab.label}
                  </button>
                ))}
            </div>

            {selectedLead.status !== "won" && (
              <button
                className="button-primary"
                onClick={() => updateLeadStatus(selectedLead.lead_id, "won")}
                style={{ marginTop: "16px", background: "#10b981" }}
              >
                ✅ CONVERT TO JOB
              </button>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
