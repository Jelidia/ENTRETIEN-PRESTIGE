"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";

type JobRow = {
  job_id: string;
  service_type: string;
  status: string;
  scheduled_date: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  address?: string;
  estimated_revenue?: number;
};

type SalesDaySchedule = {
  assignmentId: string;
  salesDayId: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingAddress?: string | null;
  meetingCity?: string | null;
  meetingPostalCode?: string | null;
  notes?: string | null;
  overrideStartTime?: string | null;
  overrideMeetingAddress?: string | null;
  overrideMeetingCity?: string | null;
  overrideMeetingPostalCode?: string | null;
  notesOverride?: string | null;
  masterPolygon?: unknown;
  subPolygon?: unknown;
};

type SalesDayAssignmentResponse = {
  assignment_id: string;
  override_start_time?: string | null;
  override_meeting_address?: string | null;
  override_meeting_city?: string | null;
  override_meeting_postal_code?: string | null;
  notes_override?: string | null;
  sub_polygon_coordinates?: unknown;
  sales_days?: {
    sales_day_id: string;
    sales_day_date: string;
    start_time: string;
    end_time: string;
    meeting_address?: string | null;
    meeting_city?: string | null;
    meeting_postal_code?: string | null;
    notes?: string | null;
    master_polygon_coordinates?: unknown;
  };
};

type TerritoryRow = {
  territory_id: string;
  territory_name: string | null;
  sales_rep_id?: string | null;
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

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTimeRange(start?: string, end?: string) {
  const safeStart = start ? start.slice(0, 5) : "";
  const safeEnd = end ? end.slice(0, 5) : "";
  if (safeStart && safeEnd) return `${safeStart} - ${safeEnd}`;
  return safeStart || safeEnd || "";
}

function formatSalesDayDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTimeShort(value?: string | null) {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function normalizePolygonCoordinates(value: unknown): MapCenter[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        const [lat, lng] = point;
        if (typeof lat === "number" && typeof lng === "number") {
          return { lat, lng };
        }
      }
      if (!point || typeof point !== "object") return null;
      const candidate = point as { lat?: unknown; lng?: unknown };
      if (typeof candidate.lat === "number" && typeof candidate.lng === "number") {
        return { lat: candidate.lat, lng: candidate.lng };
      }
      return null;
    })
    .filter(Boolean) as MapCenter[];
}

export default function SalesSchedulePage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [status, setStatus] = useState("");
  const [territory, setTerritory] = useState<TerritoryRow | null>(null);
  const [territoryStatus, setTerritoryStatus] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [salesDays, setSalesDays] = useState<SalesDaySchedule[]>([]);
  const [salesDayStatus, setSalesDayStatus] = useState("");
  const [selectedSalesDayId, setSelectedSalesDayId] = useState("");
  const [showSalesDayMap, setShowSalesDayMap] = useState(false);
  const [salesDayMapReady, setSalesDayMapReady] = useState(false);
  const [salesDayMapError, setSalesDayMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMapInstance | null>(null);
  const polygonInstance = useRef<GooglePolygonInstance | null>(null);
  const salesDayMapRef = useRef<HTMLDivElement | null>(null);
  const salesDayMapInstance = useRef<GoogleMapInstance | null>(null);
  const masterPolygonInstance = useRef<GooglePolygonInstance | null>(null);
  const subPolygonInstance = useRef<GooglePolygonInstance | null>(null);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const polygonPoints = useMemo(() => {
    return normalizePolygonCoordinates(territory?.polygon_coordinates);
  }, [territory]);

  const selectedSalesDay = useMemo(() => {
    if (!selectedSalesDayId) return null;
    return salesDays.find((day) => day.salesDayId === selectedSalesDayId) ?? null;
  }, [salesDays, selectedSalesDayId]);

  const masterPolygonPoints = useMemo(() => {
    return normalizePolygonCoordinates(selectedSalesDay?.masterPolygon);
  }, [selectedSalesDay?.masterPolygon]);

  const subPolygonPoints = useMemo(() => {
    return normalizePolygonCoordinates(selectedSalesDay?.subPolygon);
  }, [selectedSalesDay?.subPolygon]);

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
        script.onerror = () => reject(new Error("Map script failed"));
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

  const initSalesDayMap = useCallback(() => {
    const google = getGoogle();
    const maps = google?.maps;
    if (!maps) {
      return;
    }
    salesDayMapInstance.current = new maps.Map(salesDayMapRef.current, {
      center: { lat: 45.5017, lng: -73.5673 },
      zoom: 11,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });
    setSalesDayMapReady(true);
  }, [getGoogle]);

  const renderSalesDayPolygons = useCallback(() => {
    const google = getGoogle();
    const maps = google?.maps;
    if (!maps || !salesDayMapInstance.current) {
      return;
    }

    if (masterPolygonPoints.length < 3) {
      if (masterPolygonInstance.current) {
        masterPolygonInstance.current.setMap(null);
        masterPolygonInstance.current = null;
      }
    } else if (!masterPolygonInstance.current) {
      masterPolygonInstance.current = new maps.Polygon({
        paths: masterPolygonPoints,
        map: salesDayMapInstance.current,
        strokeColor: "#1e3a8a",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#bfdbfe",
        fillOpacity: 0.25,
      });
    } else {
      masterPolygonInstance.current.setPath(masterPolygonPoints);
    }

    if (subPolygonPoints.length < 3) {
      if (subPolygonInstance.current) {
        subPolygonInstance.current.setMap(null);
        subPolygonInstance.current = null;
      }
    } else if (!subPolygonInstance.current) {
      subPolygonInstance.current = new maps.Polygon({
        paths: subPolygonPoints,
        map: salesDayMapInstance.current,
        strokeColor: "#0f766e",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#5eead4",
        fillOpacity: 0.3,
      });
    } else {
      subPolygonInstance.current.setPath(subPolygonPoints);
    }

    if (masterPolygonPoints.length) {
      salesDayMapInstance.current.setCenter(masterPolygonPoints[0]);
    } else if (subPolygonPoints.length) {
      salesDayMapInstance.current.setCenter(subPolygonPoints[0]);
    }
  }, [getGoogle, masterPolygonPoints, subPolygonPoints]);

  const mapMessage = useMemo(() => {
    if (!mapsKey) return "Carte désactivée. Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.";
    if (mapError) return mapError;
    if (!mapReady) return "Chargement de la carte...";
    if (polygonPoints.length < 3) return "Aucun polygone disponible.";
    return "";
  }, [mapsKey, mapError, mapReady, polygonPoints.length]);

  const salesDayMapMessage = useMemo(() => {
    if (!mapsKey) return "Carte désactivée. Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.";
    if (salesDayMapError) return salesDayMapError;
    if (!salesDayMapReady) return "Chargement de la carte...";
    if (!selectedSalesDay) return "Selectionnez une journee.";
    if (!masterPolygonPoints.length && !subPolygonPoints.length) return "Aucune zone a afficher.";
    return "";
  }, [mapsKey, masterPolygonPoints.length, salesDayMapError, salesDayMapReady, selectedSalesDay, subPolygonPoints.length]);

  useEffect(() => {
    void loadJobs();
    void loadTerritory();
    void loadSalesDays();
  }, []);

  async function loadJobs() {
    setStatus("");
    const response = await fetch("/api/jobs");
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to load schedule");
      return;
    }
    setJobs(json.data ?? []);
  }

  async function loadTerritory() {
    setTerritoryStatus("");
    const response = await fetch("/api/maps/territory");
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setTerritoryStatus(json.error ?? "Impossible de charger le territoire");
      return;
    }
    const list = (json.data ?? []) as TerritoryRow[];
    setTerritory(list[0] ?? null);
  }

  async function loadSalesDays() {
    setSalesDayStatus("");
    const response = await fetch("/api/dispatch/sales-days");
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setSalesDayStatus(json.error ?? "Impossible de charger les journees de vente");
      return;
    }
    const list = (json.data ?? []) as SalesDayAssignmentResponse[];
    const mapped = list
      .map((assignment) => {
        const day = assignment.sales_days;
        if (!day) {
          return null;
        }
        return {
          assignmentId: assignment.assignment_id,
          salesDayId: day.sales_day_id,
          date: day.sales_day_date,
          startTime: day.start_time,
          endTime: day.end_time,
          meetingAddress: day.meeting_address ?? null,
          meetingCity: day.meeting_city ?? null,
          meetingPostalCode: day.meeting_postal_code ?? null,
          notes: day.notes ?? null,
          overrideStartTime: assignment.override_start_time ?? null,
          overrideMeetingAddress: assignment.override_meeting_address ?? null,
          overrideMeetingCity: assignment.override_meeting_city ?? null,
          overrideMeetingPostalCode: assignment.override_meeting_postal_code ?? null,
          notesOverride: assignment.notes_override ?? null,
          masterPolygon: day.master_polygon_coordinates ?? null,
          subPolygon: assignment.sub_polygon_coordinates ?? null,
        } satisfies SalesDaySchedule;
      })
      .filter(Boolean) as SalesDaySchedule[];
    mapped.sort((a, b) => new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime());
    setSalesDays(mapped);
    if (mapped.length === 0) {
      setSelectedSalesDayId("");
      return;
    }
    const hasSelection = mapped.some((day) => day.salesDayId === selectedSalesDayId);
    if (!hasSelection) {
      setSelectedSalesDayId(mapped[0].salesDayId);
    }
  }

  const upcoming = useMemo(() => jobs.slice(0, 8), [jobs]);

  useEffect(() => {
    if (!showMap) return;
    if (!mapsKey || !mapRef.current) {
      return;
    }
    if (mapInstance.current) {
      return;
    }
    void loadGoogleMaps(mapsKey)
      .then(() => initMap())
      .catch(() => setMapError("Impossible de charger la carte"));
  }, [initMap, loadGoogleMaps, mapsKey, showMap]);

  useEffect(() => {
    if (showMap) return;
    mapInstance.current = null;
    polygonInstance.current = null;
    setMapReady(false);
  }, [showMap]);

  useEffect(() => {
    if (!showMap || !mapReady) return;
    renderPolygon();
  }, [mapReady, renderPolygon, showMap]);

  useEffect(() => {
    if (!showSalesDayMap) return;
    if (!mapsKey || !salesDayMapRef.current) {
      return;
    }
    if (salesDayMapInstance.current) {
      return;
    }
    void loadGoogleMaps(mapsKey)
      .then(() => initSalesDayMap())
      .catch(() => setSalesDayMapError("Impossible de charger la carte"));
  }, [initSalesDayMap, loadGoogleMaps, mapsKey, showSalesDayMap]);

  useEffect(() => {
    if (showSalesDayMap) return;
    salesDayMapInstance.current = null;
    masterPolygonInstance.current = null;
    subPolygonInstance.current = null;
    setSalesDayMapReady(false);
  }, [showSalesDayMap]);

  useEffect(() => {
    if (!showSalesDayMap || !salesDayMapReady) return;
    renderSalesDayPolygons();
  }, [renderSalesDayPolygons, salesDayMapReady, showSalesDayMap]);

  return (
    <div className="page">
      <TopBar
        title="Mon horaire"
        subtitle="Rendez-vous à venir"
        actions={
          <button
            className="button-ghost"
            type="button"
            onClick={() => {
              void loadJobs();
              void loadTerritory();
              void loadSalesDays();
            }}
          >
            Rafraîchir
          </button>
        }
      />

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Mon territoire</h3>
            <div className="card-meta">
              {territory?.territory_name ?? "Aucun territoire assigné"}
            </div>
          </div>
          <button
            className="button-secondary"
            type="button"
            onClick={() => setShowMap((prev) => !prev)}
            disabled={!territory}
          >
            {showMap ? "Masquer la carte" : "Voir la carte"}
          </button>
        </div>
        {territoryStatus ? <div className="hint">{territoryStatus}</div> : null}
        {showMap && territory ? (
          <div className="map-shell" style={{ marginTop: 12 }}>
            <div className="map-canvas" ref={mapRef} />
            {mapMessage ? <div className="map-overlay">{mapMessage}</div> : null}
          </div>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Mes journees de vente</h3>
            <div className="card-meta">
              {salesDays.length ? "Vos assignations a venir" : "Aucune assignation"}
            </div>
          </div>
          {salesDays.length ? (
            <button
              className="button-secondary"
              type="button"
              onClick={() => setShowSalesDayMap((prev) => !prev)}
            >
              {showSalesDayMap ? "Masquer la carte" : "Voir la carte"}
            </button>
          ) : null}
        </div>
        {salesDayStatus ? <div className="hint">{salesDayStatus}</div> : null}
        {salesDays.length === 0 ? (
          <div className="card-meta" style={{ marginTop: 12 }}>
            Aucune journee planifiee.
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            {salesDays.length > 1 ? (
              <div className="form-row">
                <label className="label" htmlFor="salesDaySelect">Journee</label>
                <select
                  id="salesDaySelect"
                  className="select"
                  value={selectedSalesDayId}
                  onChange={(event) => setSelectedSalesDayId(event.target.value)}
                >
                  {salesDays.map((day) => (
                    <option key={day.salesDayId} value={day.salesDayId}>
                      {formatSalesDayDate(day.date)} {formatTimeShort(day.startTime)}-{formatTimeShort(day.endTime)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {selectedSalesDay ? (
              <div className="list" style={{ marginTop: 12 }}>
                <div className="list-item list-item-stack">
                  <div style={{ width: "100%" }}>
                    <strong>{formatSalesDayDate(selectedSalesDay.date)}</strong>
                    <div className="card-meta">
                      Heure de depart : {formatTimeShort(selectedSalesDay.overrideStartTime || selectedSalesDay.startTime)}
                    </div>
                    <div className="card-meta">
                      Adresse : {[
                        selectedSalesDay.overrideMeetingAddress || selectedSalesDay.meetingAddress,
                        selectedSalesDay.overrideMeetingCity || selectedSalesDay.meetingCity,
                        selectedSalesDay.overrideMeetingPostalCode || selectedSalesDay.meetingPostalCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Adresse a confirmer"}
                    </div>
                    {(selectedSalesDay.notesOverride || selectedSalesDay.notes) ? (
                      <div className="card-meta" style={{ marginTop: 4 }}>
                        Notes : {selectedSalesDay.notesOverride || selectedSalesDay.notes}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {showSalesDayMap ? (
              <div className="map-shell" style={{ marginTop: 12 }}>
                <div className="map-canvas" ref={salesDayMapRef} />
                {salesDayMapMessage ? <div className="map-overlay">{salesDayMapMessage}</div> : null}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {upcoming.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "32px" }}>
          <div className="card-title">Aucun rendez-vous</div>
          <div className="card-meta">Vos prochaines visites s'afficheront ici.</div>
        </div>
      ) : (
        <div className="list">
          {upcoming.map((job) => (
            <div className="list-item" key={job.job_id}>
              <div>
                <strong>{job.service_type || "Service"}</strong>
                <div className="card-meta">
                  {formatDate(job.scheduled_date)} · {formatTimeRange(job.scheduled_start_time, job.scheduled_end_time)}
                </div>
                <div className="card-meta">{job.address ?? "Adresse à confirmer"}</div>
              </div>
              <div style={{ display: "grid", gap: "8px", justifyItems: "end" }}>
                <StatusBadge status={job.status ?? "Scheduled"} />
                {job.estimated_revenue ? <span className="tag">${job.estimated_revenue}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
