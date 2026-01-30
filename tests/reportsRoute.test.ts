import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/reports/[type]/route";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

const { mockRequireRole } = vi.hoisted(() => ({
  mockRequireRole: vi.fn(),
}));

const { mockCreateUserClient } = vi.hoisted(() => ({
  mockCreateUserClient: vi.fn(),
}));

const { mockBeginIdempotency, mockCompleteIdempotency } = vi.hoisted(() => ({
  mockBeginIdempotency: vi.fn(),
  mockCompleteIdempotency: vi.fn(),
}));

const { mockGetAccessTokenFromRequest } = vi.hoisted(() => ({
  mockGetAccessTokenFromRequest: vi.fn(),
}));

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

const { mockLeadCreateSchema } = vi.hoisted(() => ({
  mockLeadCreateSchema: { safeParse: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  requireRole: mockRequireRole,
}));

vi.mock("@/lib/supabaseServer", () => ({
  createUserClient: mockCreateUserClient,
}));

vi.mock("@/lib/idempotency", () => ({
  beginIdempotency: mockBeginIdempotency,
  completeIdempotency: mockCompleteIdempotency,
}));

vi.mock("@/lib/session", () => ({
  getAccessTokenFromRequest: mockGetAccessTokenFromRequest,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/validators", () => ({
  leadCreateSchema: mockLeadCreateSchema,
}));

const mockLeadInsert = vi.fn();
const mockClientFrom = vi.fn((table: string) => {
  if (table === "leads") {
    return { insert: mockLeadInsert };
  }
  return { insert: mockLeadInsert };
});

function createRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/reports/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callPost(body: Record<string, unknown>) {
  const response = await POST(createRequest(body), { params: { type: "leads" } });
  if (!response) {
    throw new Error("No response returned from handler");
  }
  return response;
}

beforeEach(() => {
  vi.clearAllMocks();

  mockRequireRole.mockResolvedValue({
    profile: { user_id: "user-1", company_id: "company-1" },
    user: { id: "user-1" },
  });

  mockGetAccessTokenFromRequest.mockReturnValue("token");
  mockCreateUserClient.mockReturnValue({ from: mockClientFrom });

  mockLeadCreateSchema.safeParse.mockImplementation((body: { firstName?: string; lastName?: string }) => ({
    success: true,
    data: {
      firstName: body?.firstName ?? "Jean",
      lastName: body?.lastName ?? "Dupont",
      phone: "+15145551234",
      email: "test@example.com",
      address: "123 Rue Test",
      city: "Montreal",
      postalCode: "H1H1H1",
      estimatedJobValue: 250,
      followUpDate: "2026-02-01",
      status: "new",
      notes: "Notes",
      salesRepId: "user-1",
    },
  }));

  mockLeadInsert.mockResolvedValue({ error: null });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "user:user-1",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
  mockLogAudit.mockResolvedValue(undefined);
});

describe("POST /api/reports/[type]", () => {
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
    expect(mockBeginIdempotency).not.toHaveBeenCalled();
  });

  it("returns replayed response when idempotency replays", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 201,
      body: { ok: true },
    });

    const response = await callPost({ firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockLeadInsert).not.toHaveBeenCalled();
  });

  it("returns conflict when idempotency mismatches", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const response = await callPost({ firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
  });

  it("returns in-progress when idempotency is pending", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const response = await callPost({ firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
  });

  it("returns 400 when lead validation fails", async () => {
    mockLeadCreateSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost({});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid lead" });
    expect(mockLeadInsert).not.toHaveBeenCalled();
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });

  it("returns 400 when insert fails", async () => {
    mockLeadInsert.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost({ firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create lead" });
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });

  it("creates lead and completes idempotency", async () => {
    const response = await callPost({ firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockLeadInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        sales_rep_id: "user-1",
        first_name: "Jean",
        last_name: "Dupont",
      })
    );
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "user:user-1",
      "hash-1",
      { ok: true },
      201
    );
  });
});
