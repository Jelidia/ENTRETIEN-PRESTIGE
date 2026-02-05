"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopBar from "@/components/TopBar";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
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
  polygon_coordinates?: unknown;
};

type MapCenter = { lat: number; lng: number };

type GoogleMapInstance = {
  setCenter: (center: MapCenter) => void;
};

type GooglePolygonInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
  setPath: (path: MapCenter[]) => void;
};

type GoogleMapsApi = {
  maps?: {
    Map: new (
      element: HTMLDivElement | null,
      options: {
        center: MapCenter;
        zoom: number;
        mapTypeControl: boolean;
        fullscreenControl: boolean;
        streetViewControl: boolean;
      }
    ) => GoogleMapInstance;
    Polygon: new (options: {
      paths: MapCenter[];
      map: GoogleMapInstance | null;
      strokeColor: string;
      strokeOpacity: number;
      strokeWeight: number;
      fillColor: string;
      fillOpacity: number;
    }) => GooglePolygonInstance;
  };
};

const isMapPoint = (value: unknown): value is MapCenter => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { lat?: unknown; lng?: unknown };
  return typeof candidate.lat === "number" && typeof candidate.lng === "number";
};

export default function SalesSettingsPage() {
  const { language, setLanguage: changeLanguage, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string>("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMapInstance | null>(null);
  const polygonInstance = useRef<GooglePolygonInstance | null>(null);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const selectedTerritory = useMemo(() => {
    if (!territories.length) return null;
    return territories.find((item) => item.territory_id === selectedTerritoryId) ?? territories[0];
  }, [territories, selectedTerritoryId]);

  const polygonPoints = useMemo(() => {
    if (!selectedTerritory?.polygon_coordinates) return [];
    if (!Array.isArray(selectedTerritory.polygon_coordinates)) return [];
    return selectedTerritory.polygon_coordinates
      .map((point) => {
        if (Array.isArray(point) && point.length >= 2) {
          const [lat, lng] = point;
          if (typeof lat === "number" && typeof lng === "number") {
            return { lat, lng };
          }
        }
        return isMapPoint(point) ? point : null;
      })
      .filter(Boolean) as MapCenter[];
  }, [selectedTerritory]);

  const getGoogle = useCallback(() => {
    return (window as unknown as { google?: GoogleMapsApi }).google ?? null;
  }, []);

  const loadGoogleMaps = useCallback(
    (key: string) =>
      new Promise<void>((resolve, reject) => {
        const google = getGoogle();
        if (google?.maps) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Échec du chargement de la carte"));
        document.body.appendChild(script);
      }),
    [getGoogle]
  );

  const initMap = useCallback(() => {
    const google = getGoogle();
    const maps = google?.maps;
    if (!maps) {
      return;
    }
    mapInstance.current = new maps.Map(mapRef.current, {
      center: { lat: 45.5017, lng: -73.5673 },
      zoom: 11,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });
    setMapReady(true);
  }, [getGoogle]);

  const renderPolygon = useCallback(() => {
    const google = getGoogle();
    const maps = google?.maps;
    if (!maps || !mapInstance.current) {
      return;
    }

    if (polygonPoints.length < 3) {
      if (polygonInstance.current) {
        polygonInstance.current.setMap(null);
        polygonInstance.current = null;
      }
      return;
    }

    if (!polygonInstance.current) {
      polygonInstance.current = new maps.Polygon({
        paths: polygonPoints,
        map: mapInstance.current,
        strokeColor: "#1e40af",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#93c5fd",
        fillOpacity: 0.3,
      });
    } else {
      polygonInstance.current.setPath(polygonPoints);
    }
    mapInstance.current.setCenter(polygonPoints[0]);
  }, [getGoogle, polygonPoints]);

  const mapMessage = useMemo(() => {
    if (!mapsKey) return "Carte désactivée. Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.";
    if (mapError) return mapError;
    if (!mapReady) return "Chargement de la carte...";
    if (polygonPoints.length < 3) return "Aucun polygone disponible.";
    return "";
  }, [mapsKey, mapError, mapReady, polygonPoints.length]);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!mapsKey || !mapRef.current) {
      return;
    }
    if (mapInstance.current) {
      return;
    }
    void loadGoogleMaps(mapsKey)
      .then(() => initMap())
      .catch(() => setMapError("Impossible de charger la carte"));
  }, [initMap, loadGoogleMaps, mapsKey, territories.length]);

  useEffect(() => {
    if (!mapReady) return;
    renderPolygon();
  }, [mapReady, renderPolygon]);

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

    const territoryRes = await fetch("/api/maps/territory");
    const territoryJson = await territoryRes.json().catch(() => ({ data: [] }));
    if (!territoryRes.ok) {
      setError(territoryJson.error ?? "Impossible de charger le territoire");
      return;
    }
    const list = (territoryJson.data ?? []).filter(
      (row: Territory) => row.sales_rep_id === profileJson.user_id
    );
    setTerritories(list);
    if (!selectedTerritoryId && list.length > 0) {
      setSelectedTerritoryId(list[0].territory_id);
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
                </div>
              ))}
            </div>

            {territories.length > 1 ? (
              <div className="form-row" style={{ marginTop: 16 }}>
                <label className="label" htmlFor="territorySelect">Territoire à afficher</label>
                <select
                  id="territorySelect"
                  className="select"
                  value={selectedTerritoryId}
                  onChange={(event) => setSelectedTerritoryId(event.target.value)}
                >
                  {territories.map((territory) => (
                    <option key={territory.territory_id} value={territory.territory_id}>
                      {territory.territory_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div style={{ marginTop: 16 }}>
              <div className="card-label">Carte du territoire</div>
              <div className="card-meta">Zone assignée pour vos visites.</div>
              <div className="map-shell" style={{ marginTop: 12 }}>
                <div className="map-canvas" ref={mapRef} />
                {mapMessage ? <div className="map-overlay">{mapMessage}</div> : null}
              </div>
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        {user ? (
          <AvailabilityCalendar userId={user.user_id} />
        ) : (
          <div className="card">
            <div className="card-meta">Chargement de la disponibilité...</div>
          </div>
        )}
        <div className="card-meta" style={{ marginTop: 8 }}>
          Mettez à jour votre disponibilité pour la semaine prochaine (max 7 jours d'avance).
        </div>
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
