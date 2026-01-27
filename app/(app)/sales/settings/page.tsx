"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";

type Profile = {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
};

type Territory = {
  territory_id: string;
  territory_name: string;
  sales_rep_id: string;
  total_customers?: number;
  active_customers?: number;
  monthly_revenue?: number;
};

export default function SalesSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setStatus("");
    const profileRes = await fetch("/api/users/me");
    const profileJson = await profileRes.json().catch(() => null);
    if (!profileRes.ok || !profileJson?.user_id) {
      setStatus(profileJson?.error ?? "Unable to load profile");
      return;
    }
    setProfile(profileJson as Profile);

    const territoryRes = await fetch("/api/reports/territories");
    const territoryJson = await territoryRes.json().catch(() => ({ data: [] }));
    if (!territoryRes.ok) {
      setStatus(territoryJson.error ?? "Unable to load territory");
      return;
    }
    const list = (territoryJson.data ?? []).filter(
      (row: Territory) => row.sales_rep_id === profileJson.user_id
    );
    setTerritories(list);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="page">
      <TopBar title="Settings" subtitle="Profile and territory" />

      <div className="card">
        <h3 className="card-title">Profile</h3>
        {profile ? (
          <div className="stack">
            <div>
              <div className="card-label">Name</div>
              <div className="card-value">{profile.full_name}</div>
            </div>
            <div>
              <div className="card-label">Email</div>
              <div className="card-value">{profile.email}</div>
            </div>
            <div>
              <div className="card-label">Phone</div>
              <div className="card-value">{profile.phone || "Not provided"}</div>
            </div>
            <div>
              <div className="card-label">Role</div>
              <div className="card-value">{profile.role}</div>
            </div>
          </div>
        ) : (
          <div className="card-meta">Loading profile...</div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Assigned territory</h3>
        {territories.length === 0 ? (
          <div className="card-meta">No territory assigned yet.</div>
        ) : (
          <div className="list" style={{ marginTop: 12 }}>
            {territories.map((territory) => (
              <div className="list-item" key={territory.territory_id}>
                <div>
                  <strong>{territory.territory_name}</strong>
                  <div className="card-meta">
                    {territory.active_customers ?? 0} active · {territory.total_customers ?? 0} total
                  </div>
                </div>
                <span className="tag">${territory.monthly_revenue ?? 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Notifications</h3>
        <div className="card-meta">Your alerts are managed by the operations team.</div>
        <button className="button-secondary" type="button">Manage alerts</button>
      </div>

      <div className="card">
        <h3 className="card-title">Support</h3>
        <div className="card-meta">Need help? Contact your manager or admin.</div>
        <div className="table-actions">
          <button className="button-secondary" type="button">Support</button>
          <button className="button-primary" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
