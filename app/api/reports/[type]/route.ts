import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createUserClient } from "@/lib/supabaseServer";
import { getAccessTokenFromRequest } from "@/lib/session";
import {
  checklistCreateSchema,
  commissionCreateSchema,
  incidentCreateSchema,
  leadCreateSchema,
  payrollCreateSchema,
  qualityIssueCreateSchema,
  territoryCreateSchema,
} from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/rateLimit";
import { beginIdempotency, completeIdempotency } from "@/lib/idempotency";

function toCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (text.includes("\n") || text.includes(",") || text.includes("\"")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  const type = params.type;
  const roles = type === "audit-log" ? ["admin"] : ["admin", "manager", "sales_rep", "technician"];
  const auth = await requireRole(request, roles, "reports");
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  if (type === "dashboard") {
    const { data: jobs } = await client.from("jobs").select("estimated_revenue, status");
    const revenue = jobs?.reduce((sum, job) => sum + (job.estimated_revenue ?? 0), 0) ?? 0;
    return NextResponse.json({ success: true, data: { revenue, jobCount: jobs?.length ?? 0 } });
  }

  if (type === "revenue") {
    const { data } = await client.from("jobs").select("scheduled_date, estimated_revenue");
    return NextResponse.json({ success: true, data });
  }

  if (type === "technician") {
    const { data } = await client
      .from("jobs")
      .select("technician_id, estimated_revenue, status");
    return NextResponse.json({ success: true, data });
  }

  if (type === "commission") {
    const { data } = await client.from("employee_commissions").select("*");
    return NextResponse.json({ success: true, data });
  }

  if (type === "leads") {
    const { data } = await client.from("leads").select("*").order("created_at", { ascending: false });
    return NextResponse.json({ success: true, data });
  }

  if (type === "territories") {
    const { data } = await client
      .from("sales_territories")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json({ success: true, data });
  }

  if (type === "leaderboard") {
    const { data } = await client.from("leaderboard").select("*").order("rank", { ascending: true });
    return NextResponse.json({ success: true, data });
  }

  if (type === "payroll") {
    const { data } = await client
      .from("payroll_statements")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json({ success: true, data });
  }

  if (type === "checklists") {
    const { data } = await client
      .from("shift_checklists")
      .select("*")
      .order("work_date", { ascending: false });
    return NextResponse.json({ success: true, data });
  }

  if (type === "incidents") {
    const { data } = await client.from("incidents").select("*").order("created_at", { ascending: false });
    return NextResponse.json({ success: true, data });
  }

  if (type === "quality-issues") {
    const { data } = await client
      .from("job_quality_issues")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json({ success: true, data });
  }

  if (type === "quality") {
    const { data } = await client.from("job_quality_issues").select("*");
    return NextResponse.json({ success: true, data });
  }

  if (type === "export") {
    const { data } = await client.from("jobs").select("job_id, status, estimated_revenue");
    return NextResponse.json({ success: true, data });
  }

  if (type === "audit-log") {
    const url = new URL(request.url);
    const action = url.searchParams.get("action")?.trim();
    const status = url.searchParams.get("status")?.trim();
    const userId = url.searchParams.get("userId")?.trim();
    const from = url.searchParams.get("from")?.trim();
    const to = url.searchParams.get("to")?.trim();
    const format = url.searchParams.get("format");

    let query = client.from("user_audit_log").select("*").order("created_at", { ascending: false });
    if (action) {
      query = query.ilike("action", `%${action}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lte("created_at", to);
    }

    const { data } = await query;

    if (format === "csv") {
      const header = [
        "audit_id",
        "user_id",
        "action",
        "resource_type",
        "resource_id",
        "status",
        "reason",
        "created_at",
        "ip_address",
        "user_agent",
      ];
      const rows = (data ?? []).map((entry) =>
        [
          entry.audit_id,
          entry.user_id,
          entry.action,
          entry.resource_type,
          entry.resource_id,
          entry.status,
          entry.reason,
          entry.created_at,
          entry.ip_address,
          entry.user_agent,
        ]
          .map(toCsvValue)
          .join(",")
      );
      const csv = [header.join(","), ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=audits.csv",
        },
      });
    }

    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: false, error: "Unsupported report" }, { status: 400 });
}

export async function POST(
  request: Request,
  { params }: { params: { type: string } }
) {
  const type = params.type;
  const roles = ["checklists", "incidents", "quality-issues"].includes(type)
    ? ["admin", "manager", "technician"]
    : ["admin", "manager", "sales_rep"];
  const auth = await requireRole(request, roles, "reports");
  if ("response" in auth) {
    return auth.response;
  }

  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const body = await request.json().catch(() => null);
  const ip = getRequestIp(request);
  const idempotency = await beginIdempotency(client, request, profile.user_id, {
    action: `report_${type}_create`,
  });
  if (idempotency.action === "replay") {
    return NextResponse.json(idempotency.body, { status: idempotency.status });
  }
  if (idempotency.action === "conflict") {
    return NextResponse.json({ success: false, error: "Idempotency key conflict" }, { status: 409 });
  }
  if (idempotency.action === "in_progress") {
    return NextResponse.json({ success: false, error: "Request already in progress" }, { status: 409 });
  }

  const respondCreated = async () => {
    const responseBody = { success: true, data: { ok: true }, ok: true };
    await completeIdempotency(client, request, idempotency.scope, idempotency.requestHash, responseBody, 201);
    return NextResponse.json(responseBody, { status: 201 });
  };

  if (type === "leads") {
    const parsed = leadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid lead" }, { status: 400 });
    }
    const { error } = await client.from("leads").insert({
      company_id: profile.company_id,
      sales_rep_id: parsed.data.salesRepId ?? user.id,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      city: parsed.data.city,
      postal_code: parsed.data.postalCode,
      estimated_job_value: parsed.data.estimatedJobValue,
      follow_up_date: parsed.data.followUpDate,
      status: parsed.data.status ?? "new",
      notes: parsed.data.notes,
    });
    if (error) {
      return NextResponse.json({ success: false, error: "Unable to create lead" }, { status: 400 });
    }
    await logAudit(client, profile.user_id, "report_lead_create", "lead", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { status: parsed.data.status ?? "new" },
    });
    return await respondCreated();
  }

  if (type === "territories") {
    const parsed = territoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid territory" }, { status: 400 });
    }
    const { error } = await client.from("sales_territories").insert({
      company_id: profile.company_id,
      sales_rep_id: parsed.data.salesRepId,
      territory_name: parsed.data.territoryName,
      neighborhoods: parsed.data.neighborhoods,
      polygon_coordinates: parsed.data.polygonCoordinates,
    });
    if (error) {
      return NextResponse.json({ success: false, error: "Unable to create territory" }, { status: 400 });
    }
    await logAudit(client, profile.user_id, "report_territory_create", "territory", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { sales_rep_id: parsed.data.salesRepId },
    });
    return await respondCreated();
  }

  if (type === "commission") {
    const parsed = commissionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid commission" }, { status: 400 });
    }
    const estimated =
      parsed.data.estimatedCommission ??
      Math.round((parsed.data.servicePrice * parsed.data.commissionRate) / 100);
    const { error } = await client.from("employee_commissions").insert({
      company_id: profile.company_id,
      employee_id: parsed.data.employeeId,
      job_id: parsed.data.jobId,
      service_price: parsed.data.servicePrice,
      commission_rate: parsed.data.commissionRate,
      estimated_commission: estimated,
      status: "estimated",
    });
    if (error) {
      return NextResponse.json({ success: false, error: "Unable to create commission" }, { status: 400 });
    }
    await logAudit(client, profile.user_id, "report_commission_create", "commission", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { employee_id: parsed.data.employeeId, job_id: parsed.data.jobId },
    });
    return await respondCreated();
  }

  if (type === "payroll") {
    const parsed = payrollCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payroll" }, { status: 400 });
    }
    const { error } = await client.from("payroll_statements").insert({
      company_id: profile.company_id,
      employee_id: parsed.data.employeeId,
      year: parsed.data.year,
      month: parsed.data.month,
      base_salary: parsed.data.baseSalary,
      commission_confirmed: parsed.data.commissionConfirmed,
      deductions: parsed.data.deductions,
      net_pay: parsed.data.netPay,
      jobs_completed: parsed.data.jobsCompleted,
      total_revenue: parsed.data.totalRevenue,
    });
    if (error) {
      return NextResponse.json({ success: false, error: "Unable to create payroll" }, { status: 400 });
    }
    await logAudit(client, profile.user_id, "report_payroll_create", "payroll", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { employee_id: parsed.data.employeeId, year: parsed.data.year, month: parsed.data.month },
    });
    return await respondCreated();
  }

  if (type === "checklists") {
    const parsed = checklistCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid checklist" }, { status: 400 });
    }
    const { error } = await client.from("shift_checklists").insert({
      company_id: profile.company_id,
      technician_id: parsed.data.technicianId,
      work_date: parsed.data.workDate,
      start_checklist_completed: parsed.data.startCompleted,
      start_checklist_time: parsed.data.startTime,
      start_checklist_items: parsed.data.startItems,
      end_checklist_completed: parsed.data.endCompleted,
      end_checklist_time: parsed.data.endTime,
      end_checklist_items: parsed.data.endItems,
      shift_status: parsed.data.shiftStatus ?? "pending",
    });
    if (error) {
      return NextResponse.json({ success: false, error: "Unable to create checklist" }, { status: 400 });
    }
    await logAudit(client, profile.user_id, "report_checklist_create", "checklist", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { technician_id: parsed.data.technicianId, work_date: parsed.data.workDate },
    });
    return await respondCreated();
  }

  if (type === "incidents") {
    const parsed = incidentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid incident" }, { status: 400 });
    }
    const { error } = await client.from("incidents").insert({
      company_id: profile.company_id,
      technician_id: parsed.data.technicianId,
      job_id: parsed.data.jobId,
      description: parsed.data.description,
      incident_type: parsed.data.incidentType,
      severity: parsed.data.severity,
      estimated_cost: parsed.data.estimatedCost,
      report_date: new Date().toISOString(),
    });
    if (error) {
      return NextResponse.json({ success: false, error: "Unable to create incident" }, { status: 400 });
    }
    await logAudit(client, profile.user_id, "report_incident_create", "incident", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { job_id: parsed.data.jobId, incident_type: parsed.data.incidentType },
    });
    return await respondCreated();
  }

  if (type === "quality-issues") {
    const parsed = qualityIssueCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid quality issue" }, { status: 400 });
    }
    const { error } = await client.from("job_quality_issues").insert({
      company_id: profile.company_id,
      job_id: parsed.data.jobId,
      customer_id: parsed.data.customerId,
      complaint_type: parsed.data.complaintType,
      description: parsed.data.description,
      severity: parsed.data.severity,
      reported_by: parsed.data.reportedBy ?? user.id,
      reported_date: new Date().toISOString(),
    });
    if (error) {
      return NextResponse.json({ success: false, error: "Unable to create quality issue" }, { status: 400 });
    }
    await logAudit(client, profile.user_id, "report_quality_issue_create", "quality_issue", null, "success", {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? null,
      newValues: { job_id: parsed.data.jobId, complaint_type: parsed.data.complaintType },
    });
    return await respondCreated();
  }

  return NextResponse.json({ success: false, error: "Unsupported report" }, { status: 400 });
}
