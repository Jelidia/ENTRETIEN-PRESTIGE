"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";

type User = {
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
  day_of_week?: string | null;
  polygon?: unknown;
};

const daysOfWeek = [
  { value: "monday", label: "Lundi" },
  { value: "tuesday", label: "Mardi" },
  { value: "wednesday", label: "Mercredi" },
  { value: "thursday", label: "Jeudi" },
  { value: "friday", label: "Vendredi" },
  { value: "saturday", label: "Samedi" },
  { value: "sunday", label: "Dimanche" },
];

export default function SalesSettingsPage() {
  const { language, setLanguage: changeLanguage, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setStatus("");
    setError("");

    const profileRes = await fetch("/api/users/me");
    const profileJson = await profileRes.json().catch(() => null);
    if (!profileRes.ok || !profileJson?.user_id) {
      setError(profileJson?.error ?? "Impossible de charger le profil");
      return;
    }
    setUser(profileJson as User);

    const territoryRes = await fetch("/api/reports/territories");
    const territoryJson = await territoryRes.json().catch(() => ({ data: [] }));
    if (!territoryRes.ok) {
      setError(territoryJson.error ?? "Impossible de charger le territoire");
      return;
    }
    const list = (territoryJson.data ?? []).filter(
      (row: Territory) => row.sales_rep_id === profileJson.user_id
    );
    setTerritories(list);

    // Set selected day if territory has one
    if (list.length > 0 && list[0].day_of_week) {
      setSelectedDay(list[0].day_of_week);
    }
  }

  async function updateDayOfWeek() {
    if (!selectedDay || territories.length === 0) {
      setError("Veuillez sélectionner un jour");
      return;
    }

    setError("");
    setStatus("Mise à jour...");

    try {
      const res = await fetch("/api/reports/territories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          territory_id: territories[0].territory_id,
          day_of_week: selectedDay,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Échec de la mise à jour");
        setStatus("");
        return;
      }

      setStatus("Jour de la semaine mis à jour avec succès");
      setTimeout(() => {
        loadData();
        setStatus("");
      }, 2000);
    } catch (err) {
      setError("Une erreur s'est produite");
      setStatus("");
    }
  }

  function handleLanguageChange(newLang: Language) {
    changeLanguage(newLang);
    setStatus(newLang === "fr" ? "Langue changée vers Français" : "Language changed to English");
    setTimeout(() => setStatus(""), 2000);
  }

  return (
    <div className="page">
      <TopBar
        title={t("settings.title")}
        subtitle="Profil et territoire"
      />

      {error && (
        <div className="alert" style={{ marginTop: 16, marginBottom: 16, backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}
      {status && (
        <div className="alert" style={{ marginTop: 16, marginBottom: 16, backgroundColor: "#dcfce7", color: "#166534" }}>
          {status}
        </div>
      )}

      {/* Profile Card */}
      <section className="card" style={{ marginTop: 24 }}>
        <h3 className="card-title">{t("settings.profile")}</h3>
        {user ? (
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <div>
              <div className="card-label">{t("profile.name")}</div>
              <div className="card-value">{user.full_name}</div>
            </div>
            <div>
              <div className="card-label">{t("profile.email")}</div>
              <div className="card-value">{user.email}</div>
            </div>
            <div>
              <div className="card-label">{t("profile.phone")}</div>
              <div className="card-value">{user.phone || "Non fourni"}</div>
            </div>
            <div>
              <div className="card-label">{t("profile.role")}</div>
              <div className="card-value">{t("role.sales_rep")}</div>
            </div>
          </div>
        ) : (
          <div className="card-meta">{t("common.loading")}</div>
        )}
      </section>

      {/* Territory Assignment */}
      <section className="card" style={{ marginTop: 16 }}>
        <h3 className="card-title">{t("settings.territory")}</h3>
        {territories.length === 0 ? (
          <div className="card-meta" style={{ marginTop: 12 }}>
            Aucun territoire assigné pour le moment.
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div className="list">
              {territories.map((territory) => (
                <div className="list-item list-item-stack" key={territory.territory_id}>
                  <div style={{ width: "100%" }}>
                    <strong>{territory.territory_name}</strong>
                    <div className="card-meta">
                      {territory.active_customers ?? 0} clients actifs • {territory.total_customers ?? 0} total
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <span className="card-meta">Revenu mensuel</span>
                    <span className="pill" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                      {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(territory.monthly_revenue ?? 0)}
                    </span>
                  </div>
                  {territory.day_of_week && (
                    <div className="card-meta">
                      Jour assigné: <strong>{daysOfWeek.find(d => d.value === territory.day_of_week)?.label || territory.day_of_week}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Day of Week Selector */}
            <div style={{ marginTop: 16 }}>
              <h4 className="card-label" style={{ marginBottom: 8 }}>
                Jour de la semaine préféré
              </h4>
              <div className="form-row">
                <label className="label">Choisir un jour</label>
                <select
                  className="select"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                >
                  <option value="">Sélectionner un jour</option>
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={updateDayOfWeek}
                className="button-primary"
                style={{ marginTop: 12 }}
                disabled={!selectedDay}
              >
                Mettre à jour le jour
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Language Preference */}
      <section className="card" style={{ marginTop: 16 }}>
        <h3 className="card-title">{t("settings.language")}</h3>
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
      </section>

      {/* Notifications */}
      <section className="card" style={{ marginTop: 16 }}>
        <h3 className="card-title">{t("settings.notifications")}</h3>
        <div className="card-meta">
          Vos alertes sont gérées par l&apos;équipe des opérations.
        </div>
        <button className="button-secondary" type="button" style={{ marginTop: 12 }}>
          Gérer les alertes
        </button>
      </section>
    </div>
  );
}
