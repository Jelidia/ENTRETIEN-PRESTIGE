"use client";

import TopBar from "@/components/TopBar";
import Link from "next/link";
import NotificationSettingsForm from "@/components/forms/NotificationSettingsForm";
import { useEffect, useMemo, useState } from "react";
import {
  defaultRolePermissions,
  mergeRolePermissions,
  permissionKeys,
  resolvePermissions,
  type PermissionKey,
  type PermissionMap,
} from "@/lib/permissions";

type TeamUser = {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  access_permissions?: PermissionMap | null;
};

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "sales_rep", label: "Door-to-door seller" },
  { value: "technician", label: "Technician" },
];

const roleLabels = roleOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const statusOptions = ["active", "inactive", "suspended"];

const permissionLabels: Record<PermissionKey, string> = {
  dashboard: "Dashboard",
  dispatch: "Dispatch",
  jobs: "Jobs",
  customers: "Customers",
  invoices: "Invoices",
  sales: "Sales",
  operations: "Operations",
  reports: "Reports",
  team: "Team",
  notifications: "Notifications",
  settings: "Settings",
  technician: "Technician view",
};

const emptyPermissions = permissionKeys.reduce<PermissionMap>((acc, key) => {
  acc[key] = false;
  return acc;
}, {} as PermissionMap);

export default function AdminManagePage() {
  const [otpAuth, setOtpAuth] = useState("");
  const [securityStatus, setSecurityStatus] = useState("");
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [teamStatus, setTeamStatus] = useState("");
  const [teamEdits, setTeamEdits] = useState<Record<string, { role: string; status: string }>>({});
  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionMap>>(
    defaultRolePermissions
  );
  const [rolePermissionsStatus, setRolePermissionsStatus] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userOverrides, setUserOverrides] = useState<PermissionMap>(emptyPermissions);
  const [userOverrideStatus, setUserOverrideStatus] = useState("");

  const selectedUser = useMemo(
    () => team.find((member) => member.user_id === selectedUserId),
    [team, selectedUserId]
  );

  useEffect(() => {
    void loadSettings();
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setUserOverrides(emptyPermissions);
      return;
    }
    const resolved = resolvePermissions(
      selectedUser.role,
      rolePermissions,
      selectedUser.access_permissions ?? null
    );
    setUserOverrides(resolved);
  }, [selectedUser, rolePermissions]);

  async function loadSettings() {
    const [teamRes, companyRes] = await Promise.all([fetch("/api/users"), fetch("/api/company")]);
    const teamJson = await teamRes.json().catch(() => ({ data: [] }));
    const companyJson = await companyRes.json().catch(() => ({ data: null }));

    const teamData = (teamJson.data ?? []) as TeamUser[];
    setTeam(teamData);
    const nextEdits: Record<string, { role: string; status: string }> = {};
    teamData.forEach((member) => {
      nextEdits[member.user_id] = { role: member.role ?? "technician", status: member.status ?? "active" };
    });
    setTeamEdits(nextEdits);

    const mergedPermissions = mergeRolePermissions(companyJson.data?.role_permissions ?? null);
    setRolePermissions(mergedPermissions);
    setSelectedUserId((current) => current || teamData[0]?.user_id || "");
  }

  async function handleSetup2fa() {
    setSecurityStatus("");
    const response = await fetch("/api/auth/setup-2fa", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSecurityStatus(json.error ?? "Unable to enable 2FA");
      return;
    }
    setOtpAuth(json.otpauth ?? "");
    setSecurityStatus("Authenticator setup ready.");
  }

  async function handleDisable2fa() {
    setSecurityStatus("");
    const response = await fetch("/api/auth/disable-2fa", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSecurityStatus(json.error ?? "Unable to disable 2FA");
      return;
    }
    setOtpAuth("");
    setSecurityStatus("Two-factor disabled.");
  }

  function updateTeamEdit(userId: string, key: "role" | "status", value: string) {
    setTeamEdits((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [key]: value },
    }));
  }

  async function saveTeamMember(member: TeamUser) {
    const edits = teamEdits[member.user_id];
    if (!edits) {
      return;
    }
    const payload: Record<string, string> = {};
    if (edits.role && edits.role !== member.role) {
      payload.role = edits.role;
    }
    if (edits.status && edits.status !== member.status) {
      payload.status = edits.status;
    }
    if (!Object.keys(payload).length) {
      setTeamStatus("No changes to save.");
      return;
    }

    setTeamStatus("");
    const response = await fetch(`/api/users/${member.user_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setTeamStatus(json.error ?? "Unable to update team member");
      return;
    }
    setTeamStatus("Team member updated.");
    void loadSettings();
  }

  async function saveRolePermissions() {
    setRolePermissionsStatus("");
    const response = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rolePermissions }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setRolePermissionsStatus(json.error ?? "Unable to save role access");
      return;
    }
    setRolePermissionsStatus("Role access saved.");
    void loadSettings();
  }

  function updateRolePermission(role: string, permission: PermissionKey, value: boolean) {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: { ...(prev[role] ?? emptyPermissions), [permission]: value },
    }));
  }

  async function saveUserOverrides() {
    if (!selectedUser) {
      setUserOverrideStatus("Select a team member.");
      return;
    }
    setUserOverrideStatus("");
    const response = await fetch(`/api/users/${selectedUser.user_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_permissions: userOverrides }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setUserOverrideStatus(json.error ?? "Unable to save overrides");
      return;
    }
    setUserOverrideStatus("Overrides saved.");
    void loadSettings();
  }

  async function clearUserOverrides() {
    if (!selectedUser) {
      setUserOverrideStatus("Select a team member.");
      return;
    }
    setUserOverrideStatus("");
    const response = await fetch(`/api/users/${selectedUser.user_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_permissions: null }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setUserOverrideStatus(json.error ?? "Unable to clear overrides");
      return;
    }
    setUserOverrideStatus("Overrides cleared.");
    void loadSettings();
  }

  return (
    <div className="page">
      <TopBar
        title="Admin Management"
        subtitle="Security, access control, and notifications"
      />

      <section className="section">
        <div className="section-header">
          <div>
            <div className="card-label">Security</div>
            <h2 className="section-title">Account protection</h2>
            <div className="section-subtitle">Two-factor, sessions, and alert preferences.</div>
          </div>
        </div>
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">Security controls</h3>
            <div className="card-meta">Two-factor can be enabled per user.</div>
          <div className="list" style={{ marginTop: 12 }}>
            <div className="list-item">
              <div>
                <strong>Two-factor protection</strong>
                <div className="card-meta">Enable SMS or authenticator per user.</div>
              </div>
              <span className="tag">Recommended</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Session timeout</strong>
                <div className="card-meta">15 minutes for all roles</div>
              </div>
              <span className="tag">Active</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Account lockout</strong>
                <div className="card-meta">5 attempts, 30 minute hold</div>
              </div>
              <span className="tag">Active</span>
            </div>
          </div>

          <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
            <button className="button-secondary" type="button" onClick={handleSetup2fa}>
              Generer la configuration d'authentification
            </button>
            <button className="button-ghost" type="button" onClick={handleDisable2fa}>
              Desactiver la double verification
            </button>
            {otpAuth ? (
              <div className="card" style={{ padding: 12 }}>
                <div className="card-meta">Scannez avec votre application d'authentification :</div>
                <code style={{ fontSize: 12, wordBreak: "break-all" }}>{otpAuth}</code>
              </div>
            ) : null}
            {securityStatus ? <div className="hint">{securityStatus}</div> : null}
          </div>
        </div>
          <div className="card">
            <h3 className="card-title">Regles de notification</h3>
            <div className="card-meta">Controlez comment l'equipe recoit les mises a jour.</div>
            <NotificationSettingsForm />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <div className="card-label">Acces</div>
            <h2 className="section-title">Permissions</h2>
            <div className="section-subtitle">Ajustez ce que chaque role peut voir.</div>
          </div>
        </div>
        <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Controle d'acces par role</h3>
              <div className="card-meta">Definir le niveau d'acces par role.</div>
            </div>
          </div>
          <div className="table-desktop">
            <table className="table">
              <thead>
                <tr>
                  <th>Role</th>
                  {permissionKeys.map((permission) => (
                    <th key={permission}>{permissionLabels[permission]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roleOptions.map((role) => (
                  <tr key={role.value}>
                    <td>{role.label}</td>
                    {permissionKeys.map((permission) => (
                      <td key={permission}>
                        <input
                          type="checkbox"
                          checked={Boolean(rolePermissions[role.value]?.[permission])}
                          onChange={(event) =>
                            updateRolePermission(role.value, permission, event.target.checked)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-list-mobile">
            {roleOptions.map((role) => (
              <div key={role.value} className="mobile-card">
                <div className="mobile-card-title">{role.label}</div>
                <div className="permission-grid">
                  {permissionKeys.map((permission) => (
                    <label key={permission} className="list-item" style={{ padding: "10px 12px", cursor: "default" }}>
                      <span>{permissionLabels[permission]}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(rolePermissions[role.value]?.[permission])}
                        onChange={(event) => updateRolePermission(role.value, permission, event.target.checked)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="button-primary" type="button" onClick={saveRolePermissions}>
              Sauvegarder les acces
            </button>
            {rolePermissionsStatus ? <div className="hint">{rolePermissionsStatus}</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Acces par utilisateur</h3>
              <div className="card-meta">Accorder un acces specifique a un membre.</div>
            </div>
          </div>
          <div className="form-row">
            <label className="label" htmlFor="overrideUser">Membre de l'equipe</label>
            <select
              id="overrideUser"
              className="select"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option value="">Selectionner un membre</option>
              {team.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.full_name} ({roleLabels[member.role] ?? member.role})
                </option>
              ))}
            </select>
          </div>
          {selectedUser ? (
            <div className="card-meta" style={{ marginTop: 8 }}>
              {selectedUser.access_permissions ? "Acces personnalise actif" : "Acces par defaut"}
            </div>
          ) : null}
          <div className="list" style={{ marginTop: 12 }}>
            {permissionKeys.map((permission) => (
              <label key={permission} className="list-item" style={{ alignItems: "center" }}>
                <span>{permissionLabels[permission]}</span>
                <input
                  type="checkbox"
                  checked={Boolean(userOverrides[permission])}
                  onChange={(event) =>
                    setUserOverrides({ ...userOverrides, [permission]: event.target.checked })
                  }
                />
              </label>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="button-primary" type="button" onClick={saveUserOverrides}>
              Sauvegarder les acces
            </button>
            <button className="button-secondary" type="button" onClick={clearUserOverrides}>
              Reinitialiser
            </button>
          </div>
          {userOverrideStatus ? <div className="hint">{userOverrideStatus}</div> : null}
        </div>
        </div>
      </section>
    </div>
  );
}
