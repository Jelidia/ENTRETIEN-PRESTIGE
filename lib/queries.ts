import { getAccessTokenFromCookies } from "./session";
import { createUserClient } from "./supabaseServer";
import { buildDashboardData, formatDateKey } from "./dashboardMetrics";
import {
  customers as fallbackCustomers,
  dashboardKpis,
  dispatchBoard,
  incidents as fallbackIncidents,
  invoices as fallbackInvoices,
  jobs as fallbackJobs,
  leaderboard as fallbackLeaderboard,
  notifications as fallbackNotifications,
  qualityIssues as fallbackQuality,
  reportSummary,
  revenueBars,
  scheduleToday,
  technicianJobs,
} from "./data";

export async function getDashboardData() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return { kpis: dashboardKpis, revenueBars, scheduleToday };
  }

  const client = createUserClient(token);
  const { data: userData } = await client.auth.getUser();
  if (!userData?.user) {
    return { kpis: dashboardKpis, revenueBars, scheduleToday };
  }

  const { data: profile } = await client
    .from("users")
    .select("company_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!profile?.company_id) {
    return { kpis: dashboardKpis, revenueBars, scheduleToday };
  }

  const now = new Date();
  const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const rangeKey = formatDateKey(rangeStart);

  const { data: jobs, error: jobsError } = await client
    .from("jobs")
    .select(
      "job_id, customer_id, service_type, status, scheduled_date, scheduled_start_time, scheduled_end_time, estimated_revenue, actual_revenue"
    )
    .eq("company_id", profile.company_id)
    .gte("scheduled_date", rangeKey);

  const { data: customers, error: customersError } = await client
    .from("customers")
    .select("customer_id, first_name, last_name, status, average_rating")
    .eq("company_id", profile.company_id);

  if (jobsError || customersError || !jobs || !customers) {
    console.error("Failed to load dashboard data", {
      jobsError,
      customersError,
      companyId: profile.company_id,
    });
    return { kpis: dashboardKpis, revenueBars, scheduleToday };
  }

  return buildDashboardData({ jobs, customers, now });
}

export async function getDispatchBoard() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return dispatchBoard;
  }

  const client = createUserClient(token);
  const { data: technicians } = await client
    .from("users")
    .select("user_id, full_name")
    .eq("role", "technician")
    .limit(10);

  const { data: jobs } = await client
    .from("jobs")
    .select("job_id, technician_id, address, service_type, estimated_revenue, scheduled_start_time, status")
    .order("scheduled_date", { ascending: true })
    .limit(50);

  if (!technicians || !jobs) {
    return dispatchBoard;
  }

  return technicians.map((tech) => ({
    technician: tech.full_name,
    jobs: jobs
      .filter((job) => job.technician_id === tech.user_id)
      .map((job) => ({
        id: job.job_id,
        time: job.scheduled_start_time ?? "",
        address: job.address ?? "",
        service: job.service_type ?? "",
        price: job.estimated_revenue ? `$${job.estimated_revenue}` : "",
        status: job.status ?? "",
      })),
  }));
}

export async function getJobs() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return fallbackJobs;
  }

  const client = createUserClient(token);
  const { data } = await client
    .from("jobs")
    .select("job_id, service_type, status, scheduled_date, estimated_revenue")
    .order("scheduled_date", { ascending: true });

  if (!data) {
    return fallbackJobs;
  }

  return data.map((job) => ({
    id: job.job_id,
    customer: "",
    service: job.service_type ?? "",
    date: job.scheduled_date ?? "",
    status: job.status ?? "",
    revenue: job.estimated_revenue ? `$${job.estimated_revenue}` : "",
  }));
}

export async function getCustomers() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return fallbackCustomers;
  }

  const client = createUserClient(token);
  const { data } = await client
    .from("customers")
    .select("customer_id, first_name, last_name, status, customer_type, last_service_date, account_balance")
    .limit(100);

  if (!data) {
    return fallbackCustomers;
  }

  return data.map((customer) => ({
    id: customer.customer_id,
    name: `${customer.first_name} ${customer.last_name}`,
    type: customer.customer_type ?? "",
    status: customer.status ?? "",
    lastService: customer.last_service_date ?? "",
    balance: customer.account_balance ? `$${customer.account_balance}` : "$0",
  }));
}

export async function getInvoices() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return fallbackInvoices;
  }

  const client = createUserClient(token);
  const { data } = await client
    .from("invoices")
    .select("invoice_number, payment_status, total_amount, due_date")
    .limit(100);

  if (!data) {
    return fallbackInvoices;
  }

  return data.map((invoice) => ({
    number: invoice.invoice_number ?? "",
    customer: "",
    dueDate: invoice.due_date ?? "",
    status: invoice.payment_status ?? "",
    total: invoice.total_amount ? `$${invoice.total_amount}` : "",
  }));
}

export async function getLeaderboard() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return fallbackLeaderboard;
  }
  const client = createUserClient(token);
  const { data } = await client
    .from("leaderboard")
    .select("rank, total_revenue, leads_generated, conversion_rate")
    .order("rank", { ascending: true })
    .limit(10);

  if (!data) {
    return fallbackLeaderboard;
  }

  return data.map((item, index) => ({
    rank: item.rank ?? index + 1,
    name: `Rep ${item.rank ?? index + 1}`,
    revenue: item.total_revenue ? `$${item.total_revenue}` : "$0",
    leads: item.leads_generated ?? 0,
    conversion: item.conversion_rate ? `${item.conversion_rate}%` : "0%",
  }));
}

export async function getIncidents() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return fallbackIncidents;
  }
  const client = createUserClient(token);
  const { data } = await client
    .from("incidents")
    .select("incident_id, description, severity, status")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!data) {
    return fallbackIncidents;
  }
  return data.map((incident) => ({
    id: incident.incident_id,
    title: incident.description ?? "Incident",
    detail: incident.severity ?? "",
    status: incident.status ?? "",
  }));
}

export async function getQualityIssues() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return fallbackQuality;
  }
  const client = createUserClient(token);
  const { data } = await client
    .from("job_quality_issues")
    .select("issue_id, description, severity, status")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!data) {
    return fallbackQuality;
  }
  return data.map((issue) => ({
    id: issue.issue_id,
    title: issue.description ?? "Quality issue",
    detail: issue.severity ?? "",
    status: issue.status ?? "",
  }));
}

export async function getReportSummary() {
  return reportSummary;
}

export async function getTechnicianSchedule() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return technicianJobs;
  }
  const client = createUserClient(token);
  const { data: userData } = await client.auth.getUser();
  if (!userData?.user) {
    return technicianJobs;
  }
  const { data } = await client
    .from("jobs")
    .select("job_id, service_type, status, scheduled_start_time, address")
    .eq("technician_id", userData.user.id)
    .order("scheduled_date", { ascending: true })
    .limit(20);

  if (!data) {
    return technicianJobs;
  }

  return data.map((job) => ({
    id: job.job_id,
    time: job.scheduled_start_time ?? "",
    customer: "",
    address: job.address ?? "",
    service: job.service_type ?? "",
    revenue: "",
    status: job.status ?? "",
  }));
}

export async function getNotifications() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return fallbackNotifications;
  }
  const client = createUserClient(token);
  const { data: userData } = await client.auth.getUser();
  if (!userData?.user) {
    return fallbackNotifications;
  }
  const { data } = await client
    .from("notifications")
    .select("notif_id, title, body, status")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (!data) {
    return fallbackNotifications;
  }
  return data.map((note) => ({
    id: note.notif_id,
    title: note.title ?? "Notification",
    detail: note.body ?? "",
    status: note.status ?? "",
  }));
}
