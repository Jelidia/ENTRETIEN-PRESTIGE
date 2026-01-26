import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TechnicianMapPage from "@/app/(app)/technician/map/page";

type FetchHandler = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

function createFetchMock(historyData: any[] = []): FetchHandler {
  return vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("/api/gps/history")) {
      return new Response(JSON.stringify({ data: historyData }), { status: 200 });
    }
    if (url.includes("/api/gps/hourly-ping")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as unknown as FetchHandler;
}

function setGeolocation(success = true) {
  const geolocation = {
    getCurrentPosition: (onSuccess: PositionCallback, onError?: PositionErrorCallback) => {
      if (!success) {
        onError?.({ code: 1, message: "Denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as any);
        return;
      }
      onSuccess({
        coords: { latitude: 45.5, longitude: -73.56, accuracy: 8 } as GeolocationCoordinates,
        timestamp: Date.now(),
      } as GeolocationPosition);
    },
  } as Geolocation;

  Object.defineProperty(navigator, "geolocation", {
    value: geolocation,
    configurable: true,
  });
}

function clearGeolocation() {
  Object.defineProperty(navigator, "geolocation", {
    value: undefined,
    configurable: true,
  });
}

function setupGoogleMaps() {
  const mapInstance = { setCenter: vi.fn() };
  const Marker = vi.fn(() => ({ setMap: vi.fn() }));
  const Polyline = vi.fn(() => ({ setMap: vi.fn() }));
  const Map = vi.fn(() => mapInstance);
  (window as any).google = {
    maps: {
      Map,
      Marker,
      Polyline,
    },
  };
  return { Map, Marker, Polyline, mapInstance };
}

describe("TechnicianMapPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (window as any).google;
  });
  it("shows a disabled message without maps key", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    clearGeolocation();
    vi.stubGlobal("fetch", createFetchMock());

    render(<TechnicianMapPage />);
    expect(await screen.findByText(/Map disabled/i)).toBeInTheDocument();
  });

  it("renders map with GPS points when key is present", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
    setGeolocation(true);
    const { Map } = setupGoogleMaps();
    const points = [
      { location_id: "1", latitude: 45.4, longitude: -73.55, timestamp: "2025-01-01T10:00:00Z" },
      { location_id: "2", latitude: 45.5, longitude: -73.56, timestamp: "2025-01-01T10:10:00Z" },
    ];
    const fetchMock = createFetchMock(points);
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianMapPage />);

    await waitFor(() => expect(Map).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByText(/Loading map/i)).not.toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/gps/hourly-ping",
      expect.objectContaining({ method: "POST" })
    );
    const refreshButtons = await screen.findAllByRole("button", { name: "Refresh" });
    refreshButtons[0].click();
    await waitFor(() =>
      expect(fetchMock.mock.calls.filter((call) => String(call[0]).includes("/api/gps/history")).length).toBeGreaterThan(1)
    );

    delete (window as any).google.maps;
    refreshButtons[0].click();
    await waitFor(() =>
      expect(fetchMock.mock.calls.filter((call) => String(call[0]).includes("/api/gps/history")).length).toBeGreaterThan(2)
    );
  });

  it("shows empty state when there are no points", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
    setGeolocation(false);
    setupGoogleMaps();
    vi.stubGlobal("fetch", createFetchMock([]));

    render(<TechnicianMapPage />);
    expect(await screen.findByText(/No GPS points yet/i)).toBeInTheDocument();
  });

  it("shows status when GPS history fails", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "";
    clearGeolocation();
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: "History failed" }), { status: 500 })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianMapPage />);
    expect(await screen.findByText(/History failed/i)).toBeInTheDocument();
  });

  it("uses the default GPS error when missing", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "";
    clearGeolocation();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianMapPage />);
    expect(await screen.findByText(/Unable to load GPS/i)).toBeInTheDocument();
  });

  it("handles GPS history payloads without data", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    clearGeolocation();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianMapPage />);
    expect(await screen.findByText(/Map disabled/i)).toBeInTheDocument();
  });

  it("shows an error when the map script fails", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
    clearGeolocation();
    vi.stubGlobal("fetch", createFetchMock([]));
    delete (window as any).google;

    const originalCreate = document.createElement.bind(document);
    let createdScript: HTMLScriptElement | null = null;
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const element = originalCreate(tagName);
      if (tagName === "script") {
        createdScript = element as HTMLScriptElement;
      }
      return element;
    });

    render(<TechnicianMapPage />);

    await waitFor(() => expect(createdScript).not.toBeNull());
    createdScript?.onerror?.(new Event("error"));

    expect(await screen.findByText(/Unable to load maps/i)).toBeInTheDocument();
  });

  it("keeps loading when google maps is missing after script load", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
    clearGeolocation();
    vi.stubGlobal("fetch", createFetchMock([]));
    (window as any).google = {};

    const originalCreate = document.createElement.bind(document);
    let createdScript: HTMLScriptElement | null = null;
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const element = originalCreate(tagName);
      if (tagName === "script") {
        createdScript = element as HTMLScriptElement;
      }
      return element;
    });

    render(<TechnicianMapPage />);

    await waitFor(() => expect(createdScript).not.toBeNull());
    createdScript?.onload?.(new Event("load"));

    expect(await screen.findByText(/Loading map/i)).toBeInTheDocument();
  });
});
