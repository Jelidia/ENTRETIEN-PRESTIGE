import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/login/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { createAdminClient, createAnonClient } from "@/lib/supabaseServer";
import { setSessionCookies } from "@/lib/session";
import { createChallenge, sendTwoFactorCode } from "@/lib/security";
import { isSmsConfigured } from "@/lib/twilio";
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

const { mockCreateChallenge, mockSendTwoFactorCode } = vi.hoisted(() => ({
  mockCreateChallenge: vi.fn(),
  mockSendTwoFactorCode: vi.fn(),
}));

const { mockIsSmsConfigured } = vi.hoisted(() => ({
  mockIsSmsConfigured: vi.fn(),
}));

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

const { mockLoginSchema } = vi.hoisted(() => ({
  mockLoginSchema: { safeParse: vi.fn() },
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

vi.mock("@/lib/security", () => ({
  createChallenge: mockCreateChallenge,
  sendTwoFactorCode: mockSendTwoFactorCode,
}));

vi.mock("@/lib/twilio", () => ({
  isSmsConfigured: mockIsSmsConfigured,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/validators", () => ({
  loginSchema: mockLoginSchema,
}));

const mockSignInWithPassword = vi.fn();
const mockUserMaybeSingle = vi.fn();
const mockUserSingle = vi.fn();
const mockUserUpdateEq = vi.fn();
const mockUserUpdate = vi.fn(() => ({ eq: mockUserUpdateEq }));
const mockUserEq = vi.fn(() => ({ maybeSingle: mockUserMaybeSingle, single: mockUserSingle }));
const mockUserSelect = vi.fn(() => ({ eq: mockUserEq }));
const mockSessionInsert = vi.fn();

const mockAdminFrom = vi.fn((table: string) => {
  if (table === "users") {
    return { select: mockUserSelect, update: mockUserUpdate };
  }
  if (table === "user_sessions") {
    return { insert: mockSessionInsert };
  }
  return { select: mockUserSelect, update: mockUserUpdate };
});

function createRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/auth/login", {
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
    auth: { signInWithPassword: mockSignInWithPassword },
  });
  mockCreateAdminClient.mockReturnValue({
    from: mockAdminFrom,
  });

  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");

  mockLoginSchema.safeParse.mockImplementation((body: { email?: string; password?: string }) => ({
    success: true,
    data: { email: body?.email ?? "", password: body?.password ?? "" },
  }));

  mockUserMaybeSingle.mockResolvedValue({
    data: {
      user_id: "user-1",
      failed_login_attempts: 0,
      last_failed_login: null,
      status: "active",
      two_factor_enabled: false,
      two_factor_method: null,
      login_count: 0,
    },
  });
  mockUserSingle.mockResolvedValue({
    data: {
      role: "user",
      two_factor_enabled: false,
      two_factor_method: null,
      phone: null,
    },
  });
  mockUserUpdateEq.mockResolvedValue({});
  mockSessionInsert.mockResolvedValue({});

  mockSignInWithPassword.mockResolvedValue({
    data: {
      session: { access_token: "token", expires_at: 123 },
      user: { id: "user-1" },
    },
    error: null,
  });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "ip:hash",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
  mockCreateChallenge.mockResolvedValue({ challenge_id: "challenge-1" });
  mockSendTwoFactorCode.mockResolvedValue(undefined);
  mockIsSmsConfigured.mockReturnValue(true);
  mockLogAudit.mockResolvedValue(undefined);
});

describe("POST /api/auth/login", () => {
  it("returns 400 on invalid login payload", async () => {
    mockLoginSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost({ email: "bad" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid login request" });
    expect(mockRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ error: "Too many attempts" });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("denies suspended accounts", async () => {
    mockUserMaybeSingle.mockResolvedValueOnce({
      data: {
        user_id: "user-1",
        failed_login_attempts: 0,
        last_failed_login: null,
        status: "suspended",
        two_factor_enabled: false,
        two_factor_method: null,
        login_count: 0,
      },
    });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Account suspended" });
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      "login",
      "user",
      "user-1",
      "denied",
      expect.objectContaining({ reason: "account_suspended" })
    );
  });

  it("denies locked accounts", async () => {
    mockUserMaybeSingle.mockResolvedValueOnce({
      data: {
        user_id: "user-1",
        failed_login_attempts: 5,
        last_failed_login: new Date().toISOString(),
        status: "active",
        two_factor_enabled: false,
        two_factor_method: null,
        login_count: 0,
      },
    });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Account locked" });
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      "login",
      "user",
      "user-1",
      "denied",
      expect.objectContaining({ reason: "account_locked" })
    );
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("allows login when lockout window has passed", async () => {
    const oldTimestamp = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    mockUserMaybeSingle.mockResolvedValueOnce({
      data: {
        user_id: "user-1",
        failed_login_attempts: 5,
        last_failed_login: oldTimestamp,
        status: "active",
        two_factor_enabled: false,
        two_factor_method: null,
        login_count: 0,
      },
    });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSignInWithPassword).toHaveBeenCalled();
  });

  it("allows login when lockout timestamp is missing", async () => {
    mockUserMaybeSingle.mockResolvedValueOnce({
      data: {
        user_id: "user-1",
        failed_login_attempts: 5,
        last_failed_login: null,
        status: "active",
        two_factor_enabled: false,
        two_factor_method: null,
        login_count: 0,
      },
    });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSignInWithPassword).toHaveBeenCalled();
  });

  it("returns replayed response when idempotency replays", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 200,
      body: { ok: true },
    });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("returns conflict when idempotency mismatches", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
  });

  it("returns in-progress when idempotency is pending", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
  });

  it("returns 401 on invalid credentials", async () => {
    mockUserMaybeSingle.mockResolvedValueOnce({
      data: {
        user_id: "user-1",
        failed_login_attempts: undefined,
        last_failed_login: null,
        status: "active",
        two_factor_enabled: false,
        two_factor_method: null,
        login_count: 0,
      },
    });
    mockSignInWithPassword.mockResolvedValueOnce({ data: { session: null, user: null }, error: { message: "Invalid" } });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid credentials" });
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        failed_login_attempts: 1,
      })
    );
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      "login",
      "user",
      "user-1",
      "failed",
      expect.objectContaining({ reason: "invalid_credentials" })
    );
  });

  it("skips user update when user record is missing", async () => {
    mockUserMaybeSingle.mockResolvedValueOnce({ data: null });
    mockSignInWithPassword.mockResolvedValueOnce({ data: { session: null, user: null }, error: { message: "Invalid" } });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid credentials" });
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.anything(),
      null,
      "login",
      "user",
      null,
      "failed",
      expect.objectContaining({ reason: "invalid_credentials" })
    );
  });

  it("sets cookies and completes idempotency on success", async () => {
    mockUserMaybeSingle.mockResolvedValueOnce({
      data: {
        user_id: "user-1",
        failed_login_attempts: 0,
        last_failed_login: null,
        status: "active",
        two_factor_enabled: false,
        two_factor_method: null,
        login_count: null,
      },
    });
    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSetSessionCookies).toHaveBeenCalledWith(response, expect.anything());
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        login_count: 1,
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

  it("returns mfa response and completes idempotency", async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: {
        role: "admin",
        two_factor_enabled: true,
        two_factor_method: "sms",
        phone: "+15145551234",
      },
    });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mfaRequired: true, challengeId: "challenge-1" });
    expect(mockSendTwoFactorCode).toHaveBeenCalled();
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "ip:hash",
      "hash-1",
      { mfaRequired: true, challengeId: "challenge-1" },
      200
    );
  });

  it("uses default 2FA method when missing", async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: {
        role: "admin",
        two_factor_enabled: true,
        two_factor_method: null,
        phone: "+15145551234",
      },
    });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mfaRequired: true, challengeId: "challenge-1" });
    expect(mockCreateChallenge).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ method: "sms" })
    );
  });

  it("rejects SMS 2FA without phone", async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: {
        role: "admin",
        two_factor_enabled: true,
        two_factor_method: "sms",
        phone: null,
      },
    });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "SMS 2FA requires a phone number" });
    expect(mockCreateChallenge).not.toHaveBeenCalled();
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });

  it("rejects SMS 2FA when not configured", async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: {
        role: "admin",
        two_factor_enabled: true,
        two_factor_method: "sms",
        phone: "+15145551234",
      },
    });
    mockIsSmsConfigured.mockReturnValueOnce(false);

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "SMS 2FA is not configured" });
    expect(mockCreateChallenge).not.toHaveBeenCalled();
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });

  it("returns 500 when challenge creation fails", async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: {
        role: "admin",
        two_factor_enabled: true,
        two_factor_method: "sms",
        phone: "+15145551234",
      },
    });
    mockCreateChallenge.mockRejectedValueOnce(new Error("boom"));

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Unable to send verification code" });
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });

  it("stores null session fields when ip or tokens are missing", async () => {
    mockGetRequestIp.mockReturnValueOnce("unknown");
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        session: { access_token: "", refresh_token: "", expires_at: null },
        user: { id: "user-1" },
      },
      error: null,
    });

    const response = await callPost({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockSessionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: null,
        token_hash: null,
        expires_at: null,
      })
    );
  });
});
