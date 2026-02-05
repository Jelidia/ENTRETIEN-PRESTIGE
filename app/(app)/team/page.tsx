"use client";

import TopBar from "@/components/TopBar";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { permissionKeys, type PermissionKey, type PermissionMap, defaultRolePermissions, mergeRolePermissions } from "@/lib/permissions";
import { logger } from "@/lib/logger";

type TeamMember = {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
  phone: string | null;
  status: string | null;
  access_permissions?: PermissionMap | null;
};

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  manager: "Gestionnaire",
  sales_rep: "Représentant",
  technician: "Technicien",
  dispatcher: "Répartiteur",
};

const statusLabels: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
};

const permissionLabels: Record<PermissionKey, string> = {
  dashboard: "Tableau de bord",
  dispatch: "Répartition",
  jobs: "Travaux",
  customers: "Clients",
  invoices: "Factures",
  sales: "Ventes",
  operations: "Opérations",
  reports: "Rapports",
  team: "Équipe",
  notifications: "Notifications",
  settings: "Paramètres",
  technician: "Vue technicien",
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availabilityMemberId, setAvailabilityMemberId] = useState("");

  // Edit permissions modal
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editPermissions, setEditPermissions] = useState<PermissionMap>({} as PermissionMap);
  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionMap>>(defaultRolePermissions);

  useEffect(() => {
    loadTeam();
    loadCompanySettings();
  }, []);

  async function loadTeam() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load team");
      const data = await res.json();
      const nextMembers = (data.data || []) as TeamMember[];
      setMembers(nextMembers);
      if (!availabilityMemberId && nextMembers.length > 0) {
        setAvailabilityMemberId(nextMembers[0].user_id);
      }
    } catch (err) {
      setError("Impossible de charger l'équipe");
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanySettings() {
    try {
      const res = await fetch("/api/company");
      if (res.ok) {
        const data = await res.json();
        const mergedPermissions = mergeRolePermissions(data.data?.role_permissions ?? null);
        setRolePermissions(mergedPermissions);
      }
    } catch (err) {
      logger.error("Failed to load company settings", { error: err });
    }
  }

  function openPermissionsModal(member: TeamMember) {
    setSelectedMember(member);

    // Get default permissions for this role
    const defaultPerms = rolePermissions[member.role] || ({} as PermissionMap);

    // If member has custom permissions, use those; otherwise use role defaults
    const currentPerms = member.access_permissions || defaultPerms;

    setEditPermissions({ ...currentPerms });
    setShowPermissionsModal(true);
  }

  function closePermissionsModal() {
    setShowPermissionsModal(false);
    setSelectedMember(null);
    setEditPermissions({} as PermissionMap);
    setError("");
    setSuccess("");
  }

  async function savePermissions() {
    if (!selectedMember) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/users/${selectedMember.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_permissions: editPermissions }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Échec de la sauvegarde des permissions");
        return;
      }

      setSuccess("Permissions mises à jour avec succès");
      setTimeout(() => {
        closePermissionsModal();
        loadTeam();
      }, 1000);
    } catch (err) {
      setError("Une erreur s'est produite");
    }
  }

  async function clearCustomPermissions() {
    if (!selectedMember) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/users/${selectedMember.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_permissions: null }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Échec de la réinitialisation des permissions");
        return;
      }

      setSuccess("Permissions réinitialisées aux valeurs par défaut du rôle");
      setTimeout(() => {
        closePermissionsModal();
        loadTeam();
      }, 1000);
    } catch (err) {
      setError("Une erreur s'est produite");
    }
  }

  if (loading) {
    return (
      <div className="page">
        <TopBar title="Équipe" subtitle="Chargement..." />
        <p className="card-meta" style={{ marginTop: 24 }}>
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <TopBar
        title="Équipe"
        subtitle={`${members.length} membre${members.length !== 1 ? "s" : ""}`}
        actions={
          <Link href="/admin/users" className="button-primary">
            Ajouter membre
          </Link>
        }
      />

      <section className="card" style={{ marginTop: 24 }}>
        <div className="list">
          {members.length === 0 ? (
            <div className="card-meta" style={{ padding: 16, textAlign: "center" }}>
              Aucun membre d&apos;équipe trouvé.
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.user_id}
                className="list-item list-item-stack"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div>
                    <strong>{member.full_name || member.email}</strong>
                    <div className="card-meta">
                      {roleLabels[member.role] || member.role}
                      {member.phone && ` · ${member.phone}`}
                    </div>
                    {member.access_permissions && (
                      <div className="card-meta" style={{ marginTop: 4 }}>
                        <span className="tag" style={{ fontSize: 11 }}>
                          Permissions personnalisées
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className="pill"
                    style={{
                      backgroundColor:
                        member.status === "active"
                          ? "#DEF7EC"
                          : member.status === "inactive"
                          ? "#FEF3C7"
                          : "#FEE2E2",
                      color:
                        member.status === "active"
                          ? "#03543F"
                          : member.status === "inactive"
                          ? "#92400E"
                          : "#991B1B",
                    }}
                  >
                    {statusLabels[member.status || "inactive"] || "Inconnu"}
                  </span>
                </div>
                <div className="list-item-actions">
                  <Link href={`/team/${member.user_id}`} className="button-secondary">
                    Voir profil
                  </Link>
                  <button
                    onClick={() => openPermissionsModal(member)}
                    className="button-ghost"
                  >
                    Modifier permissions
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Disponibilités</h3>
            <div className="card-meta">Sélectionnez un membre pour voir sa grille.</div>
          </div>
        </div>
        {members.length === 0 ? (
          <div className="card-meta" style={{ marginTop: 12 }}>
            Aucun membre d'équipe disponible.
          </div>
        ) : (
          <>
            <div className="form-row" style={{ marginTop: 16 }}>
              <label className="label" htmlFor="availabilityMember">Membre</label>
              <select
                id="availabilityMember"
                className="select"
                value={availabilityMemberId}
                onChange={(event) => setAvailabilityMemberId(event.target.value)}
              >
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.full_name || member.email}
                  </option>
                ))}
              </select>
            </div>
            {availabilityMemberId ? (
              <div style={{ marginTop: 16 }}>
                <AvailabilityCalendar userId={availabilityMemberId} />
                <div className="card-meta" style={{ marginTop: 8 }}>
                  Disponibilité hebdomadaire (max 7 jours d'avance).
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Edit Permissions Modal */}
      {showPermissionsModal && selectedMember && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 600 }}>
            <h2 className="card-title">
              Modifier les permissions - {selectedMember.full_name}
            </h2>
            <div className="card-meta" style={{ marginBottom: 16 }}>
              Rôle: {roleLabels[selectedMember.role] || selectedMember.role}
            </div>

            {error && (
              <div className="alert" style={{ marginBottom: 16, backgroundColor: "#fee2e2", color: "#991b1b" }}>
                {error}
              </div>
            )}
            {success && (
              <div className="alert" style={{ marginBottom: 16, backgroundColor: "#dcfce7", color: "#166534" }}>
                {success}
              </div>
            )}

            <div className="list" style={{ marginBottom: 16, maxHeight: 400, overflowY: "auto" }}>
              {permissionKeys.map((permission) => (
                <label
                  key={permission}
                  className="list-item"
                  style={{ alignItems: "center", padding: "8px 12px", cursor: "pointer" }}
                >
                  <span>{permissionLabels[permission]}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(editPermissions[permission])}
                    onChange={(e) =>
                      setEditPermissions({
                        ...editPermissions,
                        [permission]: e.target.checked,
                      })
                    }
                  />
                </label>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={savePermissions} className="button-primary">
                Sauvegarder
              </button>
              {selectedMember.access_permissions && (
                <button onClick={clearCustomPermissions} className="button-secondary">
                  Réinitialiser aux valeurs par défaut
                </button>
              )}
              <button onClick={closePermissionsModal} className="button-ghost">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
