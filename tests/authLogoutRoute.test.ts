import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/logout/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { createAdminClient, createAnonClient } from "@/lib/supabaseServer";
import { clearSessionCookies, getAccessTokenFromRequest } from "@/lib/session";

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

const { mockClearSessionCookies, mockGetAccessTokenFromRequest } = vi.hoisted(() => ({
  mockClearSessionCookies: vi.fn(),
  mockGetAccessTokenFromRequest: vi.fn(),
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

vi.mock("@/lib/session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/session")>("@/lib/session");
  return {
    ...actual,
    clearSessionCookies: mockClearSessionCookies,
    getAccessTokenFromRequest: mockGetAccessTokenFromRequest,
  };
});

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));


const mockSignOut = vi.fn();
const mockAuthGetUser = vi.fn();
const mockSessionEq = vi.fn();
const mockSessionUpdate = vi.fn(() => ({ eq: mockSessionEq }));

const mockAdminFrom = vi.fn(() => ({ update: mockSessionUpdate }));

function createRequest(token?: string | null) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) {
    headers.cookie = `ep_access_token=${token}`;
  }
  return new Request("https://example.com/api/auth/logout", {
    method: "POST",
    headers,
  });
}

async function callPost(token?: string | null) {
  const response = await POST(createRequest(token));
  if (!response) {
    throw new Error("No response returned from handler");
  }
  return response;
}

beforeEach(() => {
  vi.resetAllMocks();

  mockCreateAnonClient.mockReturnValue({
    auth: { signOut: mockSignOut },
  });
  mockSessionUpdate.mockImplementation(() => ({ eq: mockSessionEq }));
  mockAdminFrom.mockImplementation(() => ({ update: mockSessionUpdate }));
  mockCreateAdminClient.mockReturnValue({
    auth: { getUser: mockAuthGetUser },
    from: mockAdminFrom,
  });

  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");

  mockGetAccessTokenFromRequest.mockReturnValue("token");
  mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mockSessionEq.mockResolvedValue({});
  mockLogAudit.mockResolvedValue(undefined);
  mockSignOut.mockResolvedValue({});

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "user:user-1",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
});

describe("POST /api/auth/logout", () => {
  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost();

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Trop de tentatives. Réessayez plus tard.",
    });
    expect(mockSignOut).not.toHaveBeenCalled();
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
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockClearSessionCookies).toHaveBeenCalledWith(response);
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

  it("skips session updates when token missing", async () => {
    mockGetAccessTokenFromRequest.mockReturnValueOnce(null);
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: null } });

    const response = await callPost(null);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSessionUpdate).not.toHaveBeenCalled();
    expect(mockLogAudit).not.toHaveBeenCalled();
    expect(mockClearSessionCookies).toHaveBeenCalledWith(response);
  });

  it("signs out and completes idempotency", async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });

    const response = await callPost("token");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockSessionUpdate).toHaveBeenCalledWith({ is_active: false });
    expect(mockSessionEq).toHaveBeenCalled();
    expect(mockAuthGetUser).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockClearSessionCookies).toHaveBeenCalledWith(response);
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "user:user-1",
      "hash-1",
      { ok: true },
      200
    );
  });
});
