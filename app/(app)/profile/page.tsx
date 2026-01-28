"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string;
  created_at: string;
  contract_url?: string | null;
  contract_status?: string | null;
  id_photo_url?: string | null;
  profile_photo_url?: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"documents" | "security" | "profile">("documents");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");

  // Profile edit
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState("");

  // Logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    // Calculate password strength
    const pw = passwordForm.newPassword;
    if (pw.length < 8) {
      setPasswordStrength("weak");
    } else if (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[!@#$%^&*]/.test(pw)) {
      setPasswordStrength("strong");
    } else {
      setPasswordStrength("medium");
    }
  }, [passwordForm.newPassword]);

  async function loadUser() {
    try {
      const res = await fetch("/api/access");
      if (!res.ok) throw new Error("Failed to load user");
      const data = await res.json();

      // Get full user data
      const userRes = await fetch(`/api/users/${data.userId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.data);
        setEditName(userData.data.full_name);
      }
    } catch (err) {
      setError("Failed to load profile");
    }
  }

  async function handleFileUpload(type: "contract" | "id_photo" | "profile_photo", file: File) {
    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/settings/upload?type=${type}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to upload file");
        return;
      }

      setSuccess(
        type === "contract"
          ? "Contrat téléchargé avec succès"
          : type === "id_photo"
          ? "Pièce d'identité téléchargée avec succès"
          : "Photo de profil téléchargée avec succès"
      );
      loadUser();
    } catch (err) {
      setError("An error occurred");
    } finally {
      setUploading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change password");
        return;
      }

      setSuccess("Mot de passe changé avec succès. Vous serez déconnecté dans 2 secondes...");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

      // Logout after 2 seconds
      setTimeout(() => {
        handleLogout();
      }, 2000);
    } catch (err) {
      setError("An error occurred");
    }
  }

  async function handleNameUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: editName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update name");
        return;
      }

      setSuccess("Nom mis à jour avec succès");
      setShowEditName(false);
      loadUser();
    } catch (err) {
      setError("An error occurred");
    }
  }

  function handleLogout() {
    // Clear tokens
    localStorage.removeItem("ep_access_token");
    localStorage.removeItem("lastPhone");
    document.cookie = "ep_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Redirect to login
    router.push("/login?message=deconnecte");
  }

  const roleLabels: Record<string, string> = {
    admin: "Administrateur",
    manager: "Responsable",
    sales_rep: "Représentant commercial",
    technician: "Technicien",
  };

  const contractStatusLabels = {
    approved: { label: "Approuvé", color: "#dcfce7", textColor: "#166534" },
    pending: { label: "En attente", color: "#fef3c7", textColor: "#92400e" },
    rejected: { label: "Rejeté", color: "#fee2e2", textColor: "#991b1b" },
  };

  if (!user) {
    return <div className="content"><p>Chargement...</p></div>;
  }

  return (
    <div className="content">
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>Paramètres</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>Gérez votre profil et sécurité</p>

      {error && <div className="alert" style={{ marginBottom: 16, backgroundColor: "#fee2e2", color: "#991b1b" }}>{error}</div>}
      {success && <div className="alert" style={{ marginBottom: 16, backgroundColor: "#dcfce7", color: "#166534" }}>{success}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 16, borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("documents")}
          style={{
            padding: "12px 0",
            fontWeight: 600,
            borderBottom: activeTab === "documents" ? "2px solid #1E40AF" : "2px solid transparent",
            color: activeTab === "documents" ? "#1E40AF" : "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Documents
        </button>
        <button
          onClick={() => setActiveTab("security")}
          style={{
            padding: "12px 0",
            fontWeight: 600,
            borderBottom: activeTab === "security" ? "2px solid #1E40AF" : "2px solid transparent",
            color: activeTab === "security" ? "#1E40AF" : "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Sécurité
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            padding: "12px 0",
            fontWeight: 600,
            borderBottom: activeTab === "profile" ? "2px solid #1E40AF" : "2px solid transparent",
            color: activeTab === "profile" ? "#1E40AF" : "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Mon profil
        </button>
      </div>

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Documents et contrats</h2>

          {/* Contract */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Contrat signé</h3>
            {user.contract_url && user.contract_status ? (
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 500,
                    backgroundColor: contractStatusLabels[user.contract_status as keyof typeof contractStatusLabels]?.color || "#e5e7eb",
                    color: contractStatusLabels[user.contract_status as keyof typeof contractStatusLabels]?.textColor || "#000",
                    marginBottom: 12,
                  }}
                >
                  {contractStatusLabels[user.contract_status as keyof typeof contractStatusLabels]?.label || user.contract_status}
                </span>
                {user.contract_status === "approved" && (
                  <div>
                    <a href={user.contract_url} target="_blank" rel="noopener noreferrer" className="button-secondary">
                      Afficher le PDF
                    </a>
                  </div>
                )}
                {(user.contract_status === "rejected" || user.contract_status === "pending") && (
                  <div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("contract", file);
                      }}
                      style={{ display: "block", marginTop: 8 }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>Télécharger un contrat (PDF uniquement, max 5MB)</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("contract", file);
                  }}
                  disabled={uploading}
                />
              </div>
            )}
          </div>

          {/* ID Photo */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Pièce d'identité</h3>
            {user.id_photo_url ? (
              <div>
                <img src={user.id_photo_url} alt="ID" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <label className="button-secondary" style={{ cursor: "pointer" }}>
                    Changer
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("id_photo", file);
                      }}
                      style={{ display: "none" }}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>JPG ou PNG uniquement, max 5MB</p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("id_photo", file);
                  }}
                  disabled={uploading}
                />
              </div>
            )}
          </div>

          {/* Profile Photo */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Photo de profil</h3>
            {user.profile_photo_url ? (
              <div>
                <img
                  src={user.profile_photo_url}
                  alt="Profile"
                  style={{ width: 200, height: 200, objectFit: "cover", borderRadius: "50%", marginBottom: 12 }}
                />
                <div>
                  <label className="button-secondary" style={{ cursor: "pointer" }}>
                    Changer
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("profile_photo", file);
                      }}
                      style={{ display: "none" }}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>JPG ou PNG uniquement, max 5MB</p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("profile_photo", file);
                  }}
                  disabled={uploading}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Changer votre mot de passe</h2>
          <form onSubmit={handlePasswordChange} className="card">
            <div className="form-row">
              <label className="label">Mot de passe actuel</label>
              <input
                type="password"
                className="input"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label">Nouveau mot de passe</label>
              <input
                type="password"
                className="input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor:
                      passwordStrength === "strong" ? "#dcfce7" : passwordStrength === "medium" ? "#fef3c7" : "#fee2e2",
                    color: passwordStrength === "strong" ? "#166534" : passwordStrength === "medium" ? "#92400e" : "#991b1b",
                  }}
                >
                  {passwordStrength === "strong" ? "Fort" : passwordStrength === "medium" ? "Moyen" : "Faible"}
                </span>
              </div>
              <div className="hint">Min 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial</div>
            </div>
            <div className="form-row">
              <label className="label">Confirmer le mot de passe</label>
              <input
                type="password"
                className="input"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="button-primary">
              Changer le mot de passe
            </button>
          </form>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Mon profil</h2>
          <div className="card">
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>Nom</p>
              <p style={{ fontSize: 16, fontWeight: 600 }}>{user.full_name}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>Email</p>
              <p style={{ fontSize: 16 }}>{user.email}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>Rôle</p>
              <p style={{ fontSize: 16 }}>{roleLabels[user.role] || user.role}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>Inscrit le</p>
              <p style={{ fontSize: 16 }}>
                {new Date(user.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button onClick={() => setShowEditName(true)} className="button-secondary">
              Éditer le nom
            </button>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "2px solid #e5e7eb" }}>
        <button
          onClick={() => setShowLogoutModal(true)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>

      {/* Edit Name Modal */}
      {showEditName && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, maxWidth: 400, width: "90%" }}>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Modifier le nom</h2>
            <form onSubmit={handleNameUpdate}>
              <div className="form-row">
                <label className="label">Nom complet</label>
                <input
                  type="text"
                  className="input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="button-primary">Sauvegarder</button>
                <button type="button" onClick={() => setShowEditName(false)} className="button-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: 24, borderRadius: 12, maxWidth: 400, width: "90%" }}>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Confirmer la déconnexion</h2>
            <p style={{ marginBottom: 16 }}>Êtes-vous sûr? Vous serez déconnecté.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleLogout}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Oui
              </button>
              <button onClick={() => setShowLogoutModal(false)} className="button-secondary">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
