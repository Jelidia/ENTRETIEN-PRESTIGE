"use client";

import TopBar from "@/components/TopBar";
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

type SeedResult = {
  role: string;
  email: string;
  status: "created" | "exists" | "failed";
  password?: string;
  error?: string;
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

const passwordAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

function generatePassword(length = 24) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => passwordAlphabet[value % passwordAlphabet.length]).join("");
}

export default function SettingsPage() {
  const [otpAuth, setOtpAuth] = useState("");
  const [securityStatus, setSecurityStatus] = useState("");
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [teamStatus, setTeamStatus] = useState("");
  const [teamEdits, setTeamEdits] = useState<Record<string, { role: string; status: string }>>({});
  const [createStatus, setCreateStatus] = useState("");
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "technician",
    password: "",
  });
  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionMap>>(
    defaultRolePermissions
  );
  const [rolePermissionsStatus, setRolePermissionsStatus] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userOverrides, setUserOverrides] = useState<PermissionMap>(emptyPermissions);
  const [userOverrideStatus, setUserOverrideStatus] = useState("");
  const [seedForm, setSeedForm] = useState({
    admin: { fullName: "", email: "", phone: "" },
    technician: { fullName: "", email: "", phone: "" },
    sales: { fullName: "", email: "", phone: "" },
  });
  const [seedResults, setSeedResults] = useState<SeedResult[]>([]);
  const [seedStatus, setSeedStatus] = useState("");

  const selectedUser = useMemo(
    () => team.find((member) => member.user_id === selectedUserId),
    [team, selectedUserId]
  );

  useEffect(() => {
    void loadSettings();
  }, []);

  useEffect(() => {
    setUserForm((prev) => (prev.password ? prev : { ...prev, password: generatePassword() }));
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

  async function createTeamMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateStatus("");
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: userForm.fullName,
        email: userForm.email,
        phone: userForm.phone || undefined,
        role: userForm.role,
        password: userForm.password,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setCreateStatus(json.error ?? "Unable to create user");
      return;
    }
    setCreateStatus("User created.");
    setUserForm({ fullName: "", email: "", phone: "", role: "technician", password: "" });
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

  async function seedAccounts(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSeedStatus("");
    setSeedResults([]);
    const accounts = [
      { role: "admin", ...seedForm.admin },
      { role: "technician", ...seedForm.technician },
      { role: "sales_rep", ...seedForm.sales },
    ].filter((account) => account.fullName && account.email);

    if (accounts.length !== 3) {
      setSeedStatus("Provide a name and email for each seed account.");
      return;
    }

    const response = await fetch("/api/admin/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accounts }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSeedStatus(json.error ?? "Unable to seed accounts");
      return;
    }
    setSeedResults(json.results ?? []);
    setSeedStatus("Seed accounts processed.");
    void loadSettings();
  }

  return (
    <div className="page">
      <TopBar
        title="Settings"
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
              Generate authenticator setup
            </button>
            <button className="button-ghost" type="button" onClick={handleDisable2fa}>
              Disable two-factor
            </button>
            {otpAuth ? (
              <div className="card" style={{ padding: 12 }}>
                <div className="card-meta">Scan with your authenticator app:</div>
                <code style={{ fontSize: 12, wordBreak: "break-all" }}>{otpAuth}</code>
              </div>
            ) : null}
            {securityStatus ? <div className="hint">{securityStatus}</div> : null}
          </div>
        </div>
          <div className="card">
            <h3 className="card-title">Notification rules</h3>
            <div className="card-meta">Control how the team gets updates.</div>
            <NotificationSettingsForm />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <div className="card-label">Team</div>
            <h2 className="section-title">People and access</h2>
            <div className="section-subtitle">Invite staff, manage roles, and review access.</div>
          </div>
        </div>
        <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Team roster</h3>
              <div className="card-meta">Assign roles, status, and access overrides.</div>
            </div>
          </div>
          <div className="table-scroll">
          <table className="table table-desktop">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => {
                const edits = teamEdits[member.user_id] ?? { role: member.role, status: member.status };
                return (
                  <tr key={member.user_id}>
                    <td>
                      <div>{member.full_name}</div>
                      <div className="card-meta">{member.email}</div>
                    </td>
                    <td>
                      <select
                        className="select"
                        value={edits.role}
                        onChange={(event) => updateTeamEdit(member.user_id, "role", event.target.value)}
                      >
                        {roleOptions.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="select"
                        value={edits.status}
                        onChange={(event) => updateTeamEdit(member.user_id, "status", event.target.value)}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {member.access_permissions ? <span className="tag">Custom</span> : "Role default"}
                    </td>
                    <td>
                      <button className="button-secondary" type="button" onClick={() => saveTeamMember(member)}>
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <div className="card-list-mobile">
            {team.map((member) => {
              const edits = teamEdits[member.user_id] ?? { role: member.role, status: member.status };
              return (
                <div key={member.user_id} className="mobile-card">
                  <div className="mobile-card-title">{member.full_name}</div>
                  <div className="mobile-card-meta">{member.email}</div>
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="label" htmlFor={`role-${member.user_id}`}>Role</label>
                      <select
                        id={`role-${member.user_id}`}
                        className="select"
                        value={edits.role}
                        onChange={(event) => updateTeamEdit(member.user_id, "role", event.target.value)}
                      >
                        {roleOptions.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <label className="label" htmlFor={`status-${member.user_id}`}>Status</label>
                      <select
                        id={`status-${member.user_id}`}
                        className="select"
                        value={edits.status}
                        onChange={(event) => updateTeamEdit(member.user_id, "status", event.target.value)}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="hint">Access: {member.access_permissions ? "Custom" : "Role default"}</div>
                  <button className="button-secondary" type="button" onClick={() => saveTeamMember(member)}>
                    Save
                  </button>
                </div>
              );
            })}
          </div>
          {teamStatus ? <div className="hint">{teamStatus}</div> : null}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Add team member</h3>
              <div className="card-meta">Create logins for technicians, sales, and admins.</div>
            </div>
          </div>
          <form className="form-grid" onSubmit={createTeamMember}>
            <div className="form-row">
              <label className="label" htmlFor="teamFullName">Full name</label>
              <input
                id="teamFullName"
                className="input"
                value={userForm.fullName}
                onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="teamEmail">Email</label>
              <input
                id="teamEmail"
                className="input"
                type="email"
                value={userForm.email}
                onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
                required
              />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="teamPhone">Phone</label>
                <input
                  id="teamPhone"
                  className="input"
                  value={userForm.phone}
                  onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })}
                />
                <div className="hint">Needed for SMS 2FA and alerts.</div>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="teamRole">Role</label>
                <select
                  id="teamRole"
                  className="select"
                  value={userForm.role}
                  onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="teamPassword">Temporary password</label>
              <input
                id="teamPassword"
                className="input"
                value={userForm.password}
                onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                minLength={16}
                required
              />
              <div className="hint">16+ characters. Without a phone, 2FA stays off until they set up an authenticator.</div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="button-primary" type="submit">Create user</button>
              <button
                className="button-secondary"
                type="button"
                onClick={() => setUserForm({ ...userForm, password: generatePassword() })}
              >
                Generate password
              </button>
            </div>
            {createStatus ? <div className="hint">{createStatus}</div> : null}
          </form>
        </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <div className="card-label">Access</div>
            <h2 className="section-title">Permissions</h2>
            <div className="section-subtitle">Fine-tune what each role can see.</div>
          </div>
        </div>
        <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Role access control</h3>
              <div className="card-meta">Set the default access level per role.</div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
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
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="button-primary" type="button" onClick={saveRolePermissions}>
              Save role access
            </button>
            {rolePermissionsStatus ? <div className="hint">{rolePermissionsStatus}</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">User access overrides</h3>
              <div className="card-meta">Give specific teammates extra access.</div>
            </div>
          </div>
          <div className="form-row">
            <label className="label" htmlFor="overrideUser">Team member</label>
            <select
              id="overrideUser"
              className="select"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option value="">Select a team member</option>
              {team.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.full_name} ({roleLabels[member.role] ?? member.role})
                </option>
              ))}
            </select>
          </div>
          {selectedUser ? (
            <div className="card-meta" style={{ marginTop: 8 }}>
              {selectedUser.access_permissions ? "Custom overrides active" : "Using role defaults"}
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
              Save overrides
            </button>
            <button className="button-secondary" type="button" onClick={clearUserOverrides}>
              Clear overrides
            </button>
          </div>
          {userOverrideStatus ? <div className="hint">{userOverrideStatus}</div> : null}
        </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <div className="card-label">Onboarding</div>
            <h2 className="section-title">Seed starter accounts</h2>
            <div className="section-subtitle">Create the first admin, technician, and seller in one step.</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Seed starter accounts</h3>
              <div className="card-meta">We will generate temporary passwords for each role.</div>
            </div>
          </div>
          <form className="form-grid" onSubmit={seedAccounts}>
          <div className="grid-3">
            <div className="form-row">
              <label className="label" htmlFor="seedAdminName">Admin name</label>
              <input
                id="seedAdminName"
                className="input"
                value={seedForm.admin.fullName}
                onChange={(event) =>
                  setSeedForm({ ...seedForm, admin: { ...seedForm.admin, fullName: event.target.value } })
                }
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="seedAdminEmail">Admin email</label>
              <input
                id="seedAdminEmail"
                className="input"
                type="email"
                value={seedForm.admin.email}
                onChange={(event) =>
                  setSeedForm({ ...seedForm, admin: { ...seedForm.admin, email: event.target.value } })
                }
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="seedAdminPhone">Admin phone</label>
              <input
                id="seedAdminPhone"
                className="input"
                value={seedForm.admin.phone}
                onChange={(event) =>
                  setSeedForm({ ...seedForm, admin: { ...seedForm.admin, phone: event.target.value } })
                }
              />
            </div>
          </div>
          <div className="grid-3">
            <div className="form-row">
              <label className="label" htmlFor="seedTechName">Technician name</label>
              <input
                id="seedTechName"
                className="input"
                value={seedForm.technician.fullName}
                onChange={(event) =>
                  setSeedForm({
                    ...seedForm,
                    technician: { ...seedForm.technician, fullName: event.target.value },
                  })
                }
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="seedTechEmail">Technician email</label>
              <input
                id="seedTechEmail"
                className="input"
                type="email"
                value={seedForm.technician.email}
                onChange={(event) =>
                  setSeedForm({
                    ...seedForm,
                    technician: { ...seedForm.technician, email: event.target.value },
                  })
                }
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="seedTechPhone">Technician phone</label>
              <input
                id="seedTechPhone"
                className="input"
                value={seedForm.technician.phone}
                onChange={(event) =>
                  setSeedForm({
                    ...seedForm,
                    technician: { ...seedForm.technician, phone: event.target.value },
                  })
                }
              />
            </div>
          </div>
          <div className="grid-3">
            <div className="form-row">
              <label className="label" htmlFor="seedSalesName">Seller name</label>
              <input
                id="seedSalesName"
                className="input"
                value={seedForm.sales.fullName}
                onChange={(event) =>
                  setSeedForm({ ...seedForm, sales: { ...seedForm.sales, fullName: event.target.value } })
                }
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="seedSalesEmail">Seller email</label>
              <input
                id="seedSalesEmail"
                className="input"
                type="email"
                value={seedForm.sales.email}
                onChange={(event) =>
                  setSeedForm({ ...seedForm, sales: { ...seedForm.sales, email: event.target.value } })
                }
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="seedSalesPhone">Seller phone</label>
              <input
                id="seedSalesPhone"
                className="input"
                value={seedForm.sales.phone}
                onChange={(event) =>
                  setSeedForm({ ...seedForm, sales: { ...seedForm.sales, phone: event.target.value } })
                }
              />
            </div>
          </div>
          <button className="button-primary" type="submit">Create seed accounts</button>
          {seedStatus ? <div className="hint">{seedStatus}</div> : null}
        </form>
        {seedResults.length ? (
          <div className="table-scroll" style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Temporary password</th>
              </tr>
            </thead>
            <tbody>
              {seedResults.map((result) => (
                <tr key={`${result.role}-${result.email}`}>
                  <td>{roleLabels[result.role] ?? result.role}</td>
                  <td>{result.email}</td>
                  <td>{result.status}</td>
                  <td>{result.password ?? result.error ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : null}
        </div>
      </section>
    </div>
  );
}
