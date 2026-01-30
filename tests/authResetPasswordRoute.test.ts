import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/reset-password/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { createAdminClient, createAnonClient } from "@/lib/supabaseServer";
import { setSessionCookies } from "@/lib/session";
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

const { mockSetSessionCookies } = vi.hoisted(() => ({
  mockSetSessionCookies: vi.fn(),
}));

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

const { mockResetPasswordSchema } = vi.hoisted(() => ({
  mockResetPasswordSchema: { safeParse: vi.fn() },
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
  setSessionCookies: mockSetSessionCookies,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/validators", () => ({
  resetPasswordSchema: mockResetPasswordSchema,
}));

const mockExchangeCodeForSession = vi.fn();
const mockUpdateUser = vi.fn();

function createRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/auth/reset-password", {
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

  mockCreateAnonClient.mockReturnValue({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      updateUser: mockUpdateUser,
    },
  });
  mockCreateAdminClient.mockReturnValue({});

  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");

  mockResetPasswordSchema.safeParse.mockImplementation((body: { code?: string }) => ({
    success: true,
    data: { code: body?.code ?? "code", newPassword: "NewPass123!" },
  }));

  mockExchangeCodeForSession.mockResolvedValue({
    data: { session: { user: { id: "user-1" }, access_token: "token" } },
    error: null,
  });
  mockUpdateUser.mockResolvedValue({ error: null });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "ip:hash",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
  mockLogAudit.mockResolvedValue(undefined);
});

describe("POST /api/auth/reset-password", () => {
  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost({ code: "code", newPassword: "NewPass123!" });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Trop de tentatives. Réessayez plus tard.",
    });
  });

  it("returns 400 on invalid payload", async () => {
    mockResetPasswordSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost({});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "Données invalides" });
  });

  it("returns replayed response when idempotency replays", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 200,
      body: { success: true },
    });

    const response = await callPost({ code: "code", newPassword: "NewPass123!" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("returns conflict when idempotency mismatches", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const response = await callPost({ code: "code", newPassword: "NewPass123!" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
  });

  it("returns in-progress when idempotency is pending", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const response = await callPost({ code: "code", newPassword: "NewPass123!" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
  });

  it("returns 400 when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ data: { session: null }, error: { message: "fail" } });

    const response = await callPost({ code: "code", newPassword: "NewPass123!" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Code de réinitialisation invalide ou expiré",
    });
  });

  it("returns 500 when update fails", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost({ code: "code", newPassword: "NewPass123!" });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Impossible de mettre à jour le mot de passe",
    });
  });

  it("sets session cookies and completes idempotency on success", async () => {
    const response = await callPost({ code: "code", newPassword: "NewPass123!" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockSetSessionCookies).toHaveBeenCalledWith(response, expect.anything());
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "ip:hash",
      "hash-1",
      { success: true },
      200
    );
  });
});
