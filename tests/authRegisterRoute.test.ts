import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { createAdminClient } from "@/lib/supabaseServer";
import { isSmsConfigured } from "@/lib/twilio";
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

const { mockIsSmsConfigured } = vi.hoisted(() => ({
  mockIsSmsConfigured: vi.fn(),
}));

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

const { mockRegisterSchema } = vi.hoisted(() => ({
  mockRegisterSchema: { safeParse: vi.fn() },
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

vi.mock("@/lib/twilio", () => ({
  isSmsConfigured: mockIsSmsConfigured,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/validators", () => ({
  registerSchema: mockRegisterSchema,
}));

const mockCompanySingle = vi.fn();
const mockCompanySelect = vi.fn(() => ({ single: mockCompanySingle }));
const mockCompanyInsert = vi.fn(() => ({ select: mockCompanySelect }));

const mockProfileInsert = vi.fn();

const mockCreateUser = vi.fn();

const mockAdminFrom = vi.fn((table: string) => {
  if (table === "companies") {
    return { insert: mockCompanyInsert };
  }
  if (table === "users") {
    return { insert: mockProfileInsert };
  }
  return { insert: mockProfileInsert };
});

function createRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/auth/register", {
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

  mockCreateAdminClient.mockReturnValue({
    from: mockAdminFrom,
    auth: { admin: { createUser: mockCreateUser } },
  });

  mockRateLimit.mockReturnValue({ allowed: true });
  mockGetRequestIp.mockReturnValue("203.0.113.10");

  mockRegisterSchema.safeParse.mockImplementation((body: { email?: string }) => ({
    success: true,
    data: {
      companyName: "Entretien",
      fullName: "Jean Dupont",
      email: body?.email ?? "test@example.com",
      phone: "+15145551234",
      password: "Password123!",
    },
  }));

  mockCompanySingle.mockResolvedValue({ data: { company_id: "company-1" }, error: null });
  mockCreateUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mockProfileInsert.mockResolvedValue({ error: null });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "ip:hash",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
  mockIsSmsConfigured.mockReturnValue(true);
  mockLogAudit.mockResolvedValue(undefined);
});

describe("POST /api/auth/register", () => {
  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false });

    const response = await callPost({});

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Trop de tentatives. Réessayez plus tard.",
    });
  });

  it("returns 400 on invalid payload", async () => {
    mockRegisterSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost({});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid registration" });
  });

  it("returns replayed response when idempotency replays", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 200,
      body: { ok: true },
    });

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockCompanyInsert).not.toHaveBeenCalled();
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

  it("returns 400 when company insert fails", async () => {
    mockCompanySingle.mockResolvedValueOnce({ data: null, error: { message: "fail" } });

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create company" });
  });

  it("returns 400 when user creation fails", async () => {
    mockCreateUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "fail" } });

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create user" });
  });

  it("returns 400 when profile insert fails", async () => {
    mockProfileInsert.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to store profile" });
  });

  it("creates admin profile with SMS 2FA enabled when configured", async () => {
    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, success: true });
    expect(mockProfileInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        two_factor_enabled: true,
        two_factor_method: "sms",
      })
    );
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "ip:hash",
      "hash-1",
      expect.objectContaining({ ok: true, success: true }),
      200
    );
  });

  it("creates admin profile without SMS when not configured", async () => {
    mockIsSmsConfigured.mockReturnValueOnce(false);

    const response = await callPost({ email: "test@example.com" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, success: true });
    expect(mockProfileInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        two_factor_enabled: false,
        two_factor_method: "authenticator",
      })
    );
  });
});
