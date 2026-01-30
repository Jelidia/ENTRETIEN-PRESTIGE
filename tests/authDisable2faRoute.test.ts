import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/disable-2fa/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { getAccessTokenFromRequest } from "@/lib/session";
import { createAdminClient, createUserClient } from "@/lib/supabaseServer";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

const { mockRequireRole } = vi.hoisted(() => ({
  mockRequireRole: vi.fn(),
}));

const { mockCreateUserClient, mockCreateAdminClient } = vi.hoisted(() => ({
  mockCreateUserClient: vi.fn(),
  mockCreateAdminClient: vi.fn(),
}));

const { mockBeginIdempotency, mockCompleteIdempotency } = vi.hoisted(() => ({
  mockBeginIdempotency: vi.fn(),
  mockCompleteIdempotency: vi.fn(),
}));

const { mockGetAccessTokenFromRequest } = vi.hoisted(() => ({
  mockGetAccessTokenFromRequest: vi.fn(),
}));

const { mockRateLimit, mockGetRequestIp } = vi.hoisted(() => ({
  mockRateLimit: vi.fn(),
  mockGetRequestIp: vi.fn(),
}));

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireRole: mockRequireRole,
}));

vi.mock("@/lib/supabaseServer", () => ({
  createUserClient: mockCreateUserClient,
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/lib/idempotency", () => ({
  beginIdempotency: mockBeginIdempotency,
  completeIdempotency: mockCompleteIdempotency,
}));

vi.mock("@/lib/session", () => ({
  getAccessTokenFromRequest: mockGetAccessTokenFromRequest,
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: mockRateLimit,
  getRequestIp: mockGetRequestIp,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

const mockUserSingle = vi.fn();
const mockUserEq = vi.fn(() => ({ single: mockUserSingle }));
const mockUserSelect = vi.fn(() => ({ eq: mockUserEq }));
const mockUserFrom = vi.fn(() => ({ select: mockUserSelect }));

const mockAdminEq = vi.fn();
const mockAdminUpdate = vi.fn(() => ({ eq: mockAdminEq }));
const mockAdminFrom = vi.fn(() => ({ update: mockAdminUpdate }));

function createRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/auth/disable-2fa", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callPost(body: Record<string, unknown>) {
  const response = await POST(createRequest(body));
  if (!response) {
    throw new Error("No response returned from handler");
  }
  return response;
}

beforeEach(() => {
  vi.clearAllMocks();

  mockRequireRole.mockResolvedValue({
    profile: { user_id: "admin-1" },
  });

  mockCreateUserClient.mockReturnValue({
    from: mockUserFrom,
  });
  mockCreateAdminClient.mockReturnValue({
    from: mockAdminFrom,
  });

  mockGetAccessTokenFromRequest.mockReturnValue("token");
  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");
  mockLogAudit.mockResolvedValue(undefined);

  mockUserSingle.mockResolvedValue({ data: { user_id: "target-1", company_id: "company-1" }, error: null });
  mockAdminEq.mockResolvedValue({ error: null });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "user:admin-1",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
});

describe("POST /api/auth/disable-2fa", () => {
  it("returns auth response when role check fails", async () => {
    mockRequireRole.mockResolvedValueOnce({
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    });

    const response = await callPost({});

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost({});

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Trop de tentatives. Réessayez plus tard.",
    });
  });

  it("returns 404 when target user is missing", async () => {
    mockUserSingle.mockResolvedValueOnce({ data: null, error: null });

    const response = await callPost({});

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Utilisateur introuvable" });
  });

  it("returns replayed response when idempotency replays", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 200,
      body: { ok: true },
    });

    const response = await callPost({});

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockAdminUpdate).not.toHaveBeenCalled();
  });

  it("returns conflict when idempotency mismatches", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const response = await callPost({});

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
  });

  it("returns in-progress when idempotency is pending", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const response = await callPost({});

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
  });

  it("returns 400 when update fails", async () => {
    mockAdminEq.mockResolvedValueOnce({ error: { message: "Failed" } });

    const response = await callPost({});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to disable 2FA" });
  });

  it("uses provided user id when present", async () => {
    const response = await callPost({ userId: "22222222-2222-2222-2222-222222222222" });

    expect(response.status).toBe(200);
    expect(mockUserEq).toHaveBeenCalledWith("user_id", "22222222-2222-2222-2222-222222222222");
  });

  it("uses empty token when access token is missing", async () => {
    mockGetAccessTokenFromRequest.mockReturnValueOnce(null);

    const response = await callPost({});

    expect(response.status).toBe(200);
    expect(mockCreateUserClient).toHaveBeenCalledWith("");
  });

  it("disables 2FA and completes idempotency", async () => {
    const response = await callPost({});

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, success: true });
    expect(mockAdminUpdate).toHaveBeenCalledWith({ two_factor_enabled: false, two_factor_secret: null });
    expect(mockAdminEq).toHaveBeenCalledWith("user_id", "admin-1");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "user:admin-1",
      "hash-1",
      expect.objectContaining({ ok: true, success: true }),
      200
    );
  });
});
