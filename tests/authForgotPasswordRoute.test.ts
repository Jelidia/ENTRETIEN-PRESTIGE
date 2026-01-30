import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/forgot-password/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { createAdminClient, createAnonClient } from "@/lib/supabaseServer";
import { logAudit } from "@/lib/audit";
import { getBaseUrl } from "@/lib/env";

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

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

const { mockGetBaseUrl } = vi.hoisted(() => ({
  mockGetBaseUrl: vi.fn(),
}));

const { mockForgotPasswordSchema } = vi.hoisted(() => ({
  mockForgotPasswordSchema: { safeParse: vi.fn() },
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

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/env", () => ({
  getBaseUrl: mockGetBaseUrl,
}));

vi.mock("@/lib/validators", () => ({
  forgotPasswordSchema: mockForgotPasswordSchema,
}));

const mockResetPasswordForEmail = vi.fn();

function createRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/auth/forgot-password", {
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
    auth: { resetPasswordForEmail: mockResetPasswordForEmail },
  });
  mockCreateAdminClient.mockReturnValue({});

  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");
  mockLogAudit.mockResolvedValue(undefined);
  mockGetBaseUrl.mockReturnValue("https://example.com");

  mockForgotPasswordSchema.safeParse.mockImplementation((body: { email?: string }) => ({
    success: true,
    data: { email: body?.email ?? "" },
  }));

  mockResetPasswordForEmail.mockResolvedValue({ error: null });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "ip:hash",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
});

describe("POST /api/auth/forgot-password", () => {
  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Trop de tentatives. Réessayez plus tard.",
    });
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid payload", async () => {
    mockForgotPasswordSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost({ email: "bad" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid request" });
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("returns replayed response when idempotency replays", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 200,
      body: { ok: true },
    });

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("returns conflict when idempotency mismatches", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
  });

  it("returns in-progress when idempotency is pending", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
  });

  it("returns 400 when reset email fails", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to send reset link" });
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.anything(),
      null,
      "forgot_password",
      "user",
      null,
      "failed",
      expect.objectContaining({
        reason: "reset_email_failed",
      })
    );
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });

  it("sends reset email and completes idempotency", async () => {
    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
      redirectTo: "https://example.com/reset-password",
    });
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.anything(),
      null,
      "forgot_password",
      "user",
      null,
      "success",
      expect.objectContaining({
        newValues: { email: "test@example.com" },
      })
    );
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "ip:hash",
      "hash-1",
      { ok: true },
      200
    );
  });
});
