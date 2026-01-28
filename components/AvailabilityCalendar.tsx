"use client";

import { useState, useEffect } from "react";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type AvailabilitySlot = {
  availability_id?: string;
  day_of_week: DayOfWeek;
  hour: number;
  is_available: boolean;
};

type AvailabilityCalendarProps = {
  userId: string;
  readonly?: boolean;
};

const DAYS: { value: DayOfWeek; label: string; labelFr: string }[] = [
  { value: "monday", label: "Monday", labelFr: "Lundi" },
  { value: "tuesday", label: "Tuesday", labelFr: "Mardi" },
  { value: "wednesday", label: "Wednesday", labelFr: "Mercredi" },
  { value: "thursday", label: "Thursday", labelFr: "Jeudi" },
  { value: "friday", label: "Friday", labelFr: "Vendredi" },
  { value: "saturday", label: "Saturday", labelFr: "Samedi" },
  { value: "sunday", label: "Sunday", labelFr: "Dimanche" },
];

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7am to 10pm (22h)

export default function AvailabilityCalendar({ userId, readonly = false }: AvailabilityCalendarProps) {
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAvailability();
  }, [userId]);

  async function loadAvailability() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/users/${userId}/availability`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Échec du chargement de la disponibilité");
      setLoading(false);
      return;
    }

    // Convert array to lookup map
    const availabilityMap: Record<string, boolean> = {};
    (data.availability ?? []).forEach((slot: AvailabilitySlot) => {
      const key = `${slot.day_of_week}-${slot.hour}`;
      availabilityMap[key] = slot.is_available;
    });

    setAvailability(availabilityMap);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    // Convert map back to array
    const slots: AvailabilitySlot[] = [];
    for (const day of DAYS) {
      for (const hour of HOURS) {
        const key = `${day.value}-${hour}`;
        slots.push({
          day_of_week: day.value,
          hour,
          is_available: availability[key] ?? false,
        });
      }
    }

    const res = await fetch(`/api/users/${userId}/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: slots }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Échec de l'enregistrement");
      setSaving(false);
      return;
    }

    setSuccess("Disponibilité enregistrée avec succès!");
    setSaving(false);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000);
  }

  function toggleSlot(day: DayOfWeek, hour: number) {
    if (readonly) return;

    const key = `${day}-${hour}`;
    setAvailability((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function toggleDay(day: DayOfWeek) {
    if (readonly) return;

    const allAvailable = HOURS.every((hour) => availability[`${day}-${hour}`]);

    setAvailability((prev) => {
      const next = { ...prev };
      HOURS.forEach((hour) => {
        next[`${day}-${hour}`] = !allAvailable;
      });
      return next;
    });
  }

  function toggleHour(hour: number) {
    if (readonly) return;

    const allAvailable = DAYS.every((day) => availability[`${day.value}-${hour}`]);

    setAvailability((prev) => {
      const next = { ...prev };
      DAYS.forEach((day) => {
        next[`${day.value}-${hour}`] = !allAvailable;
      });
      return next;
    });
  }

  function setWorkWeek() {
    if (readonly) return;

    setAvailability((prev) => {
      const next = { ...prev };

      // Monday to Friday, 8am to 5pm
      ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((day) => {
        HOURS.forEach((hour) => {
          const key = `${day}-${hour}`;
          next[key] = hour >= 8 && hour < 17;
        });
      });

      // Saturday and Sunday - unavailable
      ["saturday", "sunday"].forEach((day) => {
        HOURS.forEach((hour) => {
          next[`${day}-${hour}`] = false;
        });
      });

      return next;
    });
  }

  function clearAll() {
    if (readonly) return;

    setAvailability({});
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-meta">Chargement du calendrier...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Calendrier de disponibilité</h3>
          <div className="card-meta">Cliquez sur les heures pour basculer la disponibilité</div>
        </div>
        {!readonly && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="button-secondary" type="button" onClick={setWorkWeek}>
              Semaine de travail
            </button>
            <button className="button-ghost" type="button" onClick={clearAll}>
              Tout effacer
            </button>
          </div>
        )}
      </div>

      <div style={{ overflowX: "auto", marginTop: "16px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "11px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: "8px 4px",
                  textAlign: "left",
                  borderBottom: "2px solid #e2e8f0",
                  position: "sticky",
                  left: 0,
                  backgroundColor: "white",
                  zIndex: 2,
                }}
              >
                Jour
              </th>
              {HOURS.map((hour) => (
                <th
                  key={hour}
                  onClick={() => toggleHour(hour)}
                  style={{
                    padding: "8px 2px",
                    textAlign: "center",
                    borderBottom: "2px solid #e2e8f0",
                    cursor: readonly ? "default" : "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {hour}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day.value}>
                <td
                  onClick={() => toggleDay(day.value)}
                  style={{
                    padding: "8px 4px",
                    fontWeight: 600,
                    borderBottom: "1px solid #e2e8f0",
                    position: "sticky",
                    left: 0,
                    backgroundColor: "white",
                    cursor: readonly ? "default" : "pointer",
                    userSelect: "none",
                    zIndex: 1,
                  }}
                >
                  {day.labelFr}
                </td>
                {HOURS.map((hour) => {
                  const key = `${day.value}-${hour}`;
                  const isAvailable = availability[key] ?? false;

                  return (
                    <td
                      key={hour}
                      onClick={() => toggleSlot(day.value, hour)}
                      style={{
                        padding: "4px",
                        textAlign: "center",
                        borderBottom: "1px solid #e2e8f0",
                        borderRight: hour % 2 === 1 ? "1px solid #f1f5f9" : "none",
                        backgroundColor: isAvailable ? "#d1fae5" : "#f8fafc",
                        cursor: readonly ? "default" : "pointer",
                        transition: "background-color 0.15s",
                      }}
                    >
                      {isAvailable && (
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            margin: "0 auto",
                            backgroundColor: "#10b981",
                            borderRadius: "4px",
                          }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readonly && (
        <div style={{ marginTop: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="button-primary"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Enregistrement..." : "Enregistrer la disponibilité"}
          </button>
          {success && <div style={{ color: "#10b981", fontSize: "14px" }}>✓ {success}</div>}
          {error && <div className="alert">{error}</div>}
        </div>
      )}

      <div style={{ marginTop: "16px", display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              backgroundColor: "#10b981",
              borderRadius: "4px",
            }}
          />
          <span>Disponible</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
            }}
          />
          <span>Indisponible</span>
        </div>
      </div>
    </div>
  );
}
