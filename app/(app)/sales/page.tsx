"use client";

import TopBar from "@/components/TopBar";
import { normalizePhoneE164 } from "@/lib/smsTemplates";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type QuickDateOption = { label: string; value: string };

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function getFirstMonday(baseDate: Date) {
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const offset = (8 - firstOfMonth.getDay()) % 7;
  let firstMonday = new Date(year, month, 1 + offset);
  if (firstMonday < base) {
    const nextMonth = new Date(year, month + 1, 1);
    const nextOffset = (8 - nextMonth.getDay()) % 7;
    firstMonday = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1 + nextOffset);
  }
  return firstMonday;
}

function getQuickDateOptions(baseDate = new Date()): QuickDateOption[] {
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return [
    { label: "Demain", value: toDateInputValue(addDays(base, 1)) },
    { label: "Semaine prochaine", value: toDateInputValue(addDays(base, 7)) },
    { label: "Premier lundi du mois", value: toDateInputValue(getFirstMonday(base)) },
  ];
}

type LeadRow = {
  lead_id: string;
  first_name: string;
  last_name: string;
  status: string;
  estimated_job_value?: number;
  follow_up_date?: string;
  city?: string;
};

type TerritoryRow = {
  territory_id: string;
  territory_name: string;
  monthly_revenue?: number;
  total_customers?: number;
  active_customers?: number;
};

type SalesRepRow = {
  user_id: string;
  full_name?: string | null;
  email: string;
  role: string;
};

type SalesDay = {
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

type SalesDayAssignment = {
  assignment_id: string;
  sales_rep_id: string | null;
  override_start_time?: string | null;
  override_meeting_address?: string | null;
  override_meeting_city?: string | null;
  override_meeting_postal_code?: string | null;
  notes_override?: string | null;
  sub_polygon_coordinates?: unknown;
  sales_rep?: {
    user_id: string;
    full_name: string | null;
    email: string;
  } | null;
};

type SalesAvailability = {
  user_id: string;
  full_name: string | null;
  email: string;
  available: boolean;
};

type MapCenter = { lat: number; lng: number };

type GoogleMapInstance = {
  setCenter: (center: MapCenter) => void;
  addListener: (
    event: string,
    handler: (event: { latLng?: { lat: () => number; lng: () => number } }) => void
  ) => { remove: () => void };
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

type LeaderboardRow = {
  rank: number;
  total_revenue?: number;
  leads_generated?: number;
  conversion_rate?: number;
};

function normalizePolygon(value: unknown): MapCenter[] {
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

export default function SalesPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [territories, setTerritories] = useState<TerritoryRow[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRepRow[]>([]);
  const [salesDays, setSalesDays] = useState<SalesDay[]>([]);
  const [salesDayAssignments, setSalesDayAssignments] = useState<SalesDayAssignment[]>([]);
  const [salesDayAvailability, setSalesDayAvailability] = useState<SalesAvailability[]>([]);
  const [leadStatus, setLeadStatus] = useState("");
  const [territoryStatus, setTerritoryStatus] = useState("");
  const [salesDayStatus, setSalesDayStatus] = useState("");
  const quickDates = getQuickDateOptions();
  const [polygonPoints, setPolygonPoints] = useState<MapCenter[]>([]);
  const [salesDayPolygonPoints, setSalesDayPolygonPoints] = useState<MapCenter[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [salesDayMapReady, setSalesDayMapReady] = useState(false);
  const [selectedSalesDayId, setSelectedSalesDayId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [salesDayZoneType, setSalesDayZoneType] = useState<"master" | "sub">("master");
  const [leadForm, setLeadForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    estimatedJobValue: "",
    followUpDate: "",
    notes: "",
  });
  const [territoryForm, setTerritoryForm] = useState({
    territoryName: "",
    salesRepId: "",
    neighborhoods: "",
  });
  const [salesDayForm, setSalesDayForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    meetingAddress: "",
    meetingCity: "",
    meetingPostalCode: "",
    notes: "",
  });
  const [salesDayAssignForm, setSalesDayAssignForm] = useState({
    salesRepId: "",
    overrideStartTime: "",
    overrideMeetingAddress: "",
    overrideMeetingCity: "",
    overrideMeetingPostalCode: "",
    notes: "",
  });
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMapInstance | null>(null);
  const polygonInstance = useRef<GooglePolygonInstance | null>(null);
  const mapClickListener = useRef<{ remove: () => void } | null>(null);
  const salesDayMapRef = useRef<HTMLDivElement | null>(null);
  const salesDayMapInstance = useRef<GoogleMapInstance | null>(null);
  const salesDayMasterPolygonInstance = useRef<GooglePolygonInstance | null>(null);
  const salesDaySubPolygonInstance = useRef<GooglePolygonInstance | null>(null);
  const salesDayClickListener = useRef<{ remove: () => void } | null>(null);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const maxSalesDayDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }, []);

  const getGoogle = useCallback(() => {
    return (window as unknown as { google?: GoogleMapsApi }).google ?? null;
  }, []);

  const loadGoogleMaps = useCallback((key: string) => {
    return new Promise<void>((resolve, reject) => {
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
    });
  }, [getGoogle]);

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
    if (mapClickListener.current) {
      mapClickListener.current.remove();
    }
    mapClickListener.current = mapInstance.current.addListener("click", (event) => {
      const latLng = event.latLng;
      if (!latLng) return;
      setPolygonPoints((prev) => {
        return [...prev, { lat: latLng.lat(), lng: latLng.lng() }];
      });
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
    if (salesDayClickListener.current) {
      salesDayClickListener.current.remove();
    }
    salesDayClickListener.current = salesDayMapInstance.current.addListener("click", (event) => {
      const latLng = event.latLng;
      if (!latLng) return;
      setSalesDayPolygonPoints((prev) => [...prev, { lat: latLng.lat(), lng: latLng.lng() }]);
    });
    setSalesDayMapReady(true);
  }, [getGoogle]);

  const selectedSalesDay = useMemo(() => {
    if (!selectedSalesDayId) return null;
    return salesDays.find((day) => day.sales_day_id === selectedSalesDayId) ?? null;
  }, [salesDays, selectedSalesDayId]);

  const selectedAssignment = useMemo(() => {
    if (!selectedAssignmentId) return null;
    return salesDayAssignments.find((assignment) => assignment.assignment_id === selectedAssignmentId) ?? null;
  }, [salesDayAssignments, selectedAssignmentId]);

  const salesDayMasterPoints = useMemo(() => {
    return normalizePolygon(selectedSalesDay?.master_polygon_coordinates);
  }, [selectedSalesDay]);

  const renderSalesDayPolygons = useCallback(() => {
    const google = getGoogle();
    const maps = google?.maps;
    if (!maps || !salesDayMapInstance.current) {
      return;
    }
    const masterPoints = salesDayZoneType === "sub" ? salesDayMasterPoints : salesDayPolygonPoints;
    const subPoints = salesDayZoneType === "sub" ? salesDayPolygonPoints : [];

    if (masterPoints.length < 3) {
      if (salesDayMasterPolygonInstance.current) {
        salesDayMasterPolygonInstance.current.setMap(null);
        salesDayMasterPolygonInstance.current = null;
      }
    } else if (!salesDayMasterPolygonInstance.current) {
      salesDayMasterPolygonInstance.current = new maps.Polygon({
        paths: masterPoints,
        map: salesDayMapInstance.current,
        strokeColor: "#1e3a8a",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#bfdbfe",
        fillOpacity: 0.25,
      });
    } else {
      salesDayMasterPolygonInstance.current.setPath(masterPoints);
    }

    if (subPoints.length < 3) {
      if (salesDaySubPolygonInstance.current) {
        salesDaySubPolygonInstance.current.setMap(null);
        salesDaySubPolygonInstance.current = null;
      }
    } else if (!salesDaySubPolygonInstance.current) {
      salesDaySubPolygonInstance.current = new maps.Polygon({
        paths: subPoints,
        map: salesDayMapInstance.current,
        strokeColor: "#0f766e",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#5eead4",
        fillOpacity: 0.3,
      });
    } else {
      salesDaySubPolygonInstance.current.setPath(subPoints);
    }

    if (subPoints.length) {
      salesDayMapInstance.current.setCenter(subPoints[0]);
    } else if (masterPoints.length) {
      salesDayMapInstance.current.setCenter(masterPoints[0]);
    }
  }, [getGoogle, salesDayMasterPoints, salesDayPolygonPoints, salesDayZoneType]);

  const mapMessage = useMemo(() => {
    if (!mapsKey) return "Carte désactivée. Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.";
    if (!mapReady) return "Chargement de la carte...";
    if (!polygonPoints.length) return "Cliquez sur la carte pour tracer le territoire.";
    return "";
  }, [mapReady, mapsKey, polygonPoints.length]);

  const salesDayMapMessage = useMemo(() => {
    if (!mapsKey) return "Carte désactivée. Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.";
    if (!salesDayMapReady) return "Chargement de la carte...";
    if (!selectedSalesDayId) return "Sélectionnez une journée.";
    if (salesDayZoneType === "sub" && !selectedAssignmentId) {
      return "Sélectionnez un vendeur pour la zone.";
    }
    if (!salesDayPolygonPoints.length) {
      return "Cliquez sur la carte pour dessiner la zone.";
    }
    return "";
  }, [mapsKey, salesDayMapReady, salesDayPolygonPoints.length, salesDayZoneType, selectedAssignmentId, selectedSalesDayId]);

  const availabilityById = useMemo(() => {
    const map = new Map<string, boolean>();
    salesDayAvailability.forEach((rep) => {
      map.set(rep.user_id, rep.available);
    });
    return map;
  }, [salesDayAvailability]);

  const selectedRepAvailability = useMemo(() => {
    if (!salesDayAssignForm.salesRepId) return null;
    return availabilityById.get(salesDayAssignForm.salesRepId) ?? null;
  }, [availabilityById, salesDayAssignForm.salesRepId]);

  const selectedSalesDayLabel = useMemo(() => {
    if (!selectedSalesDay) return "";
    return `${formatSalesDayDate(selectedSalesDay.sales_day_date)} · ${formatTimeShort(selectedSalesDay.start_time)} - ${formatTimeShort(selectedSalesDay.end_time)}`;
  }, [selectedSalesDay]);

  const selectedSalesDayMeeting = useMemo(() => {
    if (!selectedSalesDay) return "";
    const parts = [selectedSalesDay.meeting_address, selectedSalesDay.meeting_city, selectedSalesDay.meeting_postal_code]
      .filter(Boolean)
      .join(", ");
    return parts || "Adresse à confirmer";
  }, [selectedSalesDay]);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!mapsKey || !mapRef.current) {
      return;
    }
    void loadGoogleMaps(mapsKey)
      .then(() => initMap())
      .catch(() => setTerritoryStatus("Impossible de charger la carte"));
  }, [initMap, loadGoogleMaps, mapsKey]);

  useEffect(() => {
    if (!mapReady) return;
    renderPolygon();
  }, [mapReady, renderPolygon]);

  useEffect(() => {
    if (!selectedSalesDayId) {
      setSalesDayPolygonPoints([]);
      return;
    }
    if (salesDayZoneType === "master") {
      setSalesDayPolygonPoints(normalizePolygon(selectedSalesDay?.master_polygon_coordinates));
      return;
    }
    setSalesDayPolygonPoints(normalizePolygon(selectedAssignment?.sub_polygon_coordinates));
  }, [selectedAssignment, selectedSalesDay, selectedSalesDayId, salesDayZoneType]);

  useEffect(() => {
    if (!mapsKey || !salesDayMapRef.current) {
      return;
    }
    if (salesDayMapInstance.current) {
      return;
    }
    void loadGoogleMaps(mapsKey)
      .then(() => initSalesDayMap())
      .catch(() => setSalesDayStatus("Impossible de charger la carte"));
  }, [initSalesDayMap, loadGoogleMaps, mapsKey]);

  useEffect(() => {
    if (!salesDayMapReady) return;
    renderSalesDayPolygons();
  }, [renderSalesDayPolygons, salesDayMapReady]);

  useEffect(() => {
    if (!selectedSalesDayId || !selectedSalesDay) {
      setSalesDayAssignments([]);
      setSalesDayAvailability([]);
      return;
    }
    void loadSalesDayAssignments(selectedSalesDayId);
    void loadSalesDayAvailability(selectedSalesDay);
  }, [selectedSalesDay, selectedSalesDayId]);

  async function loadData() {
    const [leaderboardRes, leadsRes, territoriesRes, usersRes, salesDaysRes] = await Promise.all([
      fetch("/api/reports/leaderboard"),
      fetch("/api/reports/leads"),
      fetch("/api/maps/territory"),
      fetch("/api/users"),
      fetch("/api/dispatch/sales-days"),
    ]);

    const leaderboardJson = await leaderboardRes.json().catch(() => ({ data: [] }));
    const leadsJson = await leadsRes.json().catch(() => ({ data: [] }));
    const territoriesJson = await territoriesRes.json().catch(() => ({ data: [] }));
    const usersJson = await usersRes.json().catch(() => ({ data: [] }));
    const salesDaysJson = await salesDaysRes.json().catch(() => ({ data: [] }));

    setLeaderboard(leaderboardJson.data ?? []);
    setLeads(leadsJson.data ?? []);
    setTerritories(territoriesJson.data ?? []);
    const reps = (usersJson.data ?? []).filter((item: SalesRepRow) => item.role === "sales_rep");
    setSalesReps(reps);
    if (!territoryForm.salesRepId && reps.length > 0) {
      setTerritoryForm((form) => ({ ...form, salesRepId: reps[0].user_id }));
    }
    if (!salesDayAssignForm.salesRepId && reps.length > 0) {
      setSalesDayAssignForm((form) => ({ ...form, salesRepId: reps[0].user_id }));
    }
    const days = (salesDaysJson.data ?? []) as SalesDay[];
    setSalesDays(days);
    if (days.length === 0) {
      setSelectedSalesDayId("");
      return;
    }
    const hasSelection = days.some((day) => day.sales_day_id === selectedSalesDayId);
    if (!hasSelection) {
      setSelectedSalesDayId(days[0].sales_day_id);
    }
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadStatus("");
    const trimmedPhone = leadForm.phone.trim();
    const normalizedPhone = trimmedPhone ? normalizePhoneE164(trimmedPhone) : "";
    if (trimmedPhone && !normalizedPhone) {
      setLeadStatus("Téléphone invalide. Utilisez le format (514) 555-0123.");
      return;
    }
    const response = await fetch("/api/reports/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...leadForm,
        phone: normalizedPhone ?? "",
        estimatedJobValue: leadForm.estimatedJobValue ? Number(leadForm.estimatedJobValue) : undefined,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setLeadStatus(json.error ?? "Impossible de créer le prospect");
      return;
    }
    setLeadStatus("Prospect créé.");
    setLeadForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      city: "",
      estimatedJobValue: "",
      followUpDate: "",
      notes: "",
    });
    void loadData();
  }

  async function submitTerritory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTerritoryStatus("");
    const neighborhoods = territoryForm.neighborhoods
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (polygonPoints.length < 3) {
      setTerritoryStatus("Veuillez dessiner un polygone.");
      return;
    }
    const response = await fetch("/api/maps/territory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        territoryName: territoryForm.territoryName,
        salesRepId: territoryForm.salesRepId,
        neighborhoods,
        polygonCoordinates: polygonPoints,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setTerritoryStatus(json.error ?? "Impossible de créer le territoire");
      return;
    }
    setTerritoryStatus("Territoire enregistré.");
    setTerritoryForm({ territoryName: "", salesRepId: "", neighborhoods: "" });
    setPolygonPoints([]);
    void loadData();
  }

  async function loadSalesDayAssignments(dayId: string) {
    setSalesDayStatus("");
    const response = await fetch(`/api/dispatch/sales-day-assignments?salesDayId=${dayId}`);
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setSalesDayStatus(json.error ?? "Impossible de charger les assignations");
      return;
    }
    const assignments = (json.data ?? []) as SalesDayAssignment[];
    setSalesDayAssignments(assignments);
    if (assignments.length === 0) {
      setSelectedAssignmentId("");
      return;
    }
    const hasSelection = assignments.some((assignment) => assignment.assignment_id === selectedAssignmentId);
    if (!hasSelection) {
      setSelectedAssignmentId(assignments[0].assignment_id);
    }
  }

  async function loadSalesDayAvailability(day: SalesDay) {
    if (!day.sales_day_date || !day.start_time || !day.end_time) {
      setSalesDayAvailability([]);
      return;
    }
    const params = new URLSearchParams({
      date: day.sales_day_date,
      startTime: day.start_time,
      endTime: day.end_time,
    });
    const response = await fetch(`/api/dispatch/sales-availability?${params.toString()}`);
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setSalesDayStatus(json.error ?? "Impossible de charger les disponibilités");
      return;
    }
    setSalesDayAvailability(json.data ?? []);
  }

  async function submitSalesDay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalesDayStatus("");
    const response = await fetch("/api/dispatch/sales-day-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salesDayDate: salesDayForm.date,
        startTime: salesDayForm.startTime,
        endTime: salesDayForm.endTime,
        meetingAddress: salesDayForm.meetingAddress || undefined,
        meetingCity: salesDayForm.meetingCity || undefined,
        meetingPostalCode: salesDayForm.meetingPostalCode || undefined,
        notes: salesDayForm.notes || undefined,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSalesDayStatus(json.error ?? "Impossible de créer la journée");
      return;
    }
    setSalesDayStatus("Journée créée.");
    setSalesDayForm({
      date: "",
      startTime: "",
      endTime: "",
      meetingAddress: "",
      meetingCity: "",
      meetingPostalCode: "",
      notes: "",
    });
    const createdId = json.data?.sales_day_id as string | undefined;
    void loadData();
    if (createdId) {
      setSelectedSalesDayId(createdId);
    }
  }

  async function submitSalesDayAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSalesDayId) {
      setSalesDayStatus("Sélectionnez une journée.");
      return;
    }
    if (selectedRepAvailability !== true) {
      setSalesDayStatus("Ce vendeur n'est pas disponible sur ce créneau.");
      return;
    }
    setSalesDayStatus("");
    const response = await fetch("/api/dispatch/sales-day-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salesDayId: selectedSalesDayId,
        assignments: [
          {
            salesRepId: salesDayAssignForm.salesRepId,
            overrideStartTime: salesDayAssignForm.overrideStartTime || undefined,
            overrideMeetingAddress: salesDayAssignForm.overrideMeetingAddress || undefined,
            overrideMeetingCity: salesDayAssignForm.overrideMeetingCity || undefined,
            overrideMeetingPostalCode: salesDayAssignForm.overrideMeetingPostalCode || undefined,
            notes: salesDayAssignForm.notes || undefined,
          },
        ],
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSalesDayStatus(json.error ?? "Impossible d'assigner le vendeur");
      return;
    }
    setSalesDayStatus("Assignation enregistrée.");
    setSalesDayAssignForm({
      salesRepId: salesDayAssignForm.salesRepId,
      overrideStartTime: "",
      overrideMeetingAddress: "",
      overrideMeetingCity: "",
      overrideMeetingPostalCode: "",
      notes: "",
    });
    void loadSalesDayAssignments(selectedSalesDayId);
  }

  async function autoAssignSalesDay() {
    if (!selectedSalesDayId) {
      setSalesDayStatus("Sélectionnez une journée.");
      return;
    }
    setSalesDayStatus("");
    const response = await fetch("/api/dispatch/sales-day-auto-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salesDayId: selectedSalesDayId }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSalesDayStatus(json.error ?? "Impossible d'assigner les disponibilités");
      return;
    }
    setSalesDayStatus("Assignations automatiques appliquées.");
    void loadSalesDayAssignments(selectedSalesDayId);
  }

  async function saveSalesDayZone() {
    if (!selectedSalesDayId) {
      setSalesDayStatus("Sélectionnez une journée.");
      return;
    }
    if (salesDayPolygonPoints.length < 3) {
      setSalesDayStatus("Veuillez dessiner un polygone.");
      return;
    }
    if (salesDayZoneType === "sub" && !selectedAssignmentId) {
      setSalesDayStatus("Sélectionnez un vendeur.");
      return;
    }

    const endpoint = salesDayZoneType === "master"
      ? "/api/dispatch/sales-day-master-zone"
      : "/api/dispatch/sales-day-sub-zone";
    const body = salesDayZoneType === "master"
      ? { salesDayId: selectedSalesDayId, polygonCoordinates: salesDayPolygonPoints }
      : { assignmentId: selectedAssignmentId, polygonCoordinates: salesDayPolygonPoints };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSalesDayStatus(json.error ?? "Impossible de sauvegarder la zone");
      return;
    }
    setSalesDayStatus("Zone enregistrée.");
    void loadData();
    if (salesDayZoneType === "sub") {
      void loadSalesDayAssignments(selectedSalesDayId);
    }
  }

  return (
    <div className="page">
      <TopBar
        title="Ventes"
        subtitle="Performance des territoires et pipeline"
        actions={<span className="pill">Pipeline en direct</span>}
      />

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Classement</h3>
          <table className="table table-desktop">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Revenus</th>
                <th>Prospects</th>
                <th>Conversion</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((rep) => (
                <tr key={rep.rank}>
                  <td>{rep.rank}</td>
                  <td>{rep.total_revenue ? `$${rep.total_revenue}` : "$0"}</td>
                  <td>{rep.leads_generated ?? 0}</td>
                  <td>{rep.conversion_rate ? `${rep.conversion_rate}%` : "0%"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-list-mobile" style={{ marginTop: 12 }}>
            {leaderboard.map((rep) => (
              <div className="mobile-card" key={rep.rank}>
                <div className="mobile-card-title">Rang {rep.rank}</div>
                <div className="mobile-card-meta">
                  Revenus : {rep.total_revenue ? `$${rep.total_revenue}` : "$0"}
                </div>
                <div className="mobile-card-meta">Prospects : {rep.leads_generated ?? 0}</div>
                <div className="mobile-card-meta">
                  Conversion : {rep.conversion_rate ? `${rep.conversion_rate}%` : "0%"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Nouveau prospect</h3>
          <form className="form-grid" onSubmit={submitLead}>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="firstName">Prénom</label>
                <input
                  id="firstName"
                  className="input"
                  value={leadForm.firstName}
                  onChange={(event) => setLeadForm({ ...leadForm, firstName: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="lastName">Nom</label>
                <input
                  id="lastName"
                  className="input"
                  value={leadForm.lastName}
                  onChange={(event) => setLeadForm({ ...leadForm, lastName: event.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="leadEmail">Courriel</label>
              <input
                id="leadEmail"
                className="input"
                type="email"
                value={leadForm.email}
                onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })}
              />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="leadPhone">Téléphone</label>
                <input
                  id="leadPhone"
                  className="input"
                  value={leadForm.phone}
                  onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })}
                  placeholder="(514) 555-0123"
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="leadCity">Ville</label>
                <input
                  id="leadCity"
                  className="input"
                  value={leadForm.city}
                  onChange={(event) => setLeadForm({ ...leadForm, city: event.target.value })}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="leadValue">Valeur estimée</label>
                <input
                  id="leadValue"
                  className="input"
                  type="number"
                  value={leadForm.estimatedJobValue}
                  onChange={(event) => setLeadForm({ ...leadForm, estimatedJobValue: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="followUp">Date de relance</label>
                <input
                  id="followUp"
                  className="input"
                  type="date"
                  value={leadForm.followUpDate}
                  onChange={(event) => setLeadForm({ ...leadForm, followUpDate: event.target.value })}
                />
                <div className="table-actions" style={{ marginTop: 6 }}>
                  {quickDates.map((option) => (
                    <button
                      key={option.label}
                      className="tag"
                      type="button"
                      onClick={() => setLeadForm({ ...leadForm, followUpDate: option.value })}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="leadNotes">Notes</label>
              <textarea
                id="leadNotes"
                className="textarea"
                value={leadForm.notes}
                onChange={(event) => setLeadForm({ ...leadForm, notes: event.target.value })}
              />
            </div>
            <button className="button-primary" type="submit">Enregistrer le prospect</button>
            {leadStatus ? <div className="hint">{leadStatus}</div> : null}
          </form>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Territoires</h3>
          <table className="table table-desktop">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Revenus</th>
                <th>Clients</th>
                <th>Actifs</th>
              </tr>
            </thead>
            <tbody>
              {territories.map((territory) => (
                <tr key={territory.territory_id}>
                  <td>{territory.territory_name}</td>
                  <td>{territory.monthly_revenue ? `$${territory.monthly_revenue}` : "$0"}</td>
                  <td>{territory.total_customers ?? 0}</td>
                  <td>{territory.active_customers ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-list-mobile" style={{ marginTop: 12 }}>
            {territories.map((territory) => (
              <div className="mobile-card" key={territory.territory_id}>
                <div className="mobile-card-title">{territory.territory_name}</div>
                <div className="mobile-card-meta">
                  Revenus : {territory.monthly_revenue ? `$${territory.monthly_revenue}` : "$0"}
                </div>
                <div className="mobile-card-meta">Clients : {territory.total_customers ?? 0}</div>
                <div className="mobile-card-meta">Actifs : {territory.active_customers ?? 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Assigner un territoire</h3>
          <form className="form-grid" onSubmit={submitTerritory}>
            <div className="form-row">
              <label className="label" htmlFor="territoryName">Nom du territoire</label>
              <input
                id="territoryName"
                className="input"
                value={territoryForm.territoryName}
                onChange={(event) =>
                  setTerritoryForm({ ...territoryForm, territoryName: event.target.value })
                }
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="salesRepId">Représentant</label>
              <select
                id="salesRepId"
                className="select"
                value={territoryForm.salesRepId}
                onChange={(event) => setTerritoryForm({ ...territoryForm, salesRepId: event.target.value })}
                required
              >
                <option value="">Choisir un représentant</option>
                {salesReps.map((rep) => (
                  <option key={rep.user_id} value={rep.user_id}>
                    {rep.full_name || rep.email}
                  </option>
                ))}
              </select>
              {salesReps.length === 0 ? (
                <div className="card-meta" style={{ marginTop: 6 }}>
                  Aucun représentant disponible.
                </div>
              ) : null}
            </div>
            <div className="form-row">
              <label className="label" htmlFor="neighborhoods">Quartiers (séparés par des virgules)</label>
              <input
                id="neighborhoods"
                className="input"
                value={territoryForm.neighborhoods}
                onChange={(event) =>
                  setTerritoryForm({ ...territoryForm, neighborhoods: event.target.value })
                }
              />
            </div>
            <div>
              <div className="card-label">Carte du territoire</div>
              <div className="card-meta">Cliquez sur la carte pour dessiner le polygone.</div>
              <div className="map-shell" style={{ marginTop: 12 }}>
                <div className="map-canvas" ref={mapRef} />
                {mapMessage ? <div className="map-overlay">{mapMessage}</div> : null}
              </div>
              <div className="table-actions" style={{ marginTop: 12 }}>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={() => {
                    setPolygonPoints([]);
                  }}
                >
                  Effacer le polygone
                </button>
              </div>
            </div>
            <button className="button-primary" type="submit">Enregistrer le territoire</button>
            {territoryStatus ? <div className="hint">{territoryStatus}</div> : null}
          </form>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Créer une journée de vente</h3>
          <form className="form-grid" onSubmit={submitSalesDay}>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="salesDayDate">Date</label>
                <input
                  id="salesDayDate"
                  className="input"
                  type="date"
                  min={today}
                  max={maxSalesDayDate}
                  value={salesDayForm.date}
                  onChange={(event) => setSalesDayForm({ ...salesDayForm, date: event.target.value })}
                  required
                />
                <div className="table-actions" style={{ marginTop: 6 }}>
                  {quickDates.map((option) => (
                    <button
                      key={option.label}
                      className="tag"
                      type="button"
                      onClick={() => setSalesDayForm({ ...salesDayForm, date: option.value })}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="salesDayStart">Heure de début</label>
                <input
                  id="salesDayStart"
                  className="input"
                  type="time"
                  value={salesDayForm.startTime}
                  onChange={(event) => setSalesDayForm({ ...salesDayForm, startTime: event.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="salesDayEnd">Heure de fin</label>
                <input
                  id="salesDayEnd"
                  className="input"
                  type="time"
                  value={salesDayForm.endTime}
                  onChange={(event) => setSalesDayForm({ ...salesDayForm, endTime: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="salesDayMeeting">Adresse de départ</label>
                <input
                  id="salesDayMeeting"
                  className="input"
                  value={salesDayForm.meetingAddress}
                  onChange={(event) => setSalesDayForm({ ...salesDayForm, meetingAddress: event.target.value })}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="salesDayCity">Ville</label>
                <input
                  id="salesDayCity"
                  className="input"
                  value={salesDayForm.meetingCity}
                  onChange={(event) => setSalesDayForm({ ...salesDayForm, meetingCity: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="salesDayPostal">Code postal</label>
                <input
                  id="salesDayPostal"
                  className="input"
                  value={salesDayForm.meetingPostalCode}
                  onChange={(event) => setSalesDayForm({ ...salesDayForm, meetingPostalCode: event.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="salesDayNotes">Consignes</label>
              <textarea
                id="salesDayNotes"
                className="textarea"
                value={salesDayForm.notes}
                onChange={(event) => setSalesDayForm({ ...salesDayForm, notes: event.target.value })}
              />
            </div>
            <div className="card-meta">
              Planification max 7 jours à l'avance.
            </div>
            <button className="button-primary" type="submit">Créer la journée</button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Assignations des vendeurs</h3>
          {salesDays.length === 0 ? (
            <div className="card-meta" style={{ marginTop: 12 }}>
              Aucune journée planifiée.
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-row">
                <label className="label" htmlFor="salesDaySelect">Journee</label>
                <select
                  id="salesDaySelect"
                  className="select"
                  value={selectedSalesDayId}
                  onChange={(event) => setSelectedSalesDayId(event.target.value)}
                >
                  {salesDays.map((day) => (
                    <option key={day.sales_day_id} value={day.sales_day_id}>
                      {formatSalesDayDate(day.sales_day_date)} {formatTimeShort(day.start_time)}-{formatTimeShort(day.end_time)}
                    </option>
                  ))}
                </select>
              </div>
              {selectedSalesDay ? (
                <div className="card-meta">
                  {selectedSalesDayLabel} • {selectedSalesDayMeeting}
                </div>
              ) : null}

              <div>
                <div className="card-label">Disponibilités</div>
                {salesDayAvailability.length === 0 ? (
                  <div className="card-meta" style={{ marginTop: 8 }}>
                    Aucune disponibilité chargée.
                  </div>
                ) : (
                  <div className="list" style={{ marginTop: 8 }}>
                    {salesDayAvailability.map((rep) => (
                      <div className="list-item" key={rep.user_id}>
                        <div>
                          <strong>{rep.full_name || rep.email}</strong>
                          <div className="card-meta">{rep.email}</div>
                        </div>
                        <span
                          className="pill"
                          style={{
                            backgroundColor: rep.available ? "#dcfce7" : "#fee2e2",
                            color: rep.available ? "#166534" : "#991b1b",
                          }}
                        >
                          {rep.available ? "Disponible" : "Indisponible"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="button-secondary"
                  type="button"
                  onClick={autoAssignSalesDay}
                  style={{ marginTop: 8 }}
                >
                  Assigner tous les disponibles
                </button>
              </div>

              <form className="form-grid" onSubmit={submitSalesDayAssign}>
                <div className="form-row">
                  <label className="label" htmlFor="assignRep">Représentant</label>
                  <select
                    id="assignRep"
                    className="select"
                    value={salesDayAssignForm.salesRepId}
                    onChange={(event) =>
                      setSalesDayAssignForm({ ...salesDayAssignForm, salesRepId: event.target.value })
                    }
                    required
                  >
                    <option value="">Choisir un représentant</option>
                    {salesReps.map((rep) => (
                      <option key={rep.user_id} value={rep.user_id}>
                        {rep.full_name || rep.email}
                      </option>
                    ))}
                  </select>
                  {selectedRepAvailability === false ? (
                    <div className="card-meta" style={{ marginTop: 6 }}>
                      Ce vendeur est indiqué comme indisponible pour ce créneau.
                    </div>
                  ) : null}
                </div>
                <div className="grid-2">
                  <div className="form-row">
                    <label className="label" htmlFor="overrideTime">Heure de départ (optionnel)</label>
                    <input
                      id="overrideTime"
                      className="input"
                      type="time"
                      value={salesDayAssignForm.overrideStartTime}
                      onChange={(event) =>
                        setSalesDayAssignForm({ ...salesDayAssignForm, overrideStartTime: event.target.value })
                      }
                    />
                  </div>
                  <div className="form-row">
                    <label className="label" htmlFor="overrideAddress">Adresse de départ (optionnel)</label>
                    <input
                      id="overrideAddress"
                      className="input"
                      value={salesDayAssignForm.overrideMeetingAddress}
                      onChange={(event) =>
                        setSalesDayAssignForm({ ...salesDayAssignForm, overrideMeetingAddress: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-row">
                    <label className="label" htmlFor="overrideCity">Ville (optionnel)</label>
                    <input
                      id="overrideCity"
                      className="input"
                      value={salesDayAssignForm.overrideMeetingCity}
                      onChange={(event) =>
                        setSalesDayAssignForm({ ...salesDayAssignForm, overrideMeetingCity: event.target.value })
                      }
                    />
                  </div>
                  <div className="form-row">
                    <label className="label" htmlFor="overridePostal">Code postal (optionnel)</label>
                    <input
                      id="overridePostal"
                      className="input"
                      value={salesDayAssignForm.overrideMeetingPostalCode}
                      onChange={(event) =>
                        setSalesDayAssignForm({ ...salesDayAssignForm, overrideMeetingPostalCode: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="assignNotes">Notes (optionnel)</label>
                  <textarea
                    id="assignNotes"
                    className="textarea"
                    value={salesDayAssignForm.notes}
                    onChange={(event) =>
                      setSalesDayAssignForm({ ...salesDayAssignForm, notes: event.target.value })
                    }
                  />
                </div>
                <button
                  className="button-primary"
                  type="submit"
                  disabled={selectedRepAvailability !== true}
                >
                  Assigner le vendeur
                </button>
              </form>

              <div>
                <div className="card-label">Vendeurs assignes</div>
                {salesDayAssignments.length === 0 ? (
                  <div className="card-meta" style={{ marginTop: 8 }}>
                    Aucune assignation pour cette journée.
                  </div>
                ) : (
                  <div className="list" style={{ marginTop: 8 }}>
                    {salesDayAssignments.map((assignment) => {
                      const rep = assignment.sales_rep;
                      const label = rep?.full_name || rep?.email || assignment.sales_rep_id || "Vendeur";
                      const availability = assignment.sales_rep_id
                        ? availabilityById.get(assignment.sales_rep_id)
                        : undefined;
                      return (
                        <div className="list-item list-item-stack" key={assignment.assignment_id}>
                          <div style={{ width: "100%" }}>
                            <strong>{label}</strong>
                            <div className="card-meta">
                              {assignment.override_start_time
                                ? `Départ: ${formatTimeShort(assignment.override_start_time)}`
                                : "Départ par défaut"}
                            </div>
                          </div>
                          {availability !== undefined ? (
                            <span
                              className="pill"
                              style={{
                                backgroundColor: availability ? "#dcfce7" : "#fee2e2",
                                color: availability ? "#166534" : "#991b1b",
                              }}
                            >
                              {availability ? "Disponible" : "Indisponible"}
                            </span>
                          ) : null}
                          <button
                            className="button-ghost"
                            type="button"
                            onClick={() => {
                              setSalesDayZoneType("sub");
                              setSelectedAssignmentId(assignment.assignment_id);
                            }}
                          >
                            Modifier zone
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="card-label">Zones de vente</div>
                <div className="table-actions" style={{ marginTop: 8 }}>
                  <button
                    className={salesDayZoneType === "master" ? "button-primary" : "button-secondary"}
                    type="button"
                    onClick={() => setSalesDayZoneType("master")}
                  >
                    Zone équipe
                  </button>
                  <button
                    className={salesDayZoneType === "sub" ? "button-primary" : "button-secondary"}
                    type="button"
                    onClick={() => setSalesDayZoneType("sub")}
                  >
                    Zone vendeur
                  </button>
                </div>
                {salesDayZoneType === "sub" ? (
                  <div className="form-row" style={{ marginTop: 12 }}>
                    <label className="label" htmlFor="zoneAssignment">Vendeur</label>
                    <select
                      id="zoneAssignment"
                      className="select"
                      value={selectedAssignmentId}
                      onChange={(event) => setSelectedAssignmentId(event.target.value)}
                    >
                      <option value="">Choisir un vendeur</option>
                      {salesDayAssignments.map((assignment) => {
                        const rep = assignment.sales_rep;
                        const label = rep?.full_name || rep?.email || assignment.sales_rep_id || "Vendeur";
                        return (
                          <option key={assignment.assignment_id} value={assignment.assignment_id}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : null}
                <div className="map-shell" style={{ marginTop: 12 }}>
                  <div className="map-canvas" ref={salesDayMapRef} />
                  {salesDayMapMessage ? <div className="map-overlay">{salesDayMapMessage}</div> : null}
                </div>
                <div className="table-actions" style={{ marginTop: 12 }}>
                  <button className="button-primary" type="button" onClick={saveSalesDayZone}>
                    Enregistrer la zone
                  </button>
                  <button
                    className="button-ghost"
                    type="button"
                    onClick={() => setSalesDayPolygonPoints([])}
                  >
                    Effacer le polygone
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {salesDayStatus ? <div className="hint" style={{ marginTop: 12 }}>{salesDayStatus}</div> : null}

      <div className="card">
        <h3 className="card-title">Pipeline des prospects</h3>
        <table className="table table-desktop">
          <thead>
            <tr>
              <th>Prospect</th>
              <th>Statut</th>
              <th>Valeur</th>
              <th>Ville</th>
              <th>Relance</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.lead_id}>
                <td>{lead.first_name} {lead.last_name}</td>
                <td>{lead.status}</td>
                <td>{lead.estimated_job_value ? `$${lead.estimated_job_value}` : ""}</td>
                <td>{lead.city ?? ""}</td>
                <td>{lead.follow_up_date ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="card-list-mobile" style={{ marginTop: 12 }}>
          {leads.map((lead) => (
            <div className="mobile-card" key={lead.lead_id}>
              <div className="mobile-card-title">{lead.first_name} {lead.last_name}</div>
              <div className="mobile-card-meta">Statut : {lead.status}</div>
              <div className="mobile-card-meta">
                Valeur : {lead.estimated_job_value ? `$${lead.estimated_job_value}` : ""}
              </div>
              <div className="mobile-card-meta">Ville : {lead.city ?? ""}</div>
              <div className="mobile-card-meta">Relance : {lead.follow_up_date ?? ""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
