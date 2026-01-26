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

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  const type = params.type;
  const roles = type === "audit-log" ? ["admin"] : ["admin", "manager", "sales_rep", "technician"];
  const auth = await requireRole(request, roles);
  if ("response" in auth) {
    return auth.response;
  }
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");

  if (type === "dashboard") {
    const { data: jobs } = await client.from("jobs").select("estimated_revenue, status");
    const revenue = jobs?.reduce((sum, job) => sum + (job.estimated_revenue ?? 0), 0) ?? 0;
    return NextResponse.json({ data: { revenue, jobCount: jobs?.length ?? 0 } });
  }

  if (type === "revenue") {
    const { data } = await client.from("jobs").select("scheduled_date, estimated_revenue");
    return NextResponse.json({ data });
  }

  if (type === "technician") {
    const { data } = await client
      .from("jobs")
      .select("technician_id, estimated_revenue, status");
    return NextResponse.json({ data });
  }

  if (type === "commission") {
    const { data } = await client.from("employee_commissions").select("*");
    return NextResponse.json({ data });
  }

  if (type === "leads") {
    const { data } = await client.from("leads").select("*").order("created_at", { ascending: false });
    return NextResponse.json({ data });
  }

  if (type === "territories") {
    const { data } = await client
      .from("sales_territories")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json({ data });
  }

  if (type === "leaderboard") {
    const { data } = await client.from("leaderboard").select("*").order("rank", { ascending: true });
    return NextResponse.json({ data });
  }

  if (type === "payroll") {
    const { data } = await client
      .from("payroll_statements")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json({ data });
  }

  if (type === "checklists") {
    const { data } = await client
      .from("shift_checklists")
      .select("*")
      .order("work_date", { ascending: false });
    return NextResponse.json({ data });
  }

  if (type === "incidents") {
    const { data } = await client.from("incidents").select("*").order("created_at", { ascending: false });
    return NextResponse.json({ data });
  }

  if (type === "quality-issues") {
    const { data } = await client
      .from("job_quality_issues")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json({ data });
  }

  if (type === "quality") {
    const { data } = await client.from("job_quality_issues").select("*");
    return NextResponse.json({ data });
  }

  if (type === "export") {
    const { data } = await client.from("jobs").select("job_id, status, estimated_revenue");
    return NextResponse.json({ data });
  }

  if (type === "audit-log") {
    const { data } = await client.from("user_audit_log").select("*").order("created_at", { ascending: false });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Unsupported report" }, { status: 400 });
}

export async function POST(
  request: Request,
  { params }: { params: { type: string } }
) {
  const type = params.type;
  const roles = ["checklists", "incidents", "quality-issues"].includes(type)
    ? ["admin", "manager", "technician"]
    : ["admin", "manager", "sales_rep"];
  const auth = await requireRole(request, roles);
  if ("response" in auth) {
    return auth.response;
  }

  const { profile, user } = auth;
  const token = getAccessTokenFromRequest(request);
  const client = createUserClient(token ?? "");
  const body = await request.json().catch(() => null);

  if (type === "leads") {
    const parsed = leadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
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
      return NextResponse.json({ error: "Unable to create lead" }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (type === "territories") {
    const parsed = territoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid territory" }, { status: 400 });
    }
    const { error } = await client.from("sales_territories").insert({
      company_id: profile.company_id,
      sales_rep_id: parsed.data.salesRepId,
      territory_name: parsed.data.territoryName,
      neighborhoods: parsed.data.neighborhoods,
      polygon_coordinates: parsed.data.polygonCoordinates,
    });
    if (error) {
      return NextResponse.json({ error: "Unable to create territory" }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (type === "commission") {
    const parsed = commissionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid commission" }, { status: 400 });
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
      return NextResponse.json({ error: "Unable to create commission" }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (type === "payroll") {
    const parsed = payrollCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payroll" }, { status: 400 });
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
      return NextResponse.json({ error: "Unable to create payroll" }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (type === "checklists") {
    const parsed = checklistCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid checklist" }, { status: 400 });
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
      return NextResponse.json({ error: "Unable to create checklist" }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (type === "incidents") {
    const parsed = incidentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid incident" }, { status: 400 });
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
      return NextResponse.json({ error: "Unable to create incident" }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (type === "quality-issues") {
    const parsed = qualityIssueCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quality issue" }, { status: 400 });
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
      return NextResponse.json({ error: "Unable to create quality issue" }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  return NextResponse.json({ error: "Unsupported report" }, { status: 400 });
}
