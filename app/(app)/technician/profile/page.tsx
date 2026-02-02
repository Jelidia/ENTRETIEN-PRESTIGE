"use client";

import { useEffect, useState } from "react";

type AccessResponse = {
  role?: string;
  permissions?: Record<string, boolean>;
};

type UserProfile = {
  full_name: string;
  email: string;
  phone: string;
  role: string;
};

const roleDisplayNames: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  dispatcher: "Dispatcher",
  sales_rep: "Sales Representative",
  technician: "Technician",
  customer: "Customer",
};

export default function TechnicianProfilePage() {
  const [role, setRole] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      // Load role and permissions
      const accessResponse = await fetch("/api/access");
      const accessJson = (await accessResponse.json().catch(() => ({}))) as AccessResponse;
      if (accessJson.role) {
        setRole(accessJson.role);
      }

      // Load full user profile
      const profileResponse = await fetch("/api/users/me");
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
        // Use profile role as authoritative source
        if (profileData.role) {
          setRole(profileData.role);
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <div className="card-meta">Loading profile...</div>
        </div>
      </div>
    );
  }

  const roleDisplayName = role ? roleDisplayNames[role] || role : "User";

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Profile</div>
          <div className="tech-title">{roleDisplayName} Account</div>
        </div>
      </div>

      <div className="card profile-card">
        {profile && (
          <>
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
          </>
        )}
        <div>
          <div className="card-label">Role</div>
          <div className="card-value">{roleDisplayName}</div>
        </div>
        <div>
          <div className="card-label">Support</div>
          <div className="card-meta">Need help? Contact your manager or admin.</div>
        </div>
        <div className="table-actions">
          <button className="button-secondary" type="button" onClick={() => setStatus("Support ticket opened.")}>
            Support
          </button>
          <button className="button-primary" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
