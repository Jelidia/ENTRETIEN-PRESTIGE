"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
};

type UsersResponse = {
  users: User[];
  total: number;
  page: number;
  pages: number;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "technician",
    status: "active",
  });

  useEffect(() => {
    loadUsers();
  }, [page]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=4`);
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to load users");
      }
      const data = await res.json();
      setUsers(data.data.users);
      setTotal(data.data.total);
      setPages(data.data.pages);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create user");
        return;
      }

      setShowCreateModal(false);
      setFormData({ email: "", password: "", fullName: "", role: "technician", status: "active" });
      loadUsers();
    } catch (err) {
      setError("An error occurred");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          status: formData.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update user");
        return;
      }

      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      setError("An error occurred");
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.user_id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete user");
        return;
      }

      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      setError("An error occurred");
    }
  }

  function openEditModal(user: User) {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    });
    setShowEditModal(true);
  }

  function openDeleteModal(user: User) {
    setSelectedUser(user);
    setShowDeleteModal(true);
  }

  const roleLabels: Record<string, string> = {
    admin: "Administrateur",
    manager: "Responsable",
    sales_rep: "Représentant commercial",
    technician: "Technicien",
  };

  if (loading && users.length === 0) {
    return <div className="content"><p>Chargement...</p></div>;
  }

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: "bold" }}>Gestion des utilisateurs</h1>
        <button
          onClick={() => {
            setFormData({ email: "", password: "", fullName: "", role: "technician", status: "active" });
            setShowCreateModal(true);
          }}
          className="button-primary"
        >
          + Créer un utilisateur
        </button>
      </div>

      {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Users Table */}
      <div style={{ overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Email</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Nom complet</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Rôle</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Statut</th>
              <th style={{ padding: 12, textAlign: "right", fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: 12 }}>{user.email}</td>
                <td style={{ padding: 12 }}>{user.full_name}</td>
                <td style={{ padding: 12 }}>{roleLabels[user.role] || user.role}</td>
                <td style={{ padding: 12 }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: user.status === "active" ? "#dcfce7" : "#fee2e2",
                      color: user.status === "active" ? "#166534" : "#991b1b",
                    }}
                  >
                    {user.status === "active" ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <button onClick={() => openEditModal(user)} className="button-secondary" style={{ marginRight: 8 }}>
                    Modifier
                  </button>
                  <button onClick={() => openDeleteModal(user)} style={{ padding: "6px 12px", color: "#dc2626", border: "1px solid #dc2626", borderRadius: 6, background: "white" }}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          {((page - 1) * 4) + 1} à {Math.min(page * 4, total)} de {total} utilisateurs
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="button-secondary"
          >
            ← Page précédente
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pages}
            className="button-secondary"
          >
            Page suivante →
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, maxWidth: 500, width: "90%" }}>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Nouvel utilisateur</h2>
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label">Mot de passe</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <div className="hint">Min 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial</div>
              </div>
              <div className="form-row">
                <label className="label">Nom complet</label>
                <input
                  type="text"
                  className="input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label">Rôle</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="admin">Administrateur</option>
                  <option value="manager">Responsable</option>
                  <option value="sales_rep">Représentant commercial</option>
                  <option value="technician">Technicien</option>
                </select>
              </div>
              <div className="form-row">
                <label className="label">Statut</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="button-primary">Créer</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="button-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, maxWidth: 500, width: "90%" }}>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Modifier l'utilisateur</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-row">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label">Nom complet</label>
                <input
                  type="text"
                  className="input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label">Rôle</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Administrateur</option>
                  <option value="manager">Responsable</option>
                  <option value="sales_rep">Représentant commercial</option>
                  <option value="technician">Technicien</option>
                </select>
              </div>
              <div className="form-row">
                <label className="label">Statut</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="button-primary">Sauvegarder</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="button-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, maxWidth: 400, width: "90%" }}>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Confirmer la suppression</h2>
            <p style={{ marginBottom: 8 }}>Êtes-vous sûr de vouloir supprimer cet utilisateur? Cette action est irréversible.</p>
            <p style={{ fontWeight: 600, marginBottom: 16 }}>{selectedUser.email}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleDelete} style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: 6, fontWeight: 600 }}>
                Supprimer
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="button-secondary">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
