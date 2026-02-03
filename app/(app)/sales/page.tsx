"use client";

import TopBar from "@/components/TopBar";
import { useEffect, useState } from "react";

type LeadRow = {
  lead_id: string;
  first_name: string;
  last_name: string;
  status: string;
  estimated_job_value?: number;
  follow_up_date?: string;
  city?: string;
};

type TerritoryRow = {
  territory_id: string;
  territory_name: string;
  monthly_revenue?: number;
  total_customers?: number;
  active_customers?: number;
};

type LeaderboardRow = {
  rank: number;
  total_revenue?: number;
  leads_generated?: number;
  conversion_rate?: number;
};

export default function SalesPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [territories, setTerritories] = useState<TerritoryRow[]>([]);
  const [leadStatus, setLeadStatus] = useState("");
  const [territoryStatus, setTerritoryStatus] = useState("");
  const [leadForm, setLeadForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    estimatedJobValue: "",
    followUpDate: "",
    notes: "",
  });
  const [territoryForm, setTerritoryForm] = useState({
    territoryName: "",
    salesRepId: "",
    neighborhoods: "",
    polygonCoordinates: "",
  });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const [leaderboardRes, leadsRes, territoriesRes] = await Promise.all([
      fetch("/api/reports/leaderboard"),
      fetch("/api/reports/leads"),
      fetch("/api/reports/territories"),
    ]);

    const leaderboardJson = await leaderboardRes.json().catch(() => ({ data: [] }));
    const leadsJson = await leadsRes.json().catch(() => ({ data: [] }));
    const territoriesJson = await territoriesRes.json().catch(() => ({ data: [] }));

    setLeaderboard(leaderboardJson.data ?? []);
    setLeads(leadsJson.data ?? []);
    setTerritories(territoriesJson.data ?? []);
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadStatus("");
    const response = await fetch("/api/reports/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...leadForm,
        estimatedJobValue: leadForm.estimatedJobValue ? Number(leadForm.estimatedJobValue) : undefined,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setLeadStatus(json.error ?? "Unable to create lead");
      return;
    }
    setLeadStatus("Lead created.");
    setLeadForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      city: "",
      estimatedJobValue: "",
      followUpDate: "",
      notes: "",
    });
    void loadData();
  }

  async function submitTerritory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTerritoryStatus("");
    const neighborhoods = territoryForm.neighborhoods
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    let polygonCoordinates: unknown = undefined;
    if (territoryForm.polygonCoordinates) {
      try {
        polygonCoordinates = JSON.parse(territoryForm.polygonCoordinates);
      } catch (error) {
        setTerritoryStatus("Polygon JSON is invalid.");
        return;
      }
    }
    const response = await fetch("/api/reports/territories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        territoryName: territoryForm.territoryName,
        salesRepId: territoryForm.salesRepId,
        neighborhoods,
        polygonCoordinates,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setTerritoryStatus(json.error ?? "Unable to create territory");
      return;
    }
    setTerritoryStatus("Territory saved.");
    setTerritoryForm({ territoryName: "", salesRepId: "", neighborhoods: "", polygonCoordinates: "" });
    void loadData();
  }

  return (
    <div className="page">
      <TopBar
        title="Sales"
        subtitle="Territory performance and lead pipeline"
        actions={<span className="pill">Live pipeline</span>}
      />

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Leaderboard</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Revenue</th>
                <th>Leads</th>
                <th>Conversion</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((rep) => (
                <tr key={rep.rank}>
                  <td>{rep.rank}</td>
                  <td>{rep.total_revenue ? `$${rep.total_revenue}` : "$0"}</td>
                  <td>{rep.leads_generated ?? 0}</td>
                  <td>{rep.conversion_rate ? `${rep.conversion_rate}%` : "0%"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="card-title">New lead</h3>
          <form className="form-grid" onSubmit={submitLead}>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  className="input"
                  value={leadForm.firstName}
                  onChange={(event) => setLeadForm({ ...leadForm, firstName: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  className="input"
                  value={leadForm.lastName}
                  onChange={(event) => setLeadForm({ ...leadForm, lastName: event.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="leadEmail">Email</label>
              <input
                id="leadEmail"
                className="input"
                type="email"
                value={leadForm.email}
                onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })}
              />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="leadPhone">Phone</label>
                <input
                  id="leadPhone"
                  className="input"
                  value={leadForm.phone}
                  onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="leadCity">City</label>
                <input
                  id="leadCity"
                  className="input"
                  value={leadForm.city}
                  onChange={(event) => setLeadForm({ ...leadForm, city: event.target.value })}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="leadValue">Estimated value</label>
                <input
                  id="leadValue"
                  className="input"
                  type="number"
                  value={leadForm.estimatedJobValue}
                  onChange={(event) => setLeadForm({ ...leadForm, estimatedJobValue: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="followUp">Follow up date</label>
                <input
                  id="followUp"
                  className="input"
                  type="date"
                  value={leadForm.followUpDate}
                  onChange={(event) => setLeadForm({ ...leadForm, followUpDate: event.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="leadNotes">Notes</label>
              <textarea
                id="leadNotes"
                className="textarea"
                value={leadForm.notes}
                onChange={(event) => setLeadForm({ ...leadForm, notes: event.target.value })}
              />
            </div>
            <button className="button-primary" type="submit">Save lead</button>
            {leadStatus ? <div className="hint">{leadStatus}</div> : null}
          </form>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Territories</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Revenue</th>
                <th>Customers</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {territories.map((territory) => (
                <tr key={territory.territory_id}>
                  <td>{territory.territory_name}</td>
                  <td>{territory.monthly_revenue ? `$${territory.monthly_revenue}` : "$0"}</td>
                  <td>{territory.total_customers ?? 0}</td>
                  <td>{territory.active_customers ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="card-title">Assign territory</h3>
          <form className="form-grid" onSubmit={submitTerritory}>
            <div className="form-row">
              <label className="label" htmlFor="territoryName">Territory name</label>
              <input
                id="territoryName"
                className="input"
                value={territoryForm.territoryName}
                onChange={(event) =>
                  setTerritoryForm({ ...territoryForm, territoryName: event.target.value })
                }
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="salesRepId">Sales rep ID</label>
              <input
                id="salesRepId"
                className="input"
                value={territoryForm.salesRepId}
                onChange={(event) => setTerritoryForm({ ...territoryForm, salesRepId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="neighborhoods">Neighborhoods (comma)</label>
              <input
                id="neighborhoods"
                className="input"
                value={territoryForm.neighborhoods}
                onChange={(event) =>
                  setTerritoryForm({ ...territoryForm, neighborhoods: event.target.value })
                }
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="polygon">Polygon JSON</label>
              <textarea
                id="polygon"
                className="textarea"
                value={territoryForm.polygonCoordinates}
                onChange={(event) =>
                  setTerritoryForm({ ...territoryForm, polygonCoordinates: event.target.value })
                }
              />
            </div>
            <button className="button-primary" type="submit">Save territory</button>
            {territoryStatus ? <div className="hint">{territoryStatus}</div> : null}
          </form>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Lead pipeline</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Status</th>
              <th>Value</th>
              <th>City</th>
              <th>Follow up</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.lead_id}>
                <td>{lead.first_name} {lead.last_name}</td>
                <td>{lead.status}</td>
                <td>{lead.estimated_job_value ? `$${lead.estimated_job_value}` : ""}</td>
                <td>{lead.city ?? ""}</td>
                <td>{lead.follow_up_date ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
