import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/invoices/[id]/[action]/route";
import { requirePermission } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { generateInvoicePdf } from "@/lib/pdf";

const { mockRequirePermission } = vi.hoisted(() => ({
  mockRequirePermission: vi.fn(),
}));

const { mockCreateUserClient } = vi.hoisted(() => ({
  mockCreateUserClient: vi.fn(),
}));

const { mockGetAccessTokenFromRequest } = vi.hoisted(() => ({
  mockGetAccessTokenFromRequest: vi.fn(),
}));

const { mockGenerateInvoicePdf } = vi.hoisted(() => ({
  mockGenerateInvoicePdf: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/supabaseServer", () => ({
  createUserClient: mockCreateUserClient,
}));

vi.mock("@/lib/session", () => ({
  getAccessTokenFromRequest: mockGetAccessTokenFromRequest,
}));

vi.mock("@/lib/pdf", () => ({
  generateInvoicePdf: mockGenerateInvoicePdf,
}));

let selectQuery = "";
let invoiceData: Record<string, unknown> = {};

const query = {
  select: vi.fn((value: string) => {
    selectQuery = value;
    return query;
  }),
  eq: vi.fn(() => query),
  single: vi.fn(() => Promise.resolve({ data: invoiceData, error: null })),
};

const mockFrom = vi.fn(() => query);

function createRequest() {
  return new Request("https://example.com/api/invoices/inv-1/pdf");
}

beforeEach(() => {
  vi.clearAllMocks();
  selectQuery = "";

  invoiceData = {
    invoice_id: "inv-1",
    invoice_number: "INV-100",
    issued_date: "2025-01-15T12:00:00.000Z",
    due_date: "2025-01-31",
    subtotal: 100,
    total_amount: 114.98,
    notes: "Merci!",
    customers: {
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean@example.com",
      phone: "555-0101",
      address: "123 Rue Test",
      city: "Montreal",
      province: "QC",
      postal_code: "H1H1H1",
    },
    companies: {
      name: "Entretien Prestige",
      email: "info@example.com",
      phone: "555-0102",
      address: "456 Rue Service",
      city: "Montreal",
      province: "QC",
      postal_code: "H2H2H2",
      gst_number: "GST123",
      qst_number: "QST456",
    },
  };

  mockRequirePermission.mockResolvedValue({ user: { id: "user-1" } });
  mockGetAccessTokenFromRequest.mockReturnValue("token-1");
  mockCreateUserClient.mockReturnValue({ from: mockFrom });
  mockGenerateInvoicePdf.mockResolvedValue(new Uint8Array([1, 2, 3]));
});

describe("GET /api/invoices/[id]/pdf", () => {
  it("returns a PDF and uses issued_date for the invoice date", async () => {
    const response = await GET(createRequest(), {
      params: { id: "inv-1", action: "pdf" },
    });

    if (!response) {
      throw new Error("No response returned from handler");
    }

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(selectQuery).toContain("issued_date");
    expect(selectQuery).not.toContain("invoice_date");

    expect(mockGenerateInvoicePdf).toHaveBeenCalledTimes(1);
    const payload = mockGenerateInvoicePdf.mock.calls[0]?.[0];
    expect(payload.invoiceDate).toBe("2025-01-15");
    expect(payload.gst_amount).toBeUndefined();
    expect(payload.qst_amount).toBeUndefined();
  });
});
