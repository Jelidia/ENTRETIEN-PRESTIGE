import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/reports/[type]/route";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

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

const {
  mockLeadCreateSchema,
  mockTerritoryCreateSchema,
  mockCommissionCreateSchema,
  mockPayrollCreateSchema,
  mockChecklistCreateSchema,
  mockIncidentCreateSchema,
  mockQualityIssueCreateSchema,
} = vi.hoisted(() => ({
  mockLeadCreateSchema: { safeParse: vi.fn() },
  mockTerritoryCreateSchema: { safeParse: vi.fn() },
  mockCommissionCreateSchema: { safeParse: vi.fn() },
  mockPayrollCreateSchema: { safeParse: vi.fn() },
  mockChecklistCreateSchema: { safeParse: vi.fn() },
  mockIncidentCreateSchema: { safeParse: vi.fn() },
  mockQualityIssueCreateSchema: { safeParse: vi.fn() },
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
  territoryCreateSchema: mockTerritoryCreateSchema,
  commissionCreateSchema: mockCommissionCreateSchema,
  payrollCreateSchema: mockPayrollCreateSchema,
  checklistCreateSchema: mockChecklistCreateSchema,
  incidentCreateSchema: mockIncidentCreateSchema,
  qualityIssueCreateSchema: mockQualityIssueCreateSchema,
}));

const mockLeadInsert = vi.fn();
const mockTerritoryInsert = vi.fn();
const mockCommissionInsert = vi.fn();
const mockPayrollInsert = vi.fn();
const mockChecklistInsert = vi.fn();
const mockIncidentInsert = vi.fn();
const mockQualityInsert = vi.fn();

let tableData: Record<string, unknown> = {};
let tableQueries: Record<string, ReturnType<typeof createQuery>> = {};

function createQuery(data: unknown) {
  const query: {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    ilike: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    lte: ReturnType<typeof vi.fn>;
    insert?: ReturnType<typeof vi.fn>;
    then: (resolve: (value: { data: unknown }) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>;
    catch: (reject: (reason: unknown) => unknown) => Promise<unknown>;
  } = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    ilike: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve({ data }).then(resolve, reject),
    catch: (reject) => Promise.resolve({ data }).catch(reject),
  };

  return query;
}

const mockClientFrom = vi.fn((table: string) => {
  const query = createQuery(tableData[table]);
  const inserts: Record<string, ReturnType<typeof vi.fn>> = {
    leads: mockLeadInsert,
    sales_territories: mockTerritoryInsert,
    employee_commissions: mockCommissionInsert,
    payroll_statements: mockPayrollInsert,
    shift_checklists: mockChecklistInsert,
    incidents: mockIncidentInsert,
    job_quality_issues: mockQualityInsert,
  };
  query.insert = inserts[table] ?? vi.fn().mockResolvedValue({ error: null });
  tableQueries[table] = query;
  return query;
});

function createGetRequest(type: string, search = "") {
  const url = `https://example.com/api/reports/${type}${search}`;
  return new Request(url, { method: "GET" });
}

async function callGet(type: string, search = "") {
  const response = await GET(createGetRequest(type, search), { params: { type } });
  if (!response) {
    throw new Error("No response returned from handler");
  }
  return response;
}

function createPostRequest(type: string, body: Record<string, unknown>) {
  return new Request(`https://example.com/api/reports/${type}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callPost(type: string, body: Record<string, unknown>) {
  const response = await POST(createPostRequest(type, body), { params: { type } });
  if (!response) {
    throw new Error("No response returned from handler");
  }
  return response;
}

beforeEach(() => {
  vi.clearAllMocks();

  tableData = {};
  tableQueries = {};

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

  mockTerritoryCreateSchema.safeParse.mockImplementation(() => ({
    success: true,
    data: {
      territoryName: "Nord",
      salesRepId: "user-1",
      neighborhoods: ["A"],
      polygonCoordinates: [],
    },
  }));

  mockCommissionCreateSchema.safeParse.mockImplementation(() => ({
    success: true,
    data: {
      employeeId: "emp-1",
      jobId: "job-1",
      servicePrice: 200,
      commissionRate: 10,
      estimatedCommission: undefined,
    },
  }));

  mockPayrollCreateSchema.safeParse.mockImplementation(() => ({
    success: true,
    data: {
      employeeId: "emp-1",
      year: 2026,
      month: 1,
      baseSalary: 1000,
      commissionConfirmed: 200,
      deductions: 50,
      netPay: 1150,
      jobsCompleted: 5,
      totalRevenue: 5000,
    },
  }));

  mockChecklistCreateSchema.safeParse.mockImplementation(() => ({
    success: true,
    data: {
      technicianId: "tech-1",
      workDate: "2026-02-01",
      startCompleted: true,
      startTime: "08:00",
      startItems: [],
      endCompleted: false,
      endTime: "17:00",
      endItems: [],
      shiftStatus: undefined,
    },
  }));

  mockIncidentCreateSchema.safeParse.mockImplementation(() => ({
    success: true,
    data: {
      technicianId: "tech-1",
      jobId: "job-1",
      description: "Incident",
      incidentType: "damage",
      severity: "high",
      estimatedCost: 100,
    },
  }));

  mockQualityIssueCreateSchema.safeParse.mockImplementation(() => ({
    success: true,
    data: {
      jobId: "job-1",
      customerId: "cust-1",
      complaintType: "quality",
      description: "Issue",
      severity: "low",
      reportedBy: undefined,
    },
  }));

  mockLeadInsert.mockResolvedValue({ error: null });
  mockTerritoryInsert.mockResolvedValue({ error: null });
  mockCommissionInsert.mockResolvedValue({ error: null });
  mockPayrollInsert.mockResolvedValue({ error: null });
  mockChecklistInsert.mockResolvedValue({ error: null });
  mockIncidentInsert.mockResolvedValue({ error: null });
  mockQualityInsert.mockResolvedValue({ error: null });

  mockBeginIdempotency.mockResolvedValue({
    action: "proceed",
    scope: "user:user-1",
    requestHash: "hash-1",
  });
  mockCompleteIdempotency.mockResolvedValue(undefined);
  mockLogAudit.mockResolvedValue(undefined);
});

describe("GET /api/reports/[type]", () => {
  it("returns auth response when role check fails", async () => {
    mockRequireRole.mockResolvedValueOnce({
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    });

    const response = await callGet("dashboard");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockCreateUserClient).not.toHaveBeenCalled();
  });

  it("returns dashboard stats with jobs data", async () => {
    tableData.jobs = [
      { estimated_revenue: 100 },
      { estimated_revenue: null },
    ];

    const response = await callGet("dashboard");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ data: { revenue: 100, jobCount: 2 } });
  });

  it("returns dashboard stats with no jobs", async () => {
    tableData.jobs = null;

    const response = await callGet("dashboard");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ data: { revenue: 0, jobCount: 0 } });
  });

  it("returns datasets for report types", async () => {
    tableData.jobs = [{ scheduled_date: "2026-01-01", estimated_revenue: 50 }];
    tableData.employee_commissions = [{ commission_id: "comm-1" }];
    tableData.leads = [{ lead_id: "lead-1" }];
    tableData.sales_territories = [{ territory_id: "terr-1" }];
    tableData.leaderboard = [{ rank: 1 }];
    tableData.payroll_statements = [{ payroll_id: "pay-1" }];
    tableData.shift_checklists = [{ checklist_id: "check-1" }];
    tableData.incidents = [{ incident_id: "inc-1" }];
    tableData.job_quality_issues = [{ issue_id: "issue-1" }];

    await expect((await callGet("revenue")).json()).resolves.toMatchObject({ data: tableData.jobs });
    await expect((await callGet("technician")).json()).resolves.toMatchObject({ data: tableData.jobs });
    await expect((await callGet("commission")).json()).resolves.toMatchObject({ data: tableData.employee_commissions });
    await expect((await callGet("leads")).json()).resolves.toMatchObject({ data: tableData.leads });
    await expect((await callGet("territories")).json()).resolves.toMatchObject({ data: tableData.sales_territories });
    await expect((await callGet("leaderboard")).json()).resolves.toMatchObject({ data: tableData.leaderboard });
    await expect((await callGet("payroll")).json()).resolves.toMatchObject({ data: tableData.payroll_statements });
    await expect((await callGet("checklists")).json()).resolves.toMatchObject({ data: tableData.shift_checklists });
    await expect((await callGet("incidents")).json()).resolves.toMatchObject({ data: tableData.incidents });
    await expect((await callGet("quality-issues")).json()).resolves.toMatchObject({ data: tableData.job_quality_issues });
    await expect((await callGet("quality")).json()).resolves.toMatchObject({ data: tableData.job_quality_issues });
    await expect((await callGet("export")).json()).resolves.toMatchObject({ data: tableData.jobs });
  });

  it("returns audit log csv with filters", async () => {
    tableData.user_audit_log = [
      {
        audit_id: "audit-1",
        user_id: null,
        action: "login",
        resource_type: "user",
        resource_id: "user-1",
        status: "success",
        reason: "bad \"quote\"",
        created_at: "2026-01-01",
        ip_address: "203.0.113.10",
        user_agent: "agent,with,comma",
      },
      {
        audit_id: "audit-2",
        user_id: "user-2",
        action: "logout",
        resource_type: "user",
        resource_id: "user-2",
        status: "failed",
        reason: "line\nbreak",
        created_at: "2026-01-02",
        ip_address: "203.0.113.11",
        user_agent: "agent",
      },
    ];

    const response = await callGet(
      "audit-log",
      "?action=login&status=success&userId=user-1&from=2026-01-01&to=2026-01-02&format=csv"
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("audit_id,user_id,action");
    expect(text).toMatch(/bad ""quote""/);
    expect(text).toContain("agent,with,comma");
    expect(text).toContain("line\nbreak");
    expect(tableQueries.user_audit_log.ilike).toHaveBeenCalledWith("action", "%login%");
    expect(tableQueries.user_audit_log.eq).toHaveBeenCalledWith("status", "success");
    expect(tableQueries.user_audit_log.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(tableQueries.user_audit_log.gte).toHaveBeenCalledWith("created_at", "2026-01-01");
    expect(tableQueries.user_audit_log.lte).toHaveBeenCalledWith("created_at", "2026-01-02");
  });

  it("returns audit log json without filters", async () => {
    tableData.user_audit_log = [];

    const response = await callGet("audit-log");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ data: [] });
  });

  it("returns audit log csv with no rows when data is null", async () => {
    tableData.user_audit_log = null;

    const response = await callGet("audit-log", "?format=csv");

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe(
      "audit_id,user_id,action,resource_type,resource_id,status,reason,created_at,ip_address,user_agent"
    );
  });

  it("returns unsupported report error", async () => {
    mockGetAccessTokenFromRequest.mockReturnValueOnce(null);

    const response = await callGet("unknown");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unsupported report" });
    expect(mockCreateUserClient).toHaveBeenCalledWith("");
  });
});

describe("POST /api/reports/[type]", () => {
  it("returns auth response when role check fails", async () => {
    mockRequireRole.mockResolvedValueOnce({
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    });

    const response = await callPost("leads", {});

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

    const response = await callPost("leads", { firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockLeadInsert).not.toHaveBeenCalled();
  });

  it("returns conflict when idempotency mismatches", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "conflict" });

    const response = await callPost("leads", { firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Idempotency key conflict" });
  });

  it("returns in-progress when idempotency is pending", async () => {
    mockBeginIdempotency.mockResolvedValueOnce({ action: "in_progress" });

    const response = await callPost("leads", { firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Request already in progress" });
  });

  it("returns 400 when lead validation fails", async () => {
    mockLeadCreateSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost("leads", {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid lead" });
    expect(mockLeadInsert).not.toHaveBeenCalled();
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });

  it("returns 400 when lead insert fails", async () => {
    mockLeadInsert.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost("leads", { firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create lead" });
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });

  it("creates lead with provided values", async () => {
    mockLeadCreateSchema.safeParse.mockReturnValueOnce({
      success: true,
      data: {
        firstName: "Jean",
        lastName: "Dupont",
        phone: "",
        email: "",
        address: "",
        city: "",
        postalCode: "",
        estimatedJobValue: undefined,
        followUpDate: undefined,
        status: "contacted",
        notes: "",
        salesRepId: "rep-2",
      },
    });

    const response = await callPost("leads", { firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockLeadInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        sales_rep_id: "rep-2",
        status: "contacted",
      })
    );
  });

  it("creates lead with defaults and completes idempotency", async () => {
    mockLeadCreateSchema.safeParse.mockReturnValueOnce({
      success: true,
      data: {
        firstName: "Jean",
        lastName: "Dupont",
        phone: "",
        email: "",
        address: "",
        city: "",
        postalCode: "",
        estimatedJobValue: undefined,
        followUpDate: undefined,
        status: undefined,
        notes: "",
        salesRepId: undefined,
      },
    });

    const response = await callPost("leads", { firstName: "Jean", lastName: "Dupont" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockLeadInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        sales_rep_id: "user-1",
        status: "new",
      })
    );
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockCompleteIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "user:user-1",
      "hash-1",
      expect.objectContaining({ ok: true, success: true }),
      201
    );
  });

  it("returns 400 when territory validation fails", async () => {
    mockTerritoryCreateSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost("territories", {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid territory" });
  });

  it("returns 400 when territory insert fails", async () => {
    mockTerritoryInsert.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost("territories", { territoryName: "Nord", salesRepId: "user-1" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create territory" });
  });

  it("creates territory", async () => {
    const response = await callPost("territories", { territoryName: "Nord", salesRepId: "user-1" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockTerritoryInsert).toHaveBeenCalled();
  });

  it("returns 400 when commission validation fails", async () => {
    mockCommissionCreateSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost("commission", {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid commission" });
  });

  it("returns 400 when commission insert fails", async () => {
    mockCommissionInsert.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost("commission", { employeeId: "emp-1", servicePrice: 200, commissionRate: 10 });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create commission" });
  });

  it("calculates estimated commission when missing", async () => {
    const response = await callPost("commission", { employeeId: "emp-1", servicePrice: 200, commissionRate: 10 });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockCommissionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        estimated_commission: 20,
      })
    );
  });

  it("uses provided estimated commission", async () => {
    mockCommissionCreateSchema.safeParse.mockReturnValueOnce({
      success: true,
      data: {
        employeeId: "emp-1",
        jobId: "job-1",
        servicePrice: 200,
        commissionRate: 10,
        estimatedCommission: 42,
      },
    });

    const response = await callPost("commission", { employeeId: "emp-1", servicePrice: 200, commissionRate: 10 });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockCommissionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        estimated_commission: 42,
      })
    );
  });

  it("returns 400 when payroll validation fails", async () => {
    mockPayrollCreateSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost("payroll", {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid payroll" });
  });

  it("returns 400 when payroll insert fails", async () => {
    mockPayrollInsert.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost("payroll", { employeeId: "emp-1", year: 2026, month: 1, baseSalary: 1000, netPay: 1150 });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create payroll" });
  });

  it("creates payroll", async () => {
    const response = await callPost("payroll", { employeeId: "emp-1", year: 2026, month: 1, baseSalary: 1000, netPay: 1150 });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockPayrollInsert).toHaveBeenCalled();
  });

  it("returns 400 when checklist validation fails", async () => {
    mockChecklistCreateSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost("checklists", {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid checklist" });
  });

  it("returns 400 when checklist insert fails", async () => {
    mockChecklistInsert.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost("checklists", { technicianId: "tech-1", workDate: "2026-02-01" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create checklist" });
  });

  it("creates checklist with default status", async () => {
    const response = await callPost("checklists", { technicianId: "tech-1", workDate: "2026-02-01" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockChecklistInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        shift_status: "pending",
      })
    );
  });

  it("returns 400 when incident validation fails", async () => {
    mockIncidentCreateSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost("incidents", {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid incident" });
  });

  it("returns 400 when incident insert fails", async () => {
    mockIncidentInsert.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost("incidents", { description: "Incident" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create incident" });
  });

  it("creates incident", async () => {
    const response = await callPost("incidents", { description: "Incident" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockIncidentInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        report_date: expect.any(String),
      })
    );
  });

  it("returns 400 when quality issue validation fails", async () => {
    mockQualityIssueCreateSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { format: () => ({}) },
    });

    const response = await callPost("quality-issues", {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid quality issue" });
  });

  it("returns 400 when quality issue insert fails", async () => {
    mockQualityInsert.mockResolvedValueOnce({ error: { message: "fail" } });

    const response = await callPost("quality-issues", { jobId: "job-1", customerId: "cust-1", complaintType: "quality", description: "Issue" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to create quality issue" });
  });

  it("creates quality issue with default reporter", async () => {
    const response = await callPost("quality-issues", { jobId: "job-1", customerId: "cust-1", complaintType: "quality", description: "Issue" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockQualityInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        reported_by: "user-1",
      })
    );
  });

  it("creates quality issue with provided reporter", async () => {
    mockQualityIssueCreateSchema.safeParse.mockReturnValueOnce({
      success: true,
      data: {
        jobId: "job-1",
        customerId: "cust-1",
        complaintType: "quality",
        description: "Issue",
        severity: "high",
        reportedBy: "rep-2",
      },
    });

    const response = await callPost("quality-issues", { jobId: "job-1", customerId: "cust-1", complaintType: "quality", description: "Issue" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockQualityInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        reported_by: "rep-2",
      })
    );
  });

  it("returns unsupported report error", async () => {
    mockGetAccessTokenFromRequest.mockReturnValueOnce(null);

    const response = await callPost("unknown", {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unsupported report" });
    expect(mockCompleteIdempotency).not.toHaveBeenCalled();
  });
});
