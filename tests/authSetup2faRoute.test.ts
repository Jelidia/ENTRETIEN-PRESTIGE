import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/setup-2fa/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { createAdminClient } from "@/lib/supabaseServer";
import { generateAuthenticatorSecret } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

const { mockRequireRole } = vi.hoisted(() => ({
  mockRequireRole: vi.fn(),
}));

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

const { mockGenerateAuthenticatorSecret } = vi.hoisted(() => ({
  mockGenerateAuthenticatorSecret: vi.fn(),
}));

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireRole: mockRequireRole,
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
  generateAuthenticatorSecret: mockGenerateAuthenticatorSecret,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

const mockUserEq = vi.fn();
const mockUserUpdate = vi.fn(() => ({ eq: mockUserEq }));
const mockAdminFrom = vi.fn(() => ({ update: mockUserUpdate }));

function createRequest() {
  return new Request("https://example.com/api/auth/setup-2fa", {
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

  mockRequireRole.mockResolvedValue({ user: { id: "user-1", email: "test@example.com" } });
  mockCreateAdminClient.mockReturnValue({ from: mockAdminFrom });
  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");

  mockGenerateAuthenticatorSecret.mockReturnValue({ secret: "secret", otpauth: "otpauth://test" });
  mockUserEq.mockResolvedValue({ error: null });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "user:user-1",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
  mockLogAudit.mockResolvedValue(undefined);
});

describe("POST /api/auth/setup-2fa", () => {
  it("returns auth response when role check fails", async () => {
    mockRequireRole.mockResolvedValueOnce({
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    });

    const response = await callPost();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost();

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Trop de tentatives. Réessayez plus tard.",
    });
  });

  it("returns replayed response when idempotency replays", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 200,
      body: { ok: true, otpauth: "otpauth://test" },
    });

    const response = await callPost();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, otpauth: "otpauth://test" });
    expect(mockUserUpdate).not.toHaveBeenCalled();
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

  it("returns 400 when update fails", async () => {
    mockUserEq.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to setup 2FA" });
  });

  it("uses fallback email when missing", async () => {
    mockRequireRole.mockResolvedValueOnce({ user: { id: "user-1", email: null } });

    const response = await callPost();

    expect(response.status).toBe(200);
    expect(mockGenerateAuthenticatorSecret).toHaveBeenCalledWith("user");
  });

  it("updates user and completes idempotency", async () => {
    const response = await callPost();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, otpauth: "otpauth://test" });
    expect(mockUserUpdate).toHaveBeenCalledWith({
      two_factor_secret: "secret",
      two_factor_method: "authenticator",
      two_factor_enabled: true,
    });
    expect(mockUserEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "user:user-1",
      "hash-1",
      { ok: true, otpauth: "otpauth://test" },
      200
    );
  });
});
