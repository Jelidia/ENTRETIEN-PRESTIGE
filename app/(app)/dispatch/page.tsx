"use client";

import clsx from "clsx";
import TopBar from "@/components/TopBar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DispatchJob = {
  id: string;
  time: string;
  address: string;
  service: string;
  price: string;
  status: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
};

type DispatchColumnType = {
  technician: string;
  technicianId?: string;
  jobs: DispatchJob[];
};

type ConflictRow = {
  job_id: string;
  technician_id: string;
  scheduled_date: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
};

type GpsRow = {
  location_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  technician_id?: string | null;
};

type MapCenter = { lat: number; lng: number };

type GoogleMapInstance = {
  setCenter: (center: MapCenter) => void;
};

type GoogleMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
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
    Marker: new (options: {
      position: MapCenter;
      map: GoogleMapInstance | null;
      label?: string;
      title?: string;
    }) => GoogleMarkerInstance;
  };
};

type GpsMarker = {
  id: string;
  technicianId: string;
  name: string;
  lastSeen: string;
  lastSeenLabel: string;
  position: MapCenter;
};

type DragState = {
  jobId: string;
  techKey: string;
  duration: number;
  offsetY: number;
};

type ResizeState = {
  jobId: string;
  techKey: string;
  startMinutes: number;
};

type CreateState = {
  techKey: string;
  technicianId?: string;
  startMinutes: number;
};

type DragPreview = {
  jobId: string;
  techKey: string;
  technicianId?: string;
  startMinutes: number;
  endMinutes: number;
};

const START_HOUR = 7;
const END_HOUR = 19;
const HOUR_HEIGHT = 72;
const SNAP_MINUTES = 15;

export default function DispatchPage() {
  const [board, setBoard] = useState<DispatchColumnType[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [status, setStatus] = useState("");
  const [reassignForm, setReassignForm] = useState({ jobId: "", technicianId: "" });
  const [weatherForm, setWeatherForm] = useState({ startDate: "", endDate: "" });
  const [gpsForm, setGpsForm] = useState({ technicianId: "", start: "", end: "" });
  const [gpsResults, setGpsResults] = useState<GpsRow[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [createState, setCreateState] = useState<CreateState | null>(null);
  const [createPreview, setCreatePreview] = useState<DragPreview | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateStatus, setQuickCreateStatus] = useState("");
  const [quickCreateAssign, setQuickCreateAssign] = useState(true);
  const [quickCreateTechnician, setQuickCreateTechnician] = useState({ id: "", name: "" });
  const [isCompact, setIsCompact] = useState(false);
  const [activeTechKey, setActiveTechKey] = useState("");
  const [quickCreateForm, setQuickCreateForm] = useState({
    customerId: "",
    serviceType: "window_cleaning",
    servicePackage: "premium",
    scheduledDate: "",
    scheduledStartTime: "",
    scheduledEndTime: "",
    address: "",
    city: "",
    postalCode: "",
    estimatedRevenue: "",
    description: "",
  });

  const boardRef = useRef<DispatchColumnType[]>([]);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragPreviewRef = useRef<DragPreview | null>(null);
  const createPreviewRef = useRef<DragPreview | null>(null);
  const rafRef = useRef<number | null>(null);
  const createRafRef = useRef<number | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMapInstance | null>(null);
  const gpsMarkersRef = useRef<GoogleMarkerInstance[]>([]);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const techNameById = useMemo(() => {
    const map = new Map<string, string>();
    board.forEach((column) => {
      if (column.technicianId) {
        map.set(column.technicianId, column.technician);
      }
    });
    return map;
  }, [board]);

  const gpsMarkers = useMemo<GpsMarker[]>(() => {
    const latestByTech = new Map<string, GpsRow>();
    gpsResults.forEach((point) => {
      const key = point.technician_id ?? point.location_id;
      const existing = latestByTech.get(key);
      if (!existing) {
        latestByTech.set(key, point);
        return;
      }
      const existingTime = new Date(existing.timestamp).getTime();
      const currentTime = new Date(point.timestamp).getTime();
      if (currentTime > existingTime) {
        latestByTech.set(key, point);
      }
    });

    return Array.from(latestByTech.entries()).map(([key, point]) => {
      const technicianId = point.technician_id ?? key;
      const name = techNameById.get(technicianId) ?? `Technicien ${technicianId.slice(0, 6)}`;
      const lastSeenDate = new Date(point.timestamp);
      return {
        id: key,
        technicianId,
        name,
        lastSeen: point.timestamp,
        lastSeenLabel: lastSeenDate.toLocaleString("fr-CA"),
        position: { lat: point.latitude, lng: point.longitude },
      };
    });
  }, [gpsResults, techNameById]);

  const mapMessage = useMemo(() => {
    if (!mapsKey) return "Carte désactivée. Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.";
    if (!mapReady) return "Chargement de la carte...";
    if (!gpsMarkers.length) return "Aucun GPS pour le moment. Lancez une recherche.";
    return "";
  }, [gpsMarkers.length, mapReady, mapsKey]);

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
    setMapReady(true);
  }, [getGoogle]);

  const renderGpsMarkers = useCallback(() => {
    const google = getGoogle();
    const maps = google?.maps;
    if (!maps || !mapInstance.current) {
      return;
    }
    gpsMarkersRef.current.forEach((marker) => marker.setMap(null));
    gpsMarkersRef.current = [];
    if (!gpsMarkers.length) {
      return;
    }
    gpsMarkers.forEach((marker) => {
      const created = new maps.Marker({
        position: marker.position,
        map: mapInstance.current,
        label: marker.name,
        title: `${marker.name} • ${marker.lastSeenLabel}`,
      });
      gpsMarkersRef.current.push(created);
    });
    mapInstance.current.setCenter(gpsMarkers[0].position);
  }, [getGoogle, gpsMarkers]);

  const loadDispatch = useCallback(async () => {
    const [boardRes, conflictsRes] = await Promise.all([
      fetch("/api/dispatch/calendar"),
      fetch("/api/dispatch/conflicts"),
    ]);
    const boardJson = await boardRes.json().catch(() => ({ data: [] }));
    const conflictsJson = await conflictsRes.json().catch(() => ({ data: [] }));
    setBoard(boardJson.data ?? []);
    setConflicts(conflictsJson.data ?? []);
  }, []);

  const openQuickCreate = useCallback(
    (preview: DragPreview) => {
      const date = selectedDate || new Date().toISOString().slice(0, 10);
      const technician = boardRef.current.find((item) => getTechKey(item) === preview.techKey);
      setQuickCreateTechnician({
        id: preview.technicianId ?? "",
        name: technician?.technician ?? "",
      });
      setQuickCreateAssign(Boolean(preview.technicianId));
      setQuickCreateForm((prev) => ({
        ...prev,
        scheduledDate: date,
        scheduledStartTime: formatTime(preview.startMinutes),
        scheduledEndTime: formatTime(preview.endMinutes),
      }));
      setQuickCreateStatus("");
      setQuickCreateOpen(true);
    },
    [selectedDate]
  );

  const commitSchedule = useCallback(
    async (preview: DragPreview) => {
      if (!selectedDate) {
        setStatus("Sélectionnez une date avant de replanifier.");
        return;
      }

      const previous = boardRef.current;
      const next = moveJob(previous, preview, selectedDate);
      setBoard(next);

      if (!preview.technicianId) {
        setStatus("Prévisualisation mise à jour (non enregistrée). ID technicien manquant.");
        return;
      }

      const response = await fetch("/api/dispatch/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: preview.jobId,
          technicianId: preview.technicianId,
          scheduledDate: selectedDate,
          scheduledStartTime: formatTime(preview.startMinutes),
          scheduledEndTime: formatTime(preview.endMinutes),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setBoard(previous);
        setStatus(json.error ?? "Impossible de mettre à jour l'horaire");
        return;
      }

      setStatus("Horaire mis à jour.");
      void loadDispatch();
    },
    [selectedDate, loadDispatch]
  );

  useEffect(() => {
    void loadDispatch();
  }, [loadDispatch]);

  useEffect(() => {
    if (!mapsKey || !mapRef.current) {
      return;
    }
    void loadGoogleMaps(mapsKey)
      .then(() => initMap())
      .catch(() => setStatus("Impossible de charger la carte"));
  }, [initMap, loadGoogleMaps, mapsKey]);

  useEffect(() => {
    if (!mapReady) return;
    renderGpsMarkers();
  }, [mapReady, renderGpsMarkers]);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    if (selectedDate) return;
    const today = new Date().toISOString().slice(0, 10);
    const dates = board
      .flatMap((column) => column.jobs.map((job) => job.scheduledDate).filter(Boolean))
      .filter((value): value is string => Boolean(value));
    if (dates.includes(today)) {
      setSelectedDate(today);
      return;
    }
    setSelectedDate(dates[0] ?? today);
  }, [board, selectedDate]);

  useEffect(() => {
    const activeDrag = dragState;
    if (!activeDrag) return;

    function handleMove(event: PointerEvent) {
      const currentDrag = activeDrag;
      if (!currentDrag) return;
      const activeKey = resolveTechKey(event.clientX, columnRefs.current) ?? currentDrag.techKey;
      const column = columnRefs.current[activeKey];
      if (!column) return;

      const rect = column.getBoundingClientRect();
      const gridStartMinutes = START_HOUR * 60;
      const gridEndMinutes = END_HOUR * 60;
      const minuteHeight = HOUR_HEIGHT / 60;
      const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
      const durationPx = currentDrag.duration * minuteHeight;
      const maxTop = Math.max(0, gridHeight - durationPx);
      const rawTop = event.clientY - rect.top - currentDrag.offsetY;
      const clampedTop = clamp(rawTop, 0, maxTop);
      const snapPixels = SNAP_MINUTES * minuteHeight;
      const snappedTop = Math.round(clampedTop / snapPixels) * snapPixels;
      const startMinutes = gridStartMinutes + snappedTop / minuteHeight;
      const clampedStart = clamp(startMinutes, gridStartMinutes, gridEndMinutes - currentDrag.duration);
      const endMinutes = clampedStart + currentDrag.duration;

      const columnMeta = boardRef.current.find((item) => getTechKey(item) === activeKey);

      queuePreview({
        jobId: currentDrag.jobId,
        techKey: activeKey,
        technicianId: columnMeta?.technicianId,
        startMinutes: clampedStart,
        endMinutes,
      });
      maybeAutoScroll(event.clientY);
    }

    async function handleUp() {
      if (dragPreviewRef.current) {
        await commitSchedule(dragPreviewRef.current);
      }
      cleanupInteraction();
    }

    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.body.style.cursor = "";
    };
  }, [dragState, commitSchedule]);

  useEffect(() => {
    const activeResize = resizeState;
    if (!activeResize) return;

    function handleMove(event: PointerEvent) {
      const currentResize = activeResize;
      if (!currentResize) return;
      const column = columnRefs.current[currentResize.techKey];
      if (!column) return;

      const rect = column.getBoundingClientRect();
      const gridStartMinutes = START_HOUR * 60;
      const gridEndMinutes = END_HOUR * 60;
      const minuteHeight = HOUR_HEIGHT / 60;
      const rawMinutes = gridStartMinutes + (event.clientY - rect.top) / minuteHeight;
      const snappedEnd = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
      const minEnd = currentResize.startMinutes + SNAP_MINUTES;
      const endMinutes = clamp(snappedEnd, minEnd, gridEndMinutes);

      const columnMeta = boardRef.current.find((item) => getTechKey(item) === currentResize.techKey);

      queuePreview({
        jobId: currentResize.jobId,
        techKey: currentResize.techKey,
        technicianId: columnMeta?.technicianId,
        startMinutes: currentResize.startMinutes,
        endMinutes,
      });
      maybeAutoScroll(event.clientY);
    }

    async function handleUp() {
      if (dragPreviewRef.current) {
        await commitSchedule(dragPreviewRef.current);
      }
      cleanupInteraction();
    }

    document.body.style.cursor = "ns-resize";
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.body.style.cursor = "";
    };
  }, [resizeState, commitSchedule]);

  useEffect(() => {
    const currentCreate = createState;
    if (!currentCreate) return;

    function handleMove(event: PointerEvent) {
      const activeCreate = currentCreate;
      if (!activeCreate) return;
      const column = columnRefs.current[activeCreate.techKey];
      if (!column) return;

      const rect = column.getBoundingClientRect();
      const gridStartMinutes = START_HOUR * 60;
      const gridEndMinutes = END_HOUR * 60;
      const minuteHeight = HOUR_HEIGHT / 60;
      const rawMinutes = gridStartMinutes + (event.clientY - rect.top) / minuteHeight;
      const snappedMinutes = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
      const clampedMinutes = clamp(snappedMinutes, gridStartMinutes, gridEndMinutes - SNAP_MINUTES);
      const startMinutes = Math.min(activeCreate.startMinutes, clampedMinutes);
      const endMinutes = Math.max(activeCreate.startMinutes + SNAP_MINUTES, clampedMinutes + SNAP_MINUTES);

      queueCreatePreview({
        jobId: "new",
        techKey: activeCreate.techKey,
        technicianId: activeCreate.technicianId,
        startMinutes: clamp(startMinutes, gridStartMinutes, gridEndMinutes - SNAP_MINUTES),
        endMinutes: clamp(endMinutes, gridStartMinutes + SNAP_MINUTES, gridEndMinutes),
      });
      maybeAutoScroll(event.clientY);
    }

    function handleUp() {
      if (createPreviewRef.current) {
        openQuickCreate(createPreviewRef.current);
      }
      cleanupCreate();
    }

    document.body.style.cursor = "crosshair";
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.body.style.cursor = "";
    };
  }, [createState, openQuickCreate]);

  function cleanupInteraction() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setDragState(null);
    setResizeState(null);
    setDragPreview(null);
    dragPreviewRef.current = null;
    document.body.style.cursor = "";
  }

  function cleanupCreate() {
    if (createRafRef.current) {
      cancelAnimationFrame(createRafRef.current);
    }
    setCreateState(null);
    setCreatePreview(null);
    createPreviewRef.current = null;
    document.body.style.cursor = "";
  }

  function queuePreview(preview: DragPreview) {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = window.requestAnimationFrame(() => {
      dragPreviewRef.current = preview;
      setDragPreview(preview);
    });
  }

  function queueCreatePreview(preview: DragPreview) {
    if (createRafRef.current) {
      cancelAnimationFrame(createRafRef.current);
    }
    createRafRef.current = window.requestAnimationFrame(() => {
      createPreviewRef.current = preview;
      setCreatePreview(preview);
    });
  }

  async function autoAssign() {
    setStatus("");
    const response = await fetch("/api/dispatch/auto-assign", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Impossible d'effectuer l'affectation auto");
      return;
    }
    setStatus(`Affectation auto : ${json.assigned ?? 0} travaux.`);
    void loadDispatch();
  }

  async function submitReassign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/dispatch/reassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reassignForm),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Impossible de réaffecter le travail");
      return;
    }
    setStatus("Travail réaffecté.");
    setReassignForm({ jobId: "", technicianId: "" });
    void loadDispatch();
  }

  async function submitWeather(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/dispatch/weather-cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weatherForm),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Impossible d'annuler les travaux");
      return;
    }
    setStatus("Annulations météo appliquées.");
    setWeatherForm({ startDate: "", endDate: "" });
    void loadDispatch();
  }

  async function submitGps(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    let url = "/api/gps/history";
    if (gpsForm.technicianId) {
      url = `/api/gps/technician/${gpsForm.technicianId}`;
    }
    if (gpsForm.start || gpsForm.end) {
      const params = new URLSearchParams();
      if (gpsForm.start) params.set("start", gpsForm.start);
      if (gpsForm.end) params.set("end", gpsForm.end);
      url = `/api/gps/history?${params.toString()}`;
    }

    const response = await fetch(url);
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setStatus(json.error ?? "Impossible de charger le GPS");
      return;
    }
    setGpsResults(json.data ?? []);
  }

  function handleCreatePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    column: DispatchColumnType
  ) {
    if (event.pointerType === "touch") return;
    if (event.target !== event.currentTarget) return;
    if (dragState || resizeState || quickCreateOpen) return;
    if (event.button !== 0) return;

    const techKey = getTechKey(column);
    const columnEl = columnRefs.current[techKey];
    if (!columnEl) return;

    const rect = columnEl.getBoundingClientRect();
    const gridStartMinutes = START_HOUR * 60;
    const gridEndMinutes = END_HOUR * 60;
    const minuteHeight = HOUR_HEIGHT / 60;
    const rawMinutes = gridStartMinutes + (event.clientY - rect.top) / minuteHeight;
    const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    const startMinutes = clamp(snapped, gridStartMinutes, gridEndMinutes - SNAP_MINUTES);
    const endMinutes = clamp(startMinutes + 60, gridStartMinutes + SNAP_MINUTES, gridEndMinutes);

    setCreateState({ techKey, technicianId: column.technicianId, startMinutes });
    queueCreatePreview({
      jobId: "new",
      techKey,
      technicianId: column.technicianId,
      startMinutes,
      endMinutes,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleColumnDoubleClick(
    event: React.MouseEvent<HTMLDivElement>,
    column: DispatchColumnType
  ) {
    if (event.target !== event.currentTarget) return;
    if (quickCreateOpen) return;
    const columnEl = columnRefs.current[getTechKey(column)];
    if (!columnEl) return;
    const rect = columnEl.getBoundingClientRect();
    const gridStartMinutes = START_HOUR * 60;
    const minuteHeight = HOUR_HEIGHT / 60;
    const rawMinutes = gridStartMinutes + (event.clientY - rect.top) / minuteHeight;
    const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    const startMinutes = clamp(snapped, gridStartMinutes, END_HOUR * 60 - SNAP_MINUTES);
    const endMinutes = clamp(startMinutes + 60, gridStartMinutes + SNAP_MINUTES, END_HOUR * 60);
    openQuickCreate({
      jobId: "new",
      techKey: getTechKey(column),
      technicianId: column.technicianId,
      startMinutes,
      endMinutes,
    });
  }

  async function submitQuickCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuickCreateStatus("");

    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quickCreateForm),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setQuickCreateStatus(json.error ?? "Impossible de créer le travail");
      return;
    }

    const jobId = json?.data?.job_id as string | undefined;
    if (quickCreateAssign && quickCreateTechnician.id && jobId) {
      await fetch("/api/dispatch/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, technicianId: quickCreateTechnician.id }),
      });
    }

    setQuickCreateStatus("Travail créé.");
    setQuickCreateOpen(false);
    setQuickCreateForm((prev) => ({
      ...prev,
      customerId: "",
      address: "",
      city: "",
      postalCode: "",
      estimatedRevenue: "",
      description: "",
    }));
    void loadDispatch();
  }

  function handleJobPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    job: DispatchJob,
    column: DispatchColumnType
  ) {
    if (event.pointerType === "touch") return;
    if (event.button !== 0 || resizeState) return;
    const techKey = getTechKey(column);
    const columnEl = columnRefs.current[techKey];
    if (!columnEl) return;

    const gridStartMinutes = START_HOUR * 60;
    const { start, end, duration } = getJobTimes(job);
    const minuteHeight = HOUR_HEIGHT / 60;
    const top = (start - gridStartMinutes) * minuteHeight;
    const offsetY = event.clientY - columnEl.getBoundingClientRect().top - top;

    setDragState({
      jobId: job.id,
      techKey,
      duration,
      offsetY,
    });

    queuePreview({
      jobId: job.id,
      techKey,
      technicianId: column.technicianId,
      startMinutes: start,
      endMinutes: end,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    job: DispatchJob,
    column: DispatchColumnType
  ) {
    if (event.pointerType === "touch") return;
    event.stopPropagation();
    if (event.button !== 0 || dragState) return;
    const { start, end } = getJobTimes(job);
    setResizeState({
      jobId: job.id,
      techKey: getTechKey(column),
      startMinutes: start,
    });
    queuePreview({
      jobId: job.id,
      techKey: getTechKey(column),
      technicianId: column.technicianId,
      startMinutes: start,
      endMinutes: end,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function shiftDate(delta: number) {
    setSelectedDate((prev) => {
      const base = prev ? new Date(`${prev}T00:00:00`) : new Date();
      base.setDate(base.getDate() + delta);
      return base.toISOString().slice(0, 10);
    });
  }

  const columns = useMemo(() => {
    if (!selectedDate) return board;
    return board.map((column) => ({
      ...column,
      jobs: column.jobs.filter((job) => {
        const date = job.scheduledDate ?? selectedDate;
        return !date || date === selectedDate;
      }),
    }));
  }, [board, selectedDate]);

  useEffect(() => {
    if (!isCompact) return;
    const keys = columns.map(getTechKey);
    if (keys.length === 0) {
      setActiveTechKey("");
      return;
    }
    if (!keys.includes(activeTechKey)) {
      setActiveTechKey(keys[0]);
    }
  }, [columns, isCompact, activeTechKey]);

  const visibleColumns = useMemo(() => {
    if (!isCompact) return columns;
    if (!activeTechKey) return columns.slice(0, 1);
    return columns.filter((column) => getTechKey(column) === activeTechKey);
  }, [columns, isCompact, activeTechKey]);

  const hourLabels = useMemo(() => {
    const hours: string[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
      hours.push(`${String(hour).padStart(2, "0")}:00`);
    }
    return hours;
  }, []);

  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
  const gridTemplate = `80px repeat(${Math.max(visibleColumns.length, 1)}, minmax(180px, 1fr))`;
  const dateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("fr-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Répartition";

  return (
    <div className="page">
      <TopBar
        title="Répartition"
        subtitle="Vue semaine, réassignations et conflits"
        actions={
          <>
            <button className="button-secondary" type="button" onClick={autoAssign}>
              Affectation auto
            </button>
            <button
              className="button-primary"
              type="button"
              onClick={() =>
                openQuickCreate({
                  jobId: "new",
                  techKey: board[0] ? getTechKey(board[0]) : "unassigned",
                  technicianId: board[0]?.technicianId,
                  startMinutes: START_HOUR * 60 + 120,
                  endMinutes: START_HOUR * 60 + 180,
                })
              }
            >
              Nouveau travail
            </button>
          </>
        }
      />

      <section className="dispatch-calendar">
        <div className="dispatch-toolbar">
          <div>
            <div className="card-label">Horaire</div>
            <div className="dispatch-date">{dateLabel}</div>
          </div>
          {isCompact && (
            <div className="dispatch-tech-select">
              <label className="label" htmlFor="dispatchTech">Technicien</label>
              <select
                id="dispatchTech"
                className="select"
                value={activeTechKey}
                onChange={(event) => setActiveTechKey(event.target.value)}
              >
                {columns.map((column) => {
                  const techKey = getTechKey(column);
                  const techLabel = column.technician || "Non assigné";
                  return (
                    <option key={techKey} value={techKey}>
                      {techLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          <div className="dispatch-controls">
            <button className="button-ghost" type="button" onClick={() => shiftDate(-1)}>
              Préc.
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            >
              Aujourd'hui
            </button>
            <button className="button-ghost" type="button" onClick={() => shiftDate(1)}>
              Suiv.
            </button>
          </div>
        </div>

        <div className="calendar-shell">
          <div className="calendar-header" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="calendar-time-header">Heure</div>
            {visibleColumns.map((column) => (
              <div key={getTechKey(column)} className="calendar-tech-header">
                <span>{column.technician}</span>
                <span className="calendar-tech-meta">{column.jobs.length} travaux</span>
              </div>
            ))}
          </div>
          <div className="calendar-body" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="calendar-hours" style={{ height: gridHeight }}>
              {hourLabels.map((label) => (
                <div key={label} className="calendar-hour" style={{ height: HOUR_HEIGHT }}>
                  {label}
                </div>
              ))}
            </div>
            {visibleColumns.map((column) => {
              const techKey = getTechKey(column);
              return (
                <div
                  key={techKey}
                  ref={(node) => {
                    columnRefs.current[techKey] = node;
                  }}
                  className={clsx(
                    "calendar-column",
                    dragPreview?.techKey === techKey && "calendar-column-active"
                  )}
                  style={{ height: gridHeight }}
                  onPointerDown={(event) => handleCreatePointerDown(event, column)}
                  onDoubleClick={(event) => handleColumnDoubleClick(event, column)}
                >
                  {column.jobs.map((job) => {
                    const { start, end, duration } = getJobTimes(job);
                    const minuteHeight = HOUR_HEIGHT / 60;
                    const top = (start - START_HOUR * 60) * minuteHeight;
                    const height = Math.max(40, duration * minuteHeight);
                    const tone = getStatusTone(job.status);
                    return (
                      <div
                        key={job.id}
                        className={clsx(
                          "calendar-event",
                          `tone-${tone}`,
                          dragState?.jobId === job.id && "calendar-event-dragging"
                        )}
                        style={{ top, height }}
                        onPointerDown={(event) => handleJobPointerDown(event, job, column)}
                      >
                        <div className="calendar-event-time">
                          {formatTime(start)} - {formatTime(end)}
                        </div>
                        <div className="calendar-event-title">{job.service}</div>
                        <div className="calendar-event-meta">{job.address}</div>
                        <div
                          className="calendar-event-handle"
                          role="presentation"
                          onPointerDown={(event) => handleResizePointerDown(event, job, column)}
                        />
                      </div>
                    );
                  })}
                  {dragPreview?.techKey === techKey ? (
                    <div
                      className="calendar-event calendar-event-ghost"
                      style={{
                        top: (dragPreview.startMinutes - START_HOUR * 60) * (HOUR_HEIGHT / 60),
                        height: Math.max(40, (dragPreview.endMinutes - dragPreview.startMinutes) * (HOUR_HEIGHT / 60)),
                      }}
                    >
                      <div className="calendar-event-time">
                        {formatTime(dragPreview.startMinutes)} - {formatTime(dragPreview.endMinutes)}
                      </div>
                      <div className="calendar-event-title">Replanification</div>
                      <div className="calendar-event-meta">Déposer pour confirmer</div>
                    </div>
                  ) : null}
                  {createPreview?.techKey === techKey ? (
                    <div
                      className="calendar-event calendar-event-create"
                      style={{
                        top: (createPreview.startMinutes - START_HOUR * 60) * (HOUR_HEIGHT / 60),
                        height: Math.max(40, (createPreview.endMinutes - createPreview.startMinutes) * (HOUR_HEIGHT / 60)),
                      }}
                    >
                      <div className="calendar-event-time">
                        {formatTime(createPreview.startMinutes)} - {formatTime(createPreview.endMinutes)}
                      </div>
                      <div className="calendar-event-title">Nouveau travail</div>
                      <div className="calendar-event-meta">Glisser pour ajuster</div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {quickCreateOpen ? (
        <div className="quick-create-backdrop" onClick={() => setQuickCreateOpen(false)}>
          <div className="quick-create-panel" onClick={(event) => event.stopPropagation()}>
            <div className="quick-create-header">
              <div>
                <div className="card-label">Création rapide</div>
                <div className="quick-create-title">Nouveau créneau</div>
                <div className="card-meta">
                  {quickCreateForm.scheduledDate} · {quickCreateForm.scheduledStartTime} - {quickCreateForm.scheduledEndTime}
                </div>
                {quickCreateTechnician.name ? (
                  <div className="card-meta">Technicien: {quickCreateTechnician.name}</div>
                ) : null}
              </div>
              <button className="button-ghost" type="button" onClick={() => setQuickCreateOpen(false)}>
                Fermer
              </button>
            </div>
            <form className="form-grid" onSubmit={submitQuickCreate}>
              <div className="form-row">
                <label className="label" htmlFor="qcCustomer">ID client</label>
                <input
                  id="qcCustomer"
                  className="input"
                  value={quickCreateForm.customerId}
                  onChange={(event) =>
                    setQuickCreateForm((prev) => ({ ...prev, customerId: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid-2">
                <div className="form-row">
                  <label className="label" htmlFor="qcService">Service</label>
                  <select
                    id="qcService"
                    className="select"
                    value={quickCreateForm.serviceType}
                    onChange={(event) =>
                      setQuickCreateForm((prev) => ({ ...prev, serviceType: event.target.value }))
                    }
                  >
                    <option value="window_cleaning">Nettoyage de vitres</option>
                    <option value="gutter_cleaning">Nettoyage de gouttières</option>
                    <option value="pressure_wash">Nettoyage à pression</option>
                    <option value="roof_cleaning">Nettoyage de toiture</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="qcPackage">Forfait</label>
                  <select
                    id="qcPackage"
                    className="select"
                    value={quickCreateForm.servicePackage}
                    onChange={(event) =>
                      setQuickCreateForm((prev) => ({ ...prev, servicePackage: event.target.value }))
                    }
                  >
                    <option value="basique">Basique</option>
                    <option value="premium">Premium</option>
                    <option value="prestige">Prestige</option>
                  </select>
                </div>
              </div>
              <div className="grid-3">
                <div className="form-row">
                  <label className="label" htmlFor="qcDate">Date</label>
                  <input
                    id="qcDate"
                    className="input"
                    type="date"
                    value={quickCreateForm.scheduledDate}
                    onChange={(event) =>
                      setQuickCreateForm((prev) => ({ ...prev, scheduledDate: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="qcStart">Début</label>
                  <input
                    id="qcStart"
                    className="input"
                    type="time"
                    value={quickCreateForm.scheduledStartTime}
                    onChange={(event) =>
                      setQuickCreateForm((prev) => ({ ...prev, scheduledStartTime: event.target.value }))
                    }
                  />
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="qcEnd">Fin</label>
                  <input
                    id="qcEnd"
                    className="input"
                    type="time"
                    value={quickCreateForm.scheduledEndTime}
                    onChange={(event) =>
                      setQuickCreateForm((prev) => ({ ...prev, scheduledEndTime: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="qcAddress">Adresse</label>
                <input
                  id="qcAddress"
                  className="input"
                  value={quickCreateForm.address}
                  onChange={(event) =>
                    setQuickCreateForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
              </div>
              <div className="grid-2">
                <div className="form-row">
                  <label className="label" htmlFor="qcCity">Ville</label>
                  <input
                    id="qcCity"
                    className="input"
                    value={quickCreateForm.city}
                    onChange={(event) =>
                      setQuickCreateForm((prev) => ({ ...prev, city: event.target.value }))
                    }
                  />
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="qcPostal">Code postal</label>
                  <input
                    id="qcPostal"
                    className="input"
                    value={quickCreateForm.postalCode}
                    onChange={(event) =>
                      setQuickCreateForm((prev) => ({ ...prev, postalCode: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-row">
                  <label className="label" htmlFor="qcRevenue">Revenu estimé</label>
                  <input
                    id="qcRevenue"
                    className="input"
                    type="number"
                    value={quickCreateForm.estimatedRevenue}
                    onChange={(event) =>
                      setQuickCreateForm((prev) => ({ ...prev, estimatedRevenue: event.target.value }))
                    }
                  />
                </div>
                <div className="form-row" style={{ alignItems: "center" }}>
                  {quickCreateTechnician.id ? (
                    <label className="pill" style={{ gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={quickCreateAssign}
                        onChange={(event) => setQuickCreateAssign(event.target.checked)}
                      />
                      Assigner à {quickCreateTechnician.name || "technicien"}
                    </label>
                  ) : null}
                </div>
              </div>
              <div className="form-row">
                <label className="label" htmlFor="qcDescription">Description</label>
                <textarea
                  id="qcDescription"
                  className="textarea"
                  value={quickCreateForm.description}
                  onChange={(event) =>
                    setQuickCreateForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>
              <div className="table-actions">
                <button className="button-primary" type="submit">Créer le travail</button>
                <button className="button-ghost" type="button" onClick={() => setQuickCreateOpen(false)}>
                  Annuler
                </button>
              </div>
              {quickCreateStatus ? <div className="hint">{quickCreateStatus}</div> : null}
            </form>
          </div>
        </div>
      ) : null}

      <div className="stack">
        <div className="card">
          <h3 className="card-title">Réaffecter un travail</h3>
          <form className="form-grid" onSubmit={submitReassign}>
            <div className="form-row">
              <label className="label" htmlFor="reassignJob">ID du travail</label>
              <input
                id="reassignJob"
                className="input"
                value={reassignForm.jobId}
                onChange={(event) => setReassignForm({ ...reassignForm, jobId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="reassignTech">ID technicien</label>
              <input
                id="reassignTech"
                className="input"
                value={reassignForm.technicianId}
                onChange={(event) => setReassignForm({ ...reassignForm, technicianId: event.target.value })}
                required
              />
            </div>
            <button className="button-primary" type="submit">Réaffecter</button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Annulation météo</h3>
          <form className="form-grid" onSubmit={submitWeather}>
            <div className="form-row">
              <label className="label" htmlFor="startDate">Date de début</label>
              <input
                id="startDate"
                className="input"
                type="date"
                value={weatherForm.startDate}
                onChange={(event) => setWeatherForm({ ...weatherForm, startDate: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="endDate">Date de fin</label>
              <input
                id="endDate"
                className="input"
                type="date"
                value={weatherForm.endDate}
                onChange={(event) => setWeatherForm({ ...weatherForm, endDate: event.target.value })}
                required
              />
            </div>
            <button className="button-secondary" type="submit">Annuler les travaux</button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Recherche GPS</h3>
          <form className="form-grid" onSubmit={submitGps}>
            <div className="form-row">
              <label className="label" htmlFor="gpsTech">ID technicien</label>
              <input
                id="gpsTech"
                className="input"
                value={gpsForm.technicianId}
                onChange={(event) => setGpsForm({ ...gpsForm, technicianId: event.target.value })}
              />
            </div>
            <div className="stack">
              <div className="form-row">
                <label className="label" htmlFor="gpsStart">Début</label>
                <input
                  id="gpsStart"
                  className="input"
                  type="datetime-local"
                  value={gpsForm.start}
                  onChange={(event) => setGpsForm({ ...gpsForm, start: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="gpsEnd">Fin</label>
                <input
                  id="gpsEnd"
                  className="input"
                  type="datetime-local"
                  value={gpsForm.end}
                  onChange={(event) => setGpsForm({ ...gpsForm, end: event.target.value })}
                />
              </div>
            </div>
            <button className="button-ghost" type="submit">Charger le GPS</button>
          </form>
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <h3 className="card-title">Conflits</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Travail</th>
                <th>Technicien</th>
                <th>Date</th>
                <th>Créneau</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((conflict) => (
                <tr key={conflict.job_id}>
                  <td>{conflict.job_id}</td>
                  <td>{conflict.technician_id}</td>
                  <td>{conflict.scheduled_date}</td>
                  <td>
                    {conflict.scheduled_start_time ?? ""} - {conflict.scheduled_end_time ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="card-title">Carte GPS des techniciens</h3>
          <div className="map-shell">
            <div className="map-canvas" ref={mapRef} />
            {mapMessage ? <div className="map-overlay">{mapMessage}</div> : null}
          </div>
          {gpsMarkers.length ? (
            <div className="list" style={{ marginTop: 12 }}>
              {gpsMarkers.map((marker) => (
                <div className="list-item" key={marker.id}>
                  <div>
                    <strong>{marker.name}</strong>
                    <div className="card-meta">Dernier ping : {marker.lastSeenLabel}</div>
                    <div className="card-meta">
                      {marker.position.lat.toFixed(5)}, {marker.position.lng.toFixed(5)}
                    </div>
                  </div>
                  <span className="tag">GPS</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-meta" style={{ marginTop: 12 }}>
              Aucun point GPS disponible.
            </div>
          )}
        </div>
      </div>

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}

function getTechKey(column: DispatchColumnType) {
  return column.technicianId ?? column.technician;
}

function resolveTechKey(
  clientX: number,
  refs: Record<string, HTMLDivElement | null>
) {
  const entries = Object.entries(refs);
  for (const [key, column] of entries) {
    if (!column) continue;
    const rect = column.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right) {
      return key;
    }
  }
  return undefined;
}

function moveJob(board: DispatchColumnType[], preview: DragPreview, selectedDate: string) {
  let movedJob: DispatchJob | null = null;
  const withoutJob = board.map((column) => {
    const jobs = column.jobs.filter((job) => {
      if (job.id === preview.jobId) {
        movedJob = job;
        return false;
      }
      return true;
    });
    return { ...column, jobs };
  });

  if (!movedJob) {
    return board;
  }

  const baseJob = movedJob as DispatchJob;
  const updatedJob: DispatchJob = {
    ...baseJob,
    scheduledDate: selectedDate,
    scheduledStartTime: formatTime(preview.startMinutes),
    scheduledEndTime: formatTime(preview.endMinutes),
    time: `${formatTime(preview.startMinutes)}-${formatTime(preview.endMinutes)}`,
  };

  return withoutJob.map((column) => {
    const key = getTechKey(column);
    if (key !== preview.techKey) {
      return column;
    }
    const jobs = [...column.jobs, updatedJob];
    jobs.sort((a, b) => getJobTimes(a).start - getJobTimes(b).start);
    return { ...column, jobs };
  });
}

function getJobTimes(job: DispatchJob) {
  const gridStart = START_HOUR * 60;
  const gridEnd = END_HOUR * 60;
  const range = parseTimeRange(job.time);
  const start =
    parseTime(job.scheduledStartTime) ?? range?.start ?? gridStart + 60;
  const end =
    parseTime(job.scheduledEndTime) ?? range?.end ?? start + 60;
  const safeEnd = Math.max(end, start + SNAP_MINUTES);
  const duration = Math.max(30, safeEnd - start);
  return {
    start: clamp(start, gridStart, gridEnd - SNAP_MINUTES),
    end: clamp(safeEnd, gridStart + SNAP_MINUTES, gridEnd),
    duration,
  };
}

function parseTime(value?: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes ?? "0");
  if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) {
    return null;
  }
  return parsedHours * 60 + parsedMinutes;
}

function parseTimeRange(value?: string) {
  if (!value) return null;
  if (!value.includes("-")) return null;
  const [startRaw, endRaw] = value.split("-");
  const start = parseTime(startRaw.trim());
  const end = parseTime(endRaw.trim());
  if (start === null || end === null) {
    return null;
  }
  return { start, end };
}

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("delay") || normalized.includes("pending") || normalized.includes("at risk")) {
    return "warning";
  }
  if (normalized.includes("cancel") || normalized.includes("no show") || normalized.includes("issue")) {
    return "danger";
  }
  if (normalized.includes("complete") || normalized.includes("confirm")) {
    return "success";
  }
  return "default";
}

function maybeAutoScroll(clientY: number) {
  const threshold = 80;
  const scrollSpeed = 12;
  if (clientY < threshold) {
    window.scrollBy({ top: -scrollSpeed, behavior: "smooth" });
  } else if (clientY > window.innerHeight - threshold) {
    window.scrollBy({ top: scrollSpeed, behavior: "smooth" });
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
