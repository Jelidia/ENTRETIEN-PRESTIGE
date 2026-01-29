import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/change-password/route";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { getAccessTokenFromRequest } from "@/lib/session";
import { createAdminClient, createAnonClient, createUserClient } from "@/lib/supabaseServer";

const { mockRequireUser } = vi.hoisted(() => ({
  mockRequireUser: vi.fn(),
}));

const { mockCreateAnonClient, mockCreateUserClient, mockCreateAdminClient } = vi.hoisted(() => ({
  mockCreateAnonClient: vi.fn(),
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

const { mockChangePasswordSchema } = vi.hoisted(() => ({
  mockChangePasswordSchema: { safeParse: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/supabaseServer", () => ({
  createAnonClient: mockCreateAnonClient,
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

vi.mock("@/lib/validators", () => ({
  changePasswordSchema: mockChangePasswordSchema,
}));

const mockUpdateUser = vi.fn();
const mockSignInWithPassword = vi.fn();

const defaultBody = {
  currentPassword: "OldPass123!",
  newPassword: "NewPass123!",
  confirmPassword: "NewPass123!",
};

function createRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/auth/change-password", {
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

  mockRequireUser.mockResolvedValue({
    user: { id: "user-123" },
    profile: { email: "test@example.com" },
  });

  mockCreateAnonClient.mockReturnValue({
    auth: { signInWithPassword: mockSignInWithPassword },
  });

  mockCreateUserClient.mockReturnValue({
    auth: { updateUser: mockUpdateUser },
  });

  mockCreateAdminClient.mockReturnValue({});
  mockGetAccessTokenFromRequest.mockReturnValue("access-token");
  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");
  mockLogAudit.mockResolvedValue(undefined);
  mockChangePasswordSchema.safeParse.mockImplementation((body: { currentPassword?: string; newPassword?: string }) => ({
    success: true,
    data: {
      currentPassword: body?.currentPassword ?? "",
      newPassword: body?.newPassword ?? "",
    },
  }));

  mockSignInWithPassword.mockResolvedValue({ error: null });
  mockUpdateUser.mockResolvedValue({ error: null });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "user:user-123",
    requestHash: "hash-123",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
});

describe("POST /api/auth/change-password", () => {
  it("returns 400 when payload is invalid", async () => {
    mockChangePasswordSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });
    const response = await callPost({
      currentPassword: "",
      newPassword: "weak",
      confirmPassword: "weak",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "Données invalides" });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("returns early when auth fails", async () => {
    mockRequireUser.mockResolvedValueOnce({
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    });

    const response = await callPost(defaultBody);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost(defaultBody);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Trop de tentatives. Réessayez plus tard.",
    });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("rejects when current password is incorrect", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: "Invalid" } });

    const response = await callPost(defaultBody);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Mot de passe actuel incorrect" });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
  it("returns replayed response when idempotency replayed", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 200,
      body: { success: true },
    });

    const response = await callPost(defaultBody);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("returns conflict when idempotency key mismatches", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const response = await callPost(defaultBody);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("returns in-progress when request already running", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const response = await callPost(defaultBody);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("updates password and completes idempotency", async () => {
    const response = await callPost(defaultBody);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockSignInWithPassword).toHaveBeenCalled();
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: defaultBody.newPassword });
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "user:user-123",
      "hash-123",
      { success: true },
      200
    );
  });

  it("uses empty token when access token is missing", async () => {
    mockGetAccessTokenFromRequest.mockReturnValueOnce(null);

    const response = await callPost(defaultBody);

    expect(response.status).toBe(200);
    expect(mockCreateUserClient).toHaveBeenCalledWith("");
  });

  it("returns 500 when update fails", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: { message: "Failed" } });

    const response = await callPost(defaultBody);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Impossible de mettre à jour le mot de passe",
    });
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });
});
