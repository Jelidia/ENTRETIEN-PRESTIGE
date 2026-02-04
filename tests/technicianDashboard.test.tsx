import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TechnicianPage from "@/app/(app)/technician/page";

function setGeolocation(mode: "success" | "error" | "none") {
  if (mode === "none") {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });
    return;
  }
  const geolocation = {
    getCurrentPosition: (onSuccess: PositionCallback, onError?: PositionErrorCallback) => {
      if (mode === "error") {
        const error: GeolocationPositionError = {
          code: 1,
          message: "Denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        };
        onError?.(error);
        return;
      }
      onSuccess({
        coords: { latitude: 45.5, longitude: -73.56, accuracy: 5 } as GeolocationCoordinates,
        timestamp: Date.now(),
      } as GeolocationPosition);
    },
  } as Geolocation;

  Object.defineProperty(navigator, "geolocation", {
    value: geolocation,
    configurable: true,
  });
}

type JobFixture = {
  job_id: string;
  service_type: string;
  status: string;
  scheduled_date: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  address?: string;
  estimated_revenue?: number;
  customer_id?: string;
};

const jobsFixture: JobFixture[] = [
  {
    job_id: "job-1",
    service_type: "Windows",
    status: "scheduled",
    scheduled_date: "2025-01-01",
    scheduled_start_time: "08:00",
    scheduled_end_time: "09:00",
    address: "123 Main St",
    estimated_revenue: 150,
  },
  {
    job_id: "job-2",
    service_type: "Gutters",
    status: "pending",
    scheduled_date: "2025-01-01",
    scheduled_start_time: "10:00",
    customer_id: "cust-2",
  },
  {
    job_id: "job-3",
    service_type: "Pressure wash",
    status: "complete",
    scheduled_date: "2025-01-01",
  },
  {
    job_id: "job-4",
    service_type: "Windows",
    status: "scheduled",
    scheduled_date: "2025-01-01",
    scheduled_end_time: "11:00",
  },
];

function createFetchMock(options?: {
  checkInOk?: boolean;
  checkInErrorMessage?: string | null;
  badCheckInJson?: boolean;
  jobs?: JobFixture[] | null;
  omitJobs?: boolean;
  badJobsJson?: boolean;
}) {
  const checkInOk = options?.checkInOk ?? true;
  const checkInErrorMessage =
    options?.checkInErrorMessage === undefined ? "Unable to update job" : options?.checkInErrorMessage;
  const jobs = options?.jobs ?? jobsFixture;
  return vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.url;
    if (url === "/api/jobs") {
      if (options?.badJobsJson) {
        return new Response("not-json", { status: 200 });
      }
      if (options?.omitJobs) {
        return new Response(JSON.stringify({}), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          data: jobs,
        }),
        { status: 200 }
      );
    }
    if (url.includes("/api/jobs/job-1/check-in")) {
      if (options?.badCheckInJson) {
        return new Response("not-json", { status: 200 });
      }
      return new Response(JSON.stringify(checkInOk ? { ok: true } : checkInErrorMessage ? { error: checkInErrorMessage } : {}), {
        status: checkInOk ? 200 : 400,
      });
    }
    if (url.includes("/api/gps/hourly-ping")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
}

describe("TechnicianPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  it("renders jobs and GPS off state when geolocation is missing", async () => {
    setGeolocation("none");
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianPage />);

    expect((await screen.findAllByText("Windows")).length).toBeGreaterThan(0);
    expect(screen.getByText(/GPS Off/i)).toBeInTheDocument();
    expect(screen.getByText(/Enable location/i)).toBeInTheDocument();
    expect(screen.getByText("Gutters")).toBeInTheDocument();
    expect(screen.getByText("Pressure wash")).toBeInTheDocument();
    expect(screen.getAllByText("08:00 - 09:00").length).toBeGreaterThan(0);

    const buttons = await screen.findAllByRole("button", { name: "Check in" });
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      const body = (fetchMock.mock.calls.find((call) => String(call[0]).includes("check-in"))?.[1]
        ?.body ?? "") as string;
      expect(body).toContain("\"latitude\":0");
    });
  });

  it("sends GPS ping and allows job check-in", async () => {
    setGeolocation("success");
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianPage />);

    await screen.findAllByText("Windows");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/gps/hourly-ping", expect.any(Object)));
    expect(screen.getByText(/GPS On/i)).toBeInTheDocument();
    const buttons = await screen.findAllByRole("button", { name: "Check in" });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/jobs/job-1/check-in",
        expect.objectContaining({ method: "POST" })
      );
    });

    const checkOutButtons = await screen.findAllByRole("button", { name: "Check out" });
    fireEvent.click(checkOutButtons[0]);

    const endShift = await screen.findByRole("button", { name: "End shift" });
    fireEvent.click(endShift);
    expect(screen.getByText("Shift ended.")).toBeInTheDocument();
  });

  it("handles geolocation errors and failed check-ins", async () => {
    setGeolocation("error");
    const fetchMock = createFetchMock({ checkInOk: false });
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianPage />);

    await screen.findAllByText("Windows");
    const buttons = await screen.findAllByRole("button", { name: "Check in" });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Unable to update job/i)).toBeInTheDocument();
    });
  });

  it("uses the default error message when none is provided", async () => {
    setGeolocation("error");
    const fetchMock = createFetchMock({ checkInOk: false, checkInErrorMessage: null });
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianPage />);

    await screen.findAllByText("Windows");
    const buttons = await screen.findAllByRole("button", { name: "Check in" });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText("Unable to update job")).toBeInTheDocument();
    });
  });

  it("shows a placeholder when no schedule window exists", async () => {
    setGeolocation("none");
    const fetchMock = createFetchMock({ omitJobs: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianPage />);
    expect(await screen.findByText("--")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/jobs"));
  });

  it("handles job payload parse errors", async () => {
    setGeolocation("none");
    const fetchMock = createFetchMock({ badJobsJson: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/jobs"));
    expect(screen.getByText(/Jobs scheduled/i)).toBeInTheDocument();
  });

  it("handles check-in payload parse errors", async () => {
    setGeolocation("success");
    const fetchMock = createFetchMock({ badCheckInJson: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<TechnicianPage />);
    await screen.findAllByText("Windows");

    const buttons = await screen.findAllByRole("button", { name: "Check in" });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText("Job job-1 updated.")).toBeInTheDocument();
    });
  });
});
