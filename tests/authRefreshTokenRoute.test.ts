import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/refresh-token/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { createAdminClient, createAnonClient } from "@/lib/supabaseServer";
import { getRefreshTokenFromRequest, setSessionCookies } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const { mockCreateAnonClient, mockCreateAdminClient } = vi.hoisted(() => ({
  mockCreateAnonClient: vi.fn(),
  mockCreateAdminClient: vi.fn(),
}));

const { mockBeginIdempotency, mockCompleteIdempotency } = vi.hoisted(() => ({
  mockBeginIdempotency: vi.fn(),
  mockCompleteIdempotency: vi.fn(),
}));

const { mockRateLimit, mockGetRequestIp } = vi.hoisted(() => ({
  mockRateLimit: vi.fn(),
  mockGetRequestIp: vi.fn(),
}));

const { mockGetRefreshTokenFromRequest, mockSetSessionCookies } = vi.hoisted(() => ({
  mockGetRefreshTokenFromRequest: vi.fn(),
  mockSetSessionCookies: vi.fn(),
}));

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

vi.mock("@/lib/supabaseServer", () => ({
  createAnonClient: mockCreateAnonClient,
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/lib/idempotency", () => ({
  beginIdempotency: mockBeginIdempotency,
  completeIdempotency: mockCompleteIdempotency,
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: mockRateLimit,
  getRequestIp: mockGetRequestIp,
}));

vi.mock("@/lib/session", () => ({
  getRefreshTokenFromRequest: mockGetRefreshTokenFromRequest,
  setSessionCookies: mockSetSessionCookies,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

const mockRefreshSession = vi.fn();

function createRequest() {
  return new Request("https://example.com/api/auth/refresh-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
  });
}

async function callPost() {
  const response = await POST(createRequest());
  if (!response) {
    throw new Error("No response returned from handler");
  }
  return response;
}

beforeEach(() => {
  vi.clearAllMocks();

  mockCreateAnonClient.mockReturnValue({
    auth: { refreshSession: mockRefreshSession },
  });
  mockCreateAdminClient.mockReturnValue({});

  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");
  mockGetRefreshTokenFromRequest.mockReturnValue("refresh-token");

  mockRefreshSession.mockResolvedValue({
    data: { session: { user: { id: "user-1" } } },
    error: null,
  });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "ip:hash",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
  mockLogAudit.mockResolvedValue(undefined);
});

describe("POST /api/auth/refresh-token", () => {
  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost();

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Trop de tentatives. Réessayez plus tard.",
    });
  });

  it("returns 401 when refresh token is missing", async () => {
    mockGetRefreshTokenFromRequest.mockReturnValueOnce(null);

    const response = await callPost();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Missing refresh token" });
  });

  it("returns replayed response when idempotency replays", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 200,
      body: { ok: true },
    });

    const response = await callPost();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  it("returns conflict when idempotency mismatches", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const response = await callPost();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
  });

  it("returns in-progress when idempotency is pending", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const response = await callPost();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
  });

  it("returns 401 when refresh fails", async () => {
    mockRefreshSession.mockResolvedValueOnce({ data: { session: null }, error: { message: "fail" } });

    const response = await callPost();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unable to refresh session" });
  });

  it("refreshes session and completes idempotency", async () => {
    const response = await callPost();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSetSessionCookies).toHaveBeenCalledWith(response, expect.anything());
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "ip:hash",
      "hash-1",
      { ok: true },
      200
    );
    expect(mockLogAudit).toHaveBeenCalled();
  });
});
