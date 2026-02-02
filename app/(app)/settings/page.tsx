"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/TopBar";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";

type User = {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: string;
  company_id: string;
  created_at: string;
  contract_document_url?: string | null;
  contract_signed_at?: string | null;
  id_document_front_url?: string | null;
  avatar_url?: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const { language, setLanguage: changeLanguage, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "documents" | "preferences">("profile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  // Document URLs
  const [documentUrls, setDocumentUrls] = useState<{
    contract: string | null;
    id_photo: string | null;
    profile_photo: string | null;
  }>({
    contract: null,
    id_photo: null,
    profile_photo: null,
  });

  // Profile edit
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [showEditPhone, setShowEditPhone] = useState(false);
  const [editPhone, setEditPhone] = useState("");

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");

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
        setEditEmail(userData.data.email);
        setEditPhone(userData.data.phone || "");
        await refreshDocumentUrls(userData.data);
      }
    } catch (err) {
      setError(t("error.unknown"));
    }
  }

  async function refreshDocumentUrls(nextUser: User) {
    const types: Array<{ type: "contract" | "id_photo" | "profile_photo"; hasValue: boolean }> = [
      { type: "contract", hasValue: Boolean(nextUser.contract_document_url) },
      { type: "id_photo", hasValue: Boolean(nextUser.id_document_front_url) },
      { type: "profile_photo", hasValue: Boolean(nextUser.avatar_url) },
    ];

    const results = await Promise.all(
      types.map(async ({ type, hasValue }) => {
        if (!hasValue) {
          return { type, url: null };
        }
        const response = await fetch(`/api/settings/document?type=${type}`);
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { type, url: null };
        }
        const url = json.url ?? json.data?.url ?? null;
        return { type, url };
      })
    );

    setDocumentUrls((prev) => {
      const next = { ...prev };
      results.forEach((result) => {
        next[result.type] = result.url;
      });
      return next;
    });
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
        setError(data.error || t("error.unknown"));
        return;
      }

      const uploadedUrl = data?.data?.url ?? null;
      if (uploadedUrl) {
        setDocumentUrls((prev) => ({ ...prev, [type]: uploadedUrl }));
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
      setError(t("error.unknown"));
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
        setError(data.error || t("error.unknown"));
        return;
      }

      setSuccess("Mot de passe changé avec succès. Vous serez déconnecté dans 2 secondes...");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

      // Logout after 2 seconds
      setTimeout(() => {
        handleLogout();
      }, 2000);
    } catch (err) {
      setError(t("error.unknown"));
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
        setError(data.error || t("error.unknown"));
        return;
      }

      setSuccess(t("common.save") + " réussi");
      setShowEditName(false);
      loadUser();
    } catch (err) {
      setError(t("error.unknown"));
    }
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("error.unknown"));
        return;
      }

      setSuccess("Email mis à jour avec succès. Un email de confirmation a été envoyé.");
      setShowEditEmail(false);
      loadUser();
    } catch (err) {
      setError(t("error.unknown"));
    }
  }

  async function handlePhoneUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: editPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("error.unknown"));
        return;
      }

      setSuccess("Téléphone mis à jour avec succès");
      setShowEditPhone(false);
      loadUser();
    } catch (err) {
      setError(t("error.unknown"));
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("ep_access_token");
      localStorage.removeItem("lastPhone");
      router.push("/login?message=deconnecte");
    }
  }

  function handleLanguageChange(newLang: Language) {
    changeLanguage(newLang);
    setSuccess(newLang === "fr" ? "Langue changée vers Français" : "Language changed to English");
    setTimeout(() => setSuccess(""), 2000);
  }

  const roleLabels: Record<string, string> = {
    admin: t("role.admin"),
    manager: t("role.manager"),
    sales_rep: t("role.sales_rep"),
    technician: t("role.technician"),
  };

  const contractStatusLabels = {
    signed: { label: t("documents.status.signed"), color: "#dcfce7", textColor: "#166534" },
    pending: { label: t("documents.status.pending"), color: "#fef3c7", textColor: "#92400e" },
  };

  if (!user) {
    return (
      <div className="page">
        <TopBar title={t("settings.title")} />
        <p className="card-meta" style={{ marginTop: 24 }}>{t("common.loading")}</p>
      </div>
    );
  }

  const contractStatus = user.contract_signed_at
    ? "signed"
    : user.contract_document_url
    ? "pending"
    : null;

  // Check if user needs documents (not admin/manager)
  const needsDocuments = !["admin", "manager"].includes(user.role);

  return (
    <div className="page">
      <TopBar title={t("settings.title")} subtitle={t("settings.subtitle")} />

      {error && (
        <div className="alert" style={{ marginTop: 16, marginBottom: 16, backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert" style={{ marginTop: 16, marginBottom: 16, backgroundColor: "#dcfce7", color: "#166534" }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 16, borderBottom: "2px solid #e5e7eb", marginTop: 24, marginBottom: 24, overflowX: "auto" }}>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            padding: "12px 16px",
            fontWeight: 600,
            borderBottom: activeTab === "profile" ? "2px solid #1E40AF" : "2px solid transparent",
            color: activeTab === "profile" ? "#1E40AF" : "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {t("settings.profile")}
        </button>
        <button
          onClick={() => setActiveTab("security")}
          style={{
            padding: "12px 16px",
            fontWeight: 600,
            borderBottom: activeTab === "security" ? "2px solid #1E40AF" : "2px solid transparent",
            color: activeTab === "security" ? "#1E40AF" : "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {t("settings.security")}
        </button>
        {needsDocuments && (
          <button
            onClick={() => setActiveTab("documents")}
            style={{
              padding: "12px 16px",
              fontWeight: 600,
              borderBottom: activeTab === "documents" ? "2px solid #1E40AF" : "2px solid transparent",
              color: activeTab === "documents" ? "#1E40AF" : "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t("settings.documents")}
          </button>
        )}
        <button
          onClick={() => setActiveTab("preferences")}
          style={{
            padding: "12px 16px",
            fontWeight: 600,
            borderBottom: activeTab === "preferences" ? "2px solid #1E40AF" : "2px solid transparent",
            color: activeTab === "preferences" ? "#1E40AF" : "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Préférences
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <section className="section">
          <div className="card">
            <h2 className="card-title">{t("settings.profile")}</h2>
            <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>{t("profile.name")}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>{user.full_name}</p>
                  <button onClick={() => setShowEditName(true)} className="button-ghost">
                    {t("common.edit")}
                  </button>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>{t("profile.email")}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: 16 }}>{user.email}</p>
                  <button onClick={() => setShowEditEmail(true)} className="button-ghost">
                    {t("common.edit")}
                  </button>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>{t("profile.phone")}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: 16 }}>{user.phone || "Non fourni"}</p>
                  <button onClick={() => setShowEditPhone(true)} className="button-ghost">
                    {t("common.edit")}
                  </button>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>{t("profile.role")}</p>
                <p style={{ fontSize: 16 }}>{roleLabels[user.role] || user.role}</p>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>{t("profile.created")}</p>
                <p style={{ fontSize: 16 }}>
                  {new Date(user.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <section className="section">
          <div className="card">
            <h2 className="card-title">{t("security.password.change")}</h2>
            <form onSubmit={handlePasswordChange} style={{ marginTop: 16 }}>
              <div className="form-row">
                <label className="label">{t("security.password.current")}</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label">{t("security.password.new")}</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                />
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  <span
                    className="pill"
                    style={{
                      backgroundColor:
                        passwordStrength === "strong" ? "#dcfce7" : passwordStrength === "medium" ? "#fef3c7" : "#fee2e2",
                      color: passwordStrength === "strong" ? "#166534" : passwordStrength === "medium" ? "#92400e" : "#991b1b",
                    }}
                  >
                    {passwordStrength === "strong"
                      ? t("security.password.strength.strong")
                      : passwordStrength === "medium"
                      ? t("security.password.strength.medium")
                      : t("security.password.strength.weak")}
                  </span>
                </div>
                <div className="hint">Min 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial</div>
              </div>
              <div className="form-row">
                <label className="label">{t("security.password.confirm")}</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="button-primary">
                {t("security.password.change")}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Documents Tab (only for sales_rep and technician) */}
      {activeTab === "documents" && needsDocuments && (
        <section className="section">
          {/* Contract */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="card-title">{t("documents.contract")}</h3>
            {user.contract_document_url && contractStatus ? (
              <div>
                <span className="pill" style={{
                  backgroundColor: contractStatusLabels[contractStatus]?.color || "#e5e7eb",
                  color: contractStatusLabels[contractStatus]?.textColor || "#000",
                  marginBottom: 12,
                }}>
                  {contractStatusLabels[contractStatus]?.label || contractStatus}
                </span>
                {contractStatus === "signed" && documentUrls.contract && (
                  <div>
                    <a href={documentUrls.contract} target="_blank" rel="noopener noreferrer" className="button-secondary">
                      {t("documents.view")}
                    </a>
                  </div>
                )}
                {contractStatus === "pending" && (
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
                <p className="card-meta" style={{ marginBottom: 8 }}>
                  PDF uniquement, max 5MB
                </p>
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
            <h3 className="card-title">{t("documents.id")}</h3>
            {documentUrls.id_photo ? (
              <div>
                <Image
                  src={documentUrls.id_photo}
                  alt="ID"
                  width={100}
                  height={100}
                  sizes="100px"
                  style={{ objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                />
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
                <p className="card-meta" style={{ marginBottom: 8 }}>
                  JPG ou PNG uniquement, max 5MB
                </p>
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
            <h3 className="card-title">{t("profile.avatar")}</h3>
            {documentUrls.profile_photo ? (
              <div>
                <Image
                  src={documentUrls.profile_photo}
                  alt="Profile"
                  width={200}
                  height={200}
                  sizes="200px"
                  style={{ objectFit: "cover", borderRadius: "50%", marginBottom: 12 }}
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
                <p className="card-meta" style={{ marginBottom: 8 }}>
                  JPG ou PNG uniquement, max 5MB
                </p>
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
        </section>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <section className="section">
          <div className="card">
            <h2 className="card-title">{t("settings.language")}</h2>
            <div className="card-meta" style={{ marginBottom: 16 }}>
              Choisissez votre langue préférée
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => handleLanguageChange("fr")}
                className={language === "fr" ? "button-primary" : "button-secondary"}
              >
                {t("settings.language.french")}
              </button>
              <button
                onClick={() => handleLanguageChange("en")}
                className={language === "en" ? "button-primary" : "button-secondary"}
              >
                {t("settings.language.english")}
              </button>
            </div>
          </div>
        </section>
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
          {t("logout.title")}
        </button>
      </div>

      {/* Edit Name Modal */}
      {showEditName && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2 className="card-title">{t("profile.edit.name")}</h2>
            <form onSubmit={handleNameUpdate}>
              <div className="form-row">
                <label className="label">{t("profile.name")}</label>
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
                <button type="submit" className="button-primary">{t("common.save")}</button>
                <button type="button" onClick={() => setShowEditName(false)} className="button-secondary">
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Email Modal */}
      {showEditEmail && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2 className="card-title">Modifier l&apos;email</h2>
            <form onSubmit={handleEmailUpdate}>
              <div className="form-row">
                <label className="label">{t("profile.email")}</label>
                <input
                  type="email"
                  className="input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
                <div className="hint">Un email de confirmation sera envoyé</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="button-primary">{t("common.save")}</button>
                <button type="button" onClick={() => setShowEditEmail(false)} className="button-secondary">
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Phone Modal */}
      {showEditPhone && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2 className="card-title">Modifier le téléphone</h2>
            <form onSubmit={handlePhoneUpdate}>
              <div className="form-row">
                <label className="label">{t("profile.phone")}</label>
                <input
                  type="tel"
                  className="input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+1 (514) 555-0123"
                />
                <div className="hint">Format: +1 (XXX) XXX-XXXX</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="button-primary">{t("common.save")}</button>
                <button type="button" onClick={() => setShowEditPhone(false)} className="button-secondary">
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2 className="card-title">{t("logout.confirm")}</h2>
            <p style={{ marginBottom: 16 }}>{t("logout.message")}</p>
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
                {t("common.yes")}
              </button>
              <button onClick={() => setShowLogoutModal(false)} className="button-secondary">
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
