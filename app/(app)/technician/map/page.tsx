"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GpsRow = {
  location_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

export default function TechnicianMapPage() {
  const [points, setPoints] = useState<GpsRow[]>([]);
  const [status, setStatus] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const polyline = useRef<any>(null);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const loadPoints = useCallback(async () => {
    const response = await fetch("/api/gps/history");
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to load GPS");
      return;
    }
    const sorted = (json.data ?? []).slice().sort((a: GpsRow, b: GpsRow) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    setPoints(sorted);
  }, []);

  const shareLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fetch("/api/gps/hourly-ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
          }),
        });
        void loadPoints();
      },
      () => undefined
    );
  }, [loadPoints]);

  const getGoogle = useCallback(() => {
    return (window as any).google;
  }, []);

  const loadGoogleMaps = useCallback((key: string) => {
    return new Promise<void>((resolve, reject) => {
      if (getGoogle()?.maps) {
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
    if (!google?.maps) {
      return;
    }
    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: { lat: 45.5017, lng: -73.5673 },
      zoom: 12,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });
    setMapReady(true);
  }, [getGoogle]);

  const renderMarkers = useCallback(() => {
    const google = getGoogle();
    if (!google?.maps || !mapInstance.current) {
      return;
    }
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = [];
    if (polyline.current) {
      polyline.current.setMap(null);
    }

    const path = points.map((point) => ({ lat: point.latitude, lng: point.longitude }));
    if (!path.length) {
      return;
    }

    path.forEach((position, index) => {
      const marker = new google.maps.Marker({
        position,
        map: mapInstance.current,
        label: index === path.length - 1 ? "Now" : "",
      });
      markers.current.push(marker);
    });

    polyline.current = new google.maps.Polyline({
      path,
      map: mapInstance.current,
      strokeColor: "#1e40af",
      strokeOpacity: 0.8,
      strokeWeight: 3,
    });

    mapInstance.current.setCenter(path[path.length - 1]);
  }, [getGoogle, points]);

  useEffect(() => {
    void loadPoints();
    void shareLocation();
  }, [loadPoints, shareLocation]);

  useEffect(() => {
    if (!mapsKey || !mapRef.current) {
      return;
    }
    void loadGoogleMaps(mapsKey)
      .then(() => initMap())
      .catch(() => setStatus("Unable to load maps"));
  }, [initMap, loadGoogleMaps, mapsKey]);

  useEffect(() => {
    if (!mapReady) return;
    renderMarkers();
  }, [mapReady, renderMarkers]);

  const mapMessage = useMemo(() => {
    if (!mapsKey) return "Map disabled. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.";
    if (!mapReady) return "Loading map...";
    if (!points.length) return "No GPS points yet. Tap Share location to start.";
    return "";
  }, [mapsKey, mapReady, points.length]);

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Live map</div>
          <div className="tech-title">Route & locations</div>
        </div>
        <div className="table-actions">
          <button className="button-ghost" type="button" onClick={shareLocation}>Share location</button>
          <button className="button-ghost" type="button" onClick={loadPoints}>Refresh</button>
        </div>
      </div>

      <div className="map-shell">
        <div className="map-canvas" ref={mapRef} />
        {mapMessage ? <div className="map-overlay">{mapMessage}</div> : null}
      </div>

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
