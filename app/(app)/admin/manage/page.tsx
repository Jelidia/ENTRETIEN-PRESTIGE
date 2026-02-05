"use client";

import TopBar from "@/components/TopBar";
import Link from "next/link";
import { normalizePhoneE164 } from "@/lib/smsTemplates";
import NotificationSettingsForm from "@/components/forms/NotificationSettingsForm";
import { useEffect, useMemo, useState } from "react";
import { useCompany } from "@/contexts/company/CompanyContext";
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
  full_name: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  access_permissions?: PermissionMap | null;
};

type TeamEdit = {
  role: string;
  status: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
};

type CompanyProfile = {
  name?: string | null;
  legal_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  timezone?: string | null;
  gst_number?: string | null;
  qst_number?: string | null;
  role_permissions?: Record<string, Partial<PermissionMap>> | null;
};

type CompanyService = {
  service_id: string;
  name: string;
  description?: string | null;
  default_duration_minutes?: number | null;
  default_price?: number | null;
  active: boolean;
  sort_order: number;
};

type CompanyServiceForm = {
  name: string;
  description: string;
  defaultDurationMinutes: string;
  defaultPrice: string;
  active: boolean;
  sortOrder: string;
};

const roleOptions = [
  { value: "admin", label: "Administrateur" },
  { value: "manager", label: "Gestionnaire" },
  { value: "dispatcher", label: "Repartiteur" },
  { value: "sales_rep", label: "Representant" },
  { value: "technician", label: "Technicien" },
];

const roleLabels = roleOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const statusOptions = ["active", "inactive", "suspended"];

const statusLabels: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
};

const permissionLabels: Record<PermissionKey, string> = {
  dashboard: "Tableau de bord",
  dispatch: "Repartition",
  jobs: "Travaux",
  customers: "Clients",
  invoices: "Factures",
  sales: "Ventes",
  operations: "Operations",
  reports: "Rapports",
  team: "Equipe",
  notifications: "Notifications",
  settings: "Parametres",
  technician: "Vue technicien",
};

const emptyPermissions = permissionKeys.reduce<PermissionMap>((acc, key) => {
  acc[key] = false;
  return acc;
}, {} as PermissionMap);

export default function AdminManagePage() {
  const { refresh: refreshCompany } = useCompany();
  const [otpAuth, setOtpAuth] = useState("");
  const [securityStatus, setSecurityStatus] = useState("");
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [teamStatus, setTeamStatus] = useState("");
  const [teamEdits, setTeamEdits] = useState<Record<string, TeamEdit>>({});
  const [companyForm, setCompanyForm] = useState<CompanyProfile>({
    name: "",
    legal_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    timezone: "",
    gst_number: "",
    qst_number: "",
  });
  const [companyStatus, setCompanyStatus] = useState("");
  const [services, setServices] = useState<CompanyService[]>([]);
  const [serviceEdits, setServiceEdits] = useState<Record<string, CompanyServiceForm>>({});
  const [serviceStatus, setServiceStatus] = useState("");
  const [newService, setNewService] = useState<CompanyServiceForm>({
    name: "",
    description: "",
    defaultDurationMinutes: "",
    defaultPrice: "",
    active: true,
    sortOrder: "0",
  });
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
    const [teamRes, companyRes, servicesRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/company"),
      fetch("/api/company/services"),
    ]);
    const teamJson = await teamRes.json().catch(() => ({ data: [] }));
    const companyJson = await companyRes.json().catch(() => ({ data: null }));
    const servicesJson = await servicesRes.json().catch(() => ({ data: [] }));

    const teamData = (teamJson.data ?? []) as TeamUser[];
    setTeam(teamData);
    const nextEdits: Record<string, TeamEdit> = {};
    teamData.forEach((member) => {
      nextEdits[member.user_id] = {
        role: member.role ?? "technician",
        status: member.status ?? "active",
        full_name: member.full_name ?? "",
        phone: member.phone ?? "",
        address: member.address ?? "",
        city: member.city ?? "",
        province: member.province ?? "",
        postal_code: member.postal_code ?? "",
        country: member.country ?? "",
      };
    });
    setTeamEdits(nextEdits);

    const companyData = (companyJson.data ?? null) as CompanyProfile | null;
    setCompanyForm({
      name: companyData?.name ?? "",
      legal_name: companyData?.legal_name ?? "",
      email: companyData?.email ?? "",
      phone: companyData?.phone ?? "",
      address: companyData?.address ?? "",
      city: companyData?.city ?? "",
      province: companyData?.province ?? "",
      postal_code: companyData?.postal_code ?? "",
      timezone: companyData?.timezone ?? "",
      gst_number: companyData?.gst_number ?? "",
      qst_number: companyData?.qst_number ?? "",
    });

    const mergedPermissions = mergeRolePermissions(companyData?.role_permissions ?? null);
    setRolePermissions(mergedPermissions);
    setSelectedUserId((current) => current || teamData[0]?.user_id || "");

    const serviceData = (servicesJson.data ?? []) as CompanyService[];
    setServices(serviceData);
    const nextServiceEdits: Record<string, CompanyServiceForm> = {};
    serviceData.forEach((service) => {
      nextServiceEdits[service.service_id] = {
        name: service.name ?? "",
        description: service.description ?? "",
        defaultDurationMinutes: service.default_duration_minutes?.toString() ?? "",
        defaultPrice: service.default_price?.toString() ?? "",
        active: service.active !== false,
        sortOrder: String(service.sort_order ?? 0),
      };
    });
    setServiceEdits(nextServiceEdits);
  }

  async function handleSetup2fa() {
    setSecurityStatus("");
    const response = await fetch("/api/auth/setup-2fa", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSecurityStatus(json.error ?? "Impossible d'activer la 2FA");
      return;
    }
    setOtpAuth(json.otpauth ?? "");
    setSecurityStatus("Configuration 2FA prete.");
  }

  async function handleDisable2fa() {
    setSecurityStatus("");
    const response = await fetch("/api/auth/disable-2fa", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSecurityStatus(json.error ?? "Impossible de desactiver la 2FA");
      return;
    }
    setOtpAuth("");
    setSecurityStatus("2FA desactivee.");
  }

  function updateTeamEdit(userId: string, key: keyof TeamEdit, value: string) {
    setTeamEdits((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [key]: value },
    }));
  }

  function updateCompanyField(key: keyof CompanyProfile, value: string) {
    setCompanyForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveCompanyProfile() {
    setCompanyStatus("");
    const trimmedPhone = (companyForm.phone ?? "").trim();
    const normalizedPhone = trimmedPhone ? normalizePhoneE164(trimmedPhone) : "";
    if (trimmedPhone && !normalizedPhone) {
      setCompanyStatus("Téléphone invalide. Utilisez le format (514) 555-0123.");
      return;
    }
    const response = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...companyForm,
        phone: trimmedPhone ? normalizedPhone : null,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setCompanyStatus(json.error ?? "Impossible de mettre a jour l'entreprise");
      return;
    }
    setCompanyStatus("Entreprise mise a jour.");
    void loadSettings();
    void refreshCompany();
  }

  function parseOptionalNumber(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) return undefined;
    return parsed;
  }

  function updateServiceEdit(serviceId: string, key: keyof CompanyServiceForm, value: string | boolean) {
    setServiceEdits((prev) => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], [key]: value },
    }));
  }

  function buildServicePayload(form: CompanyServiceForm) {
    return {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      defaultDurationMinutes: parseOptionalNumber(form.defaultDurationMinutes),
      defaultPrice: parseOptionalNumber(form.defaultPrice),
      active: form.active,
      sortOrder: parseOptionalNumber(form.sortOrder),
    };
  }

  async function saveService(serviceId: string) {
    const form = serviceEdits[serviceId];
    if (!form) return;
    setServiceStatus("");
    const payload = buildServicePayload(form);
    if (!payload.name) {
      setServiceStatus("Le nom du service est requis.");
      return;
    }
    const response = await fetch(`/api/company/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setServiceStatus(json.error ?? "Impossible de mettre a jour le service");
      return;
    }
    setServiceStatus("Service mis a jour.");
    void loadSettings();
  }

  async function deleteService(serviceId: string) {
    setServiceStatus("");
    const response = await fetch(`/api/company/services/${serviceId}`, { method: "DELETE" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setServiceStatus(json.error ?? "Impossible de supprimer le service");
      return;
    }
    setServiceStatus("Service supprime.");
    void loadSettings();
  }

  async function addService() {
    setServiceStatus("");
    const payload = buildServicePayload(newService);
    if (!payload.name) {
      setServiceStatus("Le nom du service est requis.");
      return;
    }
    const response = await fetch("/api/company/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setServiceStatus(json.error ?? "Impossible d'ajouter le service");
      return;
    }
    setServiceStatus("Service ajoute.");
    setNewService({
      name: "",
      description: "",
      defaultDurationMinutes: "",
      defaultPrice: "",
      active: true,
      sortOrder: "0",
    });
    void loadSettings();
  }

  async function saveTeamMember(member: TeamUser) {
    const edits = teamEdits[member.user_id];
    if (!edits) {
      return;
    }
    const payload: Record<string, string> = {};
    if (edits.full_name && edits.full_name !== member.full_name) {
      payload.full_name = edits.full_name;
    }
    if (edits.phone !== (member.phone ?? "")) {
      const trimmedPhone = (edits.phone ?? "").trim();
      if (!trimmedPhone) {
        payload.phone = "";
      } else {
        const normalizedPhone = normalizePhoneE164(trimmedPhone);
        if (!normalizedPhone) {
          setTeamStatus("Téléphone invalide. Utilisez le format (514) 555-0123.");
          return;
        }
        payload.phone = normalizedPhone;
      }
    }
    if (edits.address !== (member.address ?? "")) {
      payload.address = edits.address;
    }
    if (edits.city !== (member.city ?? "")) {
      payload.city = edits.city;
    }
    if (edits.province !== (member.province ?? "")) {
      payload.province = edits.province;
    }
    if (edits.postal_code !== (member.postal_code ?? "")) {
      payload.postal_code = edits.postal_code;
    }
    if (edits.country !== (member.country ?? "")) {
      payload.country = edits.country;
    }
    if (edits.role && edits.role !== member.role) {
      payload.role = edits.role;
    }
    if (edits.status && edits.status !== member.status) {
      payload.status = edits.status;
    }
    if (!Object.keys(payload).length) {
      setTeamStatus("Aucune modification a enregistrer.");
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
      setTeamStatus(json.error ?? "Impossible de mettre a jour le membre");
      return;
    }
    setTeamStatus("Membre mis a jour.");
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
      setRolePermissionsStatus(json.error ?? "Impossible d'enregistrer les acces");
      return;
    }
    setRolePermissionsStatus("Acces par role enregistres.");
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
      setUserOverrideStatus("Selectionnez un membre.");
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
      setUserOverrideStatus(json.error ?? "Impossible d'enregistrer les acces");
      return;
    }
    setUserOverrideStatus("Acces personnalises enregistres.");
    void loadSettings();
  }

  async function clearUserOverrides() {
    if (!selectedUser) {
      setUserOverrideStatus("Selectionnez un membre.");
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
      setUserOverrideStatus(json.error ?? "Impossible de reinitialiser les acces");
      return;
    }
    setUserOverrideStatus("Acces reinitialises.");
    void loadSettings();
  }

  return (
    <div className="page">
      <TopBar
        title="Administration entreprise"
        subtitle="Controle complet de l'entreprise"
      />

      <section className="section">
        <div className="section-header">
          <div>
            <div className="card-label">Entreprise</div>
            <h2 className="section-title">Profil de l'entreprise</h2>
            <div className="section-subtitle">Identite, coordonnees, taxes et fuseau horaire.</div>
          </div>
        </div>
        <div className="card">
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void saveCompanyProfile();
            }}
          >
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="companyName">Nom d'entreprise</label>
                <input
                  id="companyName"
                  className="input"
                  value={companyForm.name ?? ""}
                  onChange={(event) => updateCompanyField("name", event.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="companyLegalName">Nom legal</label>
                <input
                  id="companyLegalName"
                  className="input"
                  value={companyForm.legal_name ?? ""}
                  onChange={(event) => updateCompanyField("legal_name", event.target.value)}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="companyEmail">Courriel</label>
                <input
                  id="companyEmail"
                  className="input"
                  type="email"
                  value={companyForm.email ?? ""}
                  onChange={(event) => updateCompanyField("email", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="companyPhone">Telephone</label>
                <input
                  id="companyPhone"
                  className="input"
                  value={companyForm.phone ?? ""}
                  onChange={(event) => updateCompanyField("phone", event.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="companyAddress">Adresse</label>
              <input
                id="companyAddress"
                className="input"
                value={companyForm.address ?? ""}
                onChange={(event) => updateCompanyField("address", event.target.value)}
              />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="companyCity">Ville</label>
                <input
                  id="companyCity"
                  className="input"
                  value={companyForm.city ?? ""}
                  onChange={(event) => updateCompanyField("city", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="companyProvince">Province</label>
                <input
                  id="companyProvince"
                  className="input"
                  value={companyForm.province ?? ""}
                  onChange={(event) => updateCompanyField("province", event.target.value)}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="companyPostal">Code postal</label>
                <input
                  id="companyPostal"
                  className="input"
                  value={companyForm.postal_code ?? ""}
                  onChange={(event) => updateCompanyField("postal_code", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="companyTimezone">Fuseau horaire</label>
                <input
                  id="companyTimezone"
                  className="input"
                  value={companyForm.timezone ?? ""}
                  onChange={(event) => updateCompanyField("timezone", event.target.value)}
                  placeholder="America/Montreal"
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="companyGst">Numero TPS</label>
                <input
                  id="companyGst"
                  className="input"
                  value={companyForm.gst_number ?? ""}
                  onChange={(event) => updateCompanyField("gst_number", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="companyQst">Numero TVQ</label>
                <input
                  id="companyQst"
                  className="input"
                  value={companyForm.qst_number ?? ""}
                  onChange={(event) => updateCompanyField("qst_number", event.target.value)}
                />
              </div>
            </div>
            <div className="table-actions">
              <button className="button-primary" type="submit">Enregistrer l'entreprise</button>
              {companyStatus ? <div className="hint">{companyStatus}</div> : null}
            </div>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <div className="card-label">Services</div>
            <h2 className="section-title">Catalogue des services</h2>
            <div className="section-subtitle">Creez, modifiez et desactivez les services proposes.</div>
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h3 className="card-title">Ajouter un service</h3>
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void addService();
              }}
            >
              <div className="grid-2">
                <div className="form-row">
                  <label className="label" htmlFor="newServiceName">Nom du service</label>
                  <input
                    id="newServiceName"
                    className="input"
                    value={newService.name}
                    onChange={(event) => setNewService({ ...newService, name: event.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="newServiceSort">Ordre d'affichage</label>
                  <input
                    id="newServiceSort"
                    className="input"
                    type="number"
                    value={newService.sortOrder}
                    onChange={(event) => setNewService({ ...newService, sortOrder: event.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="newServiceDesc">Description</label>
                <textarea
                  id="newServiceDesc"
                  className="textarea"
                  value={newService.description}
                  onChange={(event) => setNewService({ ...newService, description: event.target.value })}
                />
              </div>
              <div className="grid-2">
                <div className="form-row">
                  <label className="label" htmlFor="newServiceDuration">Duree par defaut (min)</label>
                  <input
                    id="newServiceDuration"
                    className="input"
                    type="number"
                    value={newService.defaultDurationMinutes}
                    onChange={(event) => setNewService({ ...newService, defaultDurationMinutes: event.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="newServicePrice">Prix par defaut</label>
                  <input
                    id="newServicePrice"
                    className="input"
                    type="number"
                    step="0.01"
                    value={newService.defaultPrice}
                    onChange={(event) => setNewService({ ...newService, defaultPrice: event.target.value })}
                  />
                </div>
              </div>
              <label className="pill" style={{ gap: 10 }}>
                <input
                  type="checkbox"
                  checked={newService.active}
                  onChange={(event) => setNewService({ ...newService, active: event.target.checked })}
                />
                Service actif
              </label>
              <div className="table-actions">
                <button className="button-primary" type="submit">Ajouter le service</button>
                {serviceStatus ? <div className="hint">{serviceStatus}</div> : null}
              </div>
            </form>
          </div>

          {services.map((service) => {
            const form = serviceEdits[service.service_id];
            return (
              <div className="card" key={service.service_id}>
                <div className="card-header" style={{ alignItems: "center" }}>
                  <div>
                    <h3 className="card-title">{form?.name || service.name}</h3>
                    <div className="card-meta">ID: {service.service_id}</div>
                  </div>
                  <span className="tag">{form?.active ? "Actif" : "Inactif"}</span>
                </div>
                <div className="form-grid">
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="label">Nom</label>
                      <input
                        className="input"
                        value={form?.name ?? ""}
                        onChange={(event) => updateServiceEdit(service.service_id, "name", event.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <label className="label">Ordre</label>
                      <input
                        className="input"
                        type="number"
                        value={form?.sortOrder ?? ""}
                        onChange={(event) => updateServiceEdit(service.service_id, "sortOrder", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <label className="label">Description</label>
                    <textarea
                      className="textarea"
                      value={form?.description ?? ""}
                      onChange={(event) => updateServiceEdit(service.service_id, "description", event.target.value)}
                    />
                  </div>
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="label">Duree (min)</label>
                      <input
                        className="input"
                        type="number"
                        value={form?.defaultDurationMinutes ?? ""}
                        onChange={(event) =>
                          updateServiceEdit(service.service_id, "defaultDurationMinutes", event.target.value)
                        }
                      />
                    </div>
                    <div className="form-row">
                      <label className="label">Prix</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={form?.defaultPrice ?? ""}
                        onChange={(event) =>
                          updateServiceEdit(service.service_id, "defaultPrice", event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <label className="pill" style={{ gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={form?.active ?? false}
                      onChange={(event) => updateServiceEdit(service.service_id, "active", event.target.checked)}
                    />
                    Service actif
                  </label>
                </div>
                <div className="table-actions">
                  <button className="button-secondary" type="button" onClick={() => saveService(service.service_id)}>
                    Enregistrer
                  </button>
                  <button className="button-ghost" type="button" onClick={() => deleteService(service.service_id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <div className="card-label">Equipe</div>
            <h2 className="section-title">Gestion des membres</h2>
            <div className="section-subtitle">Modifiez les roles, coordonnees et statuts.</div>
          </div>
          <div className="table-actions">
            <Link className="button-secondary" href="/admin/users">Gestion des utilisateurs</Link>
          </div>
        </div>
        <div className="list" style={{ marginTop: 16 }}>
          {team.map((member) => {
            const edits = teamEdits[member.user_id];
            return (
              <div key={member.user_id} className="list-item list-item-stack">
                <div>
                  <div className="card-title">{member.full_name}</div>
                  <div className="card-meta">{member.email}</div>
                </div>
                <div className="form-grid">
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="label">Nom complet</label>
                      <input
                        className="input"
                        value={edits?.full_name ?? ""}
                        onChange={(event) => updateTeamEdit(member.user_id, "full_name", event.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <label className="label">Telephone</label>
                      <input
                        className="input"
                        value={edits?.phone ?? ""}
                        onChange={(event) => updateTeamEdit(member.user_id, "phone", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <label className="label">Adresse</label>
                    <input
                      className="input"
                      value={edits?.address ?? ""}
                      onChange={(event) => updateTeamEdit(member.user_id, "address", event.target.value)}
                    />
                  </div>
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="label">Ville</label>
                      <input
                        className="input"
                        value={edits?.city ?? ""}
                        onChange={(event) => updateTeamEdit(member.user_id, "city", event.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <label className="label">Province</label>
                      <input
                        className="input"
                        value={edits?.province ?? ""}
                        onChange={(event) => updateTeamEdit(member.user_id, "province", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="label">Code postal</label>
                      <input
                        className="input"
                        value={edits?.postal_code ?? ""}
                        onChange={(event) => updateTeamEdit(member.user_id, "postal_code", event.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <label className="label">Pays</label>
                      <input
                        className="input"
                        value={edits?.country ?? ""}
                        onChange={(event) => updateTeamEdit(member.user_id, "country", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="label">Role</label>
                      <select
                        className="select"
                        value={edits?.role ?? member.role}
                        onChange={(event) => updateTeamEdit(member.user_id, "role", event.target.value)}
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <label className="label">Statut</label>
                      <select
                        className="select"
                        value={edits?.status ?? member.status}
                        onChange={(event) => updateTeamEdit(member.user_id, "status", event.target.value)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status] ?? status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="list-item-actions">
                  <button className="button-secondary" type="button" onClick={() => saveTeamMember(member)}>
                    Enregistrer
                  </button>
                  <Link className="button-ghost" href={`/team/${member.user_id}`}>
                    Voir profil
                  </Link>
                </div>
              </div>
            );
          })}
          {teamStatus ? <div className="hint">{teamStatus}</div> : null}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <div className="card-label">Securite</div>
            <h2 className="section-title">Protection du compte</h2>
            <div className="section-subtitle">Deux facteurs, sessions et preferences d'alerte.</div>
          </div>
        </div>
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">Controles de securite</h3>
            <div className="card-meta">La 2FA peut etre activee par utilisateur.</div>
          <div className="list" style={{ marginTop: 12 }}>
            <div className="list-item">
              <div>
                <strong>Protection 2FA</strong>
                <div className="card-meta">Activez SMS ou authentificateur par utilisateur.</div>
              </div>
              <span className="tag">Recommande</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Expiration de session</strong>
                <div className="card-meta">15 minutes pour tous les roles</div>
              </div>
              <span className="tag">Actif</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Verrouillage de compte</strong>
                <div className="card-meta">5 essais, blocage 30 min</div>
              </div>
              <span className="tag">Actif</span>
            </div>
          </div>

          <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
            <button className="button-secondary" type="button" onClick={handleSetup2fa}>
              Generer la configuration 2FA
            </button>
            <button className="button-ghost" type="button" onClick={handleDisable2fa}>
              Desactiver la double verification
            </button>
            {otpAuth ? (
              <div className="card" style={{ padding: 12 }}>
                <div className="card-meta">Scannez avec votre application d&apos;authentification :</div>
                <code style={{ fontSize: 12, wordBreak: "break-all" }}>{otpAuth}</code>
              </div>
            ) : null}
            {securityStatus ? <div className="hint">{securityStatus}</div> : null}
          </div>
        </div>
          <div className="card">
            <h3 className="card-title">Regles de notification</h3>
            <div className="card-meta">Controlez comment l&apos;equipe recoit les mises a jour.</div>
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
              <h3 className="card-title">Controle d&apos;acces par role</h3>
              <div className="card-meta">Definir le niveau d&apos;acces par role.</div>
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
            <label className="label" htmlFor="overrideUser">Membre de l&apos;equipe</label>
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
