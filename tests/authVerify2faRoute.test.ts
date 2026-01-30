import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/verify-2fa/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { createAdminClient } from "@/lib/supabaseServer";
import { consumeChallenge } from "@/lib/security";
import { setSessionCookies } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const { mockCreateAdminClient } = vi.hoisted(() => ({
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

const { mockConsumeChallenge } = vi.hoisted(() => ({
  mockConsumeChallenge: vi.fn(),
}));

const { mockSetSessionCookies } = vi.hoisted(() => ({
  mockSetSessionCookies: vi.fn(),
}));

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

const { mockVerify2faSchema } = vi.hoisted(() => ({
  mockVerify2faSchema: { safeParse: vi.fn() },
}));

vi.mock("@/lib/supabaseServer", () => ({
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

vi.mock("@/lib/security", () => ({
  consumeChallenge: mockConsumeChallenge,
}));

vi.mock("@/lib/session", () => ({
  setSessionCookies: mockSetSessionCookies,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/validators", () => ({
  verify2faSchema: mockVerify2faSchema,
}));

const mockGetUser = vi.fn();
const mockSessionInsert = vi.fn();
const mockAdminFrom = vi.fn((table: string) => {
  if (table === "user_sessions") {
    return { insert: mockSessionInsert };
  }
  return { insert: mockSessionInsert };
});

function createRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/auth/verify-2fa", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      "user-agent": "test-agent",
    },
    body: JSON.stringify(body),
  });
}

function createRequestWithHeaders(body: Record<string, unknown>, headers: Record<string, string>) {
  return new Request("https://example.com/api/auth/verify-2fa", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
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

  mockCreateAdminClient.mockReturnValue({
    auth: { getUser: mockGetUser },
    from: mockAdminFrom,
  });

  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");

  mockVerify2faSchema.safeParse.mockImplementation((body: { challengeId?: string; code?: string }) => ({
    success: true,
    data: { challengeId: body?.challengeId ?? "challenge-1", code: body?.code ?? "123456" },
  }));

  mockConsumeChallenge.mockResolvedValue({
    access_token: "token",
    refresh_token: "refresh",
    expires_at: 123,
  });

  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mockSessionInsert.mockResolvedValue({});

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "ip:hash",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
  mockLogAudit.mockResolvedValue(undefined);
});

describe("POST /api/auth/verify-2fa", () => {
  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost({ challengeId: "challenge-1", code: "123456" });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Trop de tentatives. Réessayez plus tard.",
    });
  });

  it("returns 400 on invalid payload", async () => {
    mockVerify2faSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost({});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid verification request" });
  });

  it("returns replayed response when idempotency replays", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 200,
      body: { ok: true },
    });

    const response = await callPost({ challengeId: "challenge-1", code: "123456" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockConsumeChallenge).not.toHaveBeenCalled();
  });

  it("returns conflict when idempotency mismatches", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const response = await callPost({ challengeId: "challenge-1", code: "123456" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
  });

  it("returns in-progress when idempotency is pending", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const response = await callPost({ challengeId: "challenge-1", code: "123456" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
  });

  it("returns 401 when challenge is invalid", async () => {
    mockConsumeChallenge.mockResolvedValueOnce(null);

    const response = await callPost({ challengeId: "challenge-1", code: "123456" });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid or expired code" });
  });

  it("skips audit when user is missing", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const response = await callPost({ challengeId: "challenge-1", code: "123456" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSessionInsert).not.toHaveBeenCalled();
    expect(mockLogAudit).not.toHaveBeenCalled();
    expect(mockSetSessionCookies).toHaveBeenCalled();
  });

  it("sets session cookies and completes idempotency", async () => {
    const response = await callPost({ challengeId: "challenge-1", code: "123456" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSessionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        ip_address: "203.0.113.10",
        user_agent: "test-agent",
      })
    );
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockSetSessionCookies).toHaveBeenCalledWith(response, expect.anything());
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "ip:hash",
      "hash-1",
      { ok: true },
      200
    );
  });

  it("stores null session fields when headers or tokens are missing", async () => {
    mockConsumeChallenge.mockResolvedValueOnce({
      access_token: "",
      refresh_token: "",
      expires_at: null,
    });

    const response = await POST(
      createRequestWithHeaders({ challengeId: "challenge-1", code: "123456" }, {})
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSessionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: null,
        user_agent: "",
        token_hash: null,
        expires_at: null,
      })
    );
  });
});
