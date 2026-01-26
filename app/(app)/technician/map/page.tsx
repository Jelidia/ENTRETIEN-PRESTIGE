"use client";

import { useEffect, useState } from "react";

type GpsRow = {
  location_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

export default function TechnicianMapPage() {
  const [points, setPoints] = useState<GpsRow[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadPoints();
  }, []);

  async function loadPoints() {
    const response = await fetch("/api/gps/history");
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to load GPS");
      return;
    }
    setPoints(json.data ?? []);
  }

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Live map</div>
          <div className="tech-title">Route & locations</div>
        </div>
        <button className="button-ghost" type="button" onClick={loadPoints}>Refresh</button>
      </div>

      <div className="map-shell">Map preview (GPS overlay)</div>

      <div className="card">
        <h3 className="card-title">Recent GPS points</h3>
        <div className="list" style={{ marginTop: 12 }}>
          {points.map((point) => (
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
      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
