import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/uploads/route";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";
import { getRequestIp } from "@/lib/rateLimit";
import { createAdminClient } from "@/lib/supabaseServer";

const { mockRequireRole } = vi.hoisted(() => ({
  mockRequireRole: vi.fn(),
}));

const { mockCreateAdminClient } = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(),
}));

const { mockLogAudit } = vi.hoisted(() => ({
  mockLogAudit: vi.fn(),
}));

const { mockBeginIdempotency, mockCompleteIdempotency } = vi.hoisted(() => ({
  mockBeginIdempotency: vi.fn(),
  mockCompleteIdempotency: vi.fn(),
}));

const { mockGetRequestIp } = vi.hoisted(() => ({
  mockGetRequestIp: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireRole: mockRequireRole,
}));

vi.mock("@/lib/supabaseServer", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/idempotency", () => ({
  beginIdempotency: mockBeginIdempotency,
  completeIdempotency: mockCompleteIdempotency,
}));

vi.mock("@/lib/rateLimit", () => ({
  getRequestIp: mockGetRequestIp,
}));

let createBucketError: { message: string } | null = null;
let uploadError: { message: string } | null = null;
let updateError: { message: string } | null = null;

const mockCreateBucket = vi.fn(async () => ({ error: createBucketError }));
const mockUpload = vi.fn(async () => ({ error: uploadError }));
const mockStorageFrom = vi.fn(() => ({ upload: mockUpload }));

const updateQuery = {
  update: vi.fn(() => updateQuery),
  eq: vi.fn(() => updateQuery),
  then: (resolve: (value: { error: { message: string } | null }) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve({ error: updateError }).then(resolve, reject),
  catch: (reject: (reason: unknown) => unknown) => Promise.resolve({ error: updateError }).catch(reject),
};

const mockFrom = vi.fn(() => updateQuery);

function createTestFile(name: string, type: string) {
  const file = new File(["data"], name, { type });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new ArrayBuffer(4),
  });
  return file;
}

function createUploadRequest(options?: {
  userId?: string;
  docType?: string;
  file?: File;
  headers?: HeadersInit;
}) {
  const formData = new FormData();
  if (options?.userId) {
    formData.append("userId", options.userId);
  }
  if (options?.docType) {
    formData.append("docType", options.docType);
  }
  if (options?.file) {
    formData.append("file", options.file);
  }

  const headers = new Headers(options?.headers);
  return {
    formData: async () => formData,
    headers,
    url: "https://example.com/api/uploads",
  } as Request;
}

async function callPost(options?: Parameters<typeof createUploadRequest>[0]) {
  const response = await POST(createUploadRequest(options));
  if (!response) {
    throw new Error("No response returned from handler");
  }
  return response;
}

beforeEach(() => {
  vi.clearAllMocks();

  createBucketError = null;
  uploadError = null;
  updateError = null;

  mockRequireRole.mockResolvedValue({
    profile: { user_id: "admin-1", company_id: "company-1" },
    user: { id: "admin-1" },
  });

  mockCreateAdminClient.mockReturnValue({
    storage: {
      createBucket: mockCreateBucket,
      from: mockStorageFrom,
    },
    from: mockFrom,
  });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "scope-1",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
  mockLogAudit.mockResolvedValue(undefined);
  mockGetRequestIp.mockReturnValue("127.0.0.1");
});

describe("POST /api/uploads", () => {
  it("returns early when auth fails", async () => {
    mockRequireRole.mockResolvedValueOnce({
      response: new Response("Unauthorized", { status: 401 }),
    });

    const response = await callPost();
    expect(response.status).toBe(401);
  });

  it("returns 400 when upload payload is missing", async () => {
    const response = await callPost({ userId: "user-1" });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid upload request" });
  });

  it("returns 400 when user id is missing", async () => {
    const file = createTestFile("id.png", "image/png");
    const response = await callPost({ docType: "id_front", file });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid upload request" });
  });

  it("returns 400 for unsupported document type", async () => {
    const file = createTestFile("test.pdf", "application/pdf");
    const response = await callPost({ userId: "user-1", docType: "unknown", file });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unsupported document type" });
  });

  it("replays idempotency response when available", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({
      action: "replay",
      status: 201,
      body: { ok: true, path: "cached", field: "id_document_front_url" },
    });

    const file = createTestFile("id.png", "image/png");
    const response = await callPost({
      userId: "user-1",
      docType: "id_front",
      file,
      headers: { "Idempotency-Key": "key-1" },
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      path: "cached",
      field: "id_document_front_url",
    });
    expect(mockCreateBucket).not.toHaveBeenCalled();
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });

  it("returns 409 when idempotency detects conflict", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const file = createTestFile("id.png", "image/png");
    const response = await callPost({ userId: "user-1", docType: "id_front", file });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
    expect(mockCreateBucket).not.toHaveBeenCalled();
  });

  it("returns 409 when idempotency is already processing", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const file = createTestFile("id.png", "image/png");
    const response = await callPost({ userId: "user-1", docType: "id_front", file });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
    expect(mockCreateBucket).not.toHaveBeenCalled();
  });

  it("returns 500 when bucket creation fails", async () => {
    createBucketError = { message: "boom" };

    const file = createTestFile("id.png", "image/png");
    const response = await callPost({ userId: "user-1", docType: "id_front", file });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Unable to prepare storage" });
  });

  it("returns 500 when upload fails", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    uploadError = { message: "upload failed" };

    const file = createTestFile("", "");
    const response = await callPost({ userId: "user-1", docType: "id_front", file });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Unable to upload file" });
    expect(mockUpload).toHaveBeenCalledWith(
      "company-1/user-1/id_front/1700000000000-document",
      expect.any(Buffer),
      expect.objectContaining({ contentType: "application/octet-stream", upsert: true })
    );
    nowSpy.mockRestore();
  });

  it("returns 400 when user update fails", async () => {
    updateError = { message: "update failed" };

    const file = createTestFile("id.png", "image/png");
    const response = await callPost({ userId: "user-1", docType: "id_front", file });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to update user" });
  });

  it("uploads signature document and completes idempotency", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    createBucketError = { message: "Already exists" };

    const file = createTestFile("signature.png", "image/png");
    const response = await callPost({ userId: "user-1", docType: "signature", file });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      path: "company-1/user-1/signature/1700000000000-signature.png",
      field: "contract_signature_url",
    });

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        contract_signature_url: "company-1/user-1/signature/1700000000000-signature.png",
        contract_signed_at: expect.any(String),
      })
    );

    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ url: "https://example.com/api/uploads" }),
      "scope-1",
      "hash-1",
      {
        ok: true,
        path: "company-1/user-1/signature/1700000000000-signature.png",
        field: "contract_signature_url",
      },
      200
    );

    nowSpy.mockRestore();
  });
});
