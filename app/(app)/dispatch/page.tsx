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
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [createState, setCreateState] = useState<CreateState | null>(null);
  const [createPreview, setCreatePreview] = useState<DragPreview | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateStatus, setQuickCreateStatus] = useState("");
  const [quickCreateAssign, setQuickCreateAssign] = useState(true);
  const [quickCreateTechnician, setQuickCreateTechnician] = useState({ id: "", name: "" });
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
        setStatus("Select a date before rescheduling.");
        return;
      }

      const previous = boardRef.current;
      const next = moveJob(previous, preview, selectedDate);
      setBoard(next);

      if (!preview.technicianId) {
        setStatus("Preview updated (not saved). Missing technician ID.");
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
        setStatus(json.error ?? "Unable to update schedule");
        return;
      }

      setStatus("Schedule updated.");
      void loadDispatch();
    },
    [selectedDate, loadDispatch]
  );

  useEffect(() => {
    void loadDispatch();
  }, [loadDispatch]);

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
      setStatus(json.error ?? "Unable to auto-assign");
      return;
    }
    setStatus(`Auto-assigned ${json.assigned ?? 0} jobs.`);
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
      setStatus(json.error ?? "Unable to reassign job");
      return;
    }
    setStatus("Job reassigned.");
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
      setStatus(json.error ?? "Unable to cancel jobs");
      return;
    }
    setStatus("Weather cancellations applied.");
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
      setStatus(json.error ?? "Unable to load GPS");
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
      setQuickCreateStatus(json.error ?? "Unable to create job");
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

    setQuickCreateStatus("Job created.");
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

  const hourLabels = useMemo(() => {
    const hours: string[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
      hours.push(`${String(hour).padStart(2, "0")}:00`);
    }
    return hours;
  }, []);

  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
  const gridTemplate = `80px repeat(${Math.max(columns.length, 1)}, minmax(220px, 1fr))`;
  const dateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Dispatch";

  return (
    <div className="page">
      <TopBar
        title="Dispatch"
        subtitle="Week view, reassignments, and conflicts"
        actions={
          <>
            <button className="button-secondary" type="button" onClick={autoAssign}>
              Auto-assign
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
              New job
            </button>
          </>
        }
      />

      <section className="dispatch-calendar">
        <div className="dispatch-toolbar">
          <div>
            <div className="card-label">Schedule</div>
            <div className="dispatch-date">{dateLabel}</div>
          </div>
          <div className="dispatch-controls">
            <button className="button-ghost" type="button" onClick={() => shiftDate(-1)}>
              Prev
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            >
              Today
            </button>
            <button className="button-ghost" type="button" onClick={() => shiftDate(1)}>
              Next
            </button>
          </div>
        </div>

        <div className="calendar-shell">
          <div className="calendar-header" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="calendar-time-header">Time</div>
            {columns.map((column) => (
              <div key={getTechKey(column)} className="calendar-tech-header">
                <span>{column.technician}</span>
                <span className="calendar-tech-meta">{column.jobs.length} jobs</span>
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
            {columns.map((column) => {
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
                      <div className="calendar-event-title">Rescheduling</div>
                      <div className="calendar-event-meta">Drop to confirm</div>
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
                      <div className="calendar-event-title">New job</div>
                      <div className="calendar-event-meta">Drag to size</div>
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
                <div className="card-label">Quick create</div>
                <div className="quick-create-title">New job slot</div>
                <div className="card-meta">
                  {quickCreateForm.scheduledDate} · {quickCreateForm.scheduledStartTime} - {quickCreateForm.scheduledEndTime}
                </div>
                {quickCreateTechnician.name ? (
                  <div className="card-meta">Technician: {quickCreateTechnician.name}</div>
                ) : null}
              </div>
              <button className="button-ghost" type="button" onClick={() => setQuickCreateOpen(false)}>
                Close
              </button>
            </div>
            <form className="form-grid" onSubmit={submitQuickCreate}>
              <div className="form-row">
                <label className="label" htmlFor="qcCustomer">Customer ID</label>
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
                    <option value="window_cleaning">Window cleaning</option>
                    <option value="gutter_cleaning">Gutter cleaning</option>
                    <option value="pressure_wash">Pressure wash</option>
                    <option value="roof_cleaning">Roof cleaning</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="label" htmlFor="qcPackage">Package</label>
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
                  <label className="label" htmlFor="qcStart">Start</label>
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
                  <label className="label" htmlFor="qcEnd">End</label>
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
                <label className="label" htmlFor="qcAddress">Address</label>
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
                  <label className="label" htmlFor="qcCity">City</label>
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
                  <label className="label" htmlFor="qcPostal">Postal code</label>
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
                  <label className="label" htmlFor="qcRevenue">Estimated revenue</label>
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
                      Assign to {quickCreateTechnician.name || "technician"}
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
                <button className="button-primary" type="submit">Create job</button>
                <button className="button-ghost" type="button" onClick={() => setQuickCreateOpen(false)}>
                  Cancel
                </button>
              </div>
              {quickCreateStatus ? <div className="hint">{quickCreateStatus}</div> : null}
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid-3">
        <div className="card">
          <h3 className="card-title">Reassign job</h3>
          <form className="form-grid" onSubmit={submitReassign}>
            <div className="form-row">
              <label className="label" htmlFor="reassignJob">Job ID</label>
              <input
                id="reassignJob"
                className="input"
                value={reassignForm.jobId}
                onChange={(event) => setReassignForm({ ...reassignForm, jobId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="reassignTech">Technician ID</label>
              <input
                id="reassignTech"
                className="input"
                value={reassignForm.technicianId}
                onChange={(event) => setReassignForm({ ...reassignForm, technicianId: event.target.value })}
                required
              />
            </div>
            <button className="button-primary" type="submit">Reassign</button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Weather cancel</h3>
          <form className="form-grid" onSubmit={submitWeather}>
            <div className="form-row">
              <label className="label" htmlFor="startDate">Start date</label>
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
              <label className="label" htmlFor="endDate">End date</label>
              <input
                id="endDate"
                className="input"
                type="date"
                value={weatherForm.endDate}
                onChange={(event) => setWeatherForm({ ...weatherForm, endDate: event.target.value })}
                required
              />
            </div>
            <button className="button-secondary" type="submit">Cancel jobs</button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">GPS lookup</h3>
          <form className="form-grid" onSubmit={submitGps}>
            <div className="form-row">
              <label className="label" htmlFor="gpsTech">Technician ID</label>
              <input
                id="gpsTech"
                className="input"
                value={gpsForm.technicianId}
                onChange={(event) => setGpsForm({ ...gpsForm, technicianId: event.target.value })}
              />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="gpsStart">Start</label>
                <input
                  id="gpsStart"
                  className="input"
                  type="datetime-local"
                  value={gpsForm.start}
                  onChange={(event) => setGpsForm({ ...gpsForm, start: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="gpsEnd">End</label>
                <input
                  id="gpsEnd"
                  className="input"
                  type="datetime-local"
                  value={gpsForm.end}
                  onChange={(event) => setGpsForm({ ...gpsForm, end: event.target.value })}
                />
              </div>
            </div>
            <button className="button-ghost" type="submit">Load GPS</button>
          </form>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Conflicts</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Technician</th>
                <th>Date</th>
                <th>Window</th>
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
          <h3 className="card-title">GPS results</h3>
          <div className="list" style={{ marginTop: 12 }}>
            {gpsResults.map((point) => (
              <div className="list-item" key={point.location_id}>
                <div>
                  <strong>{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</strong>
                  <div className="card-meta">{new Date(point.timestamp).toLocaleString()}</div>
                </div>
                <span className="tag">GPS</span>
              </div>
            ))}
          </div>
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
