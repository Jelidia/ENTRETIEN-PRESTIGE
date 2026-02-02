import { getAccessTokenFromCookies } from "./session";
import { createUserClient } from "./supabaseServer";
import { buildDashboardData, formatDateKey } from "./dashboardMetrics";
import { logger } from "@/lib/logger";
type DashboardError = "session_expired" | "missing_profile" | "load_failed";

export type DashboardData = ReturnType<typeof buildDashboardData> & {
  error?: DashboardError;
};

type DashboardQueryOptions = {
  requestId?: string;
};

const emptyDashboardData: DashboardData = {
  kpis: [],
  revenueBars: [],
  scheduleToday: [],
};

const emptyReportSummary = { kpis: [], revenueBars: [] };

export async function getDashboardData(
  options: DashboardQueryOptions = {}
): Promise<DashboardData> {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return { ...emptyDashboardData, error: "session_expired" };
  }

  const client = createUserClient(token);
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData?.user) {
    if (userError) {
      logger.warn("Dashboard session check failed", {
        request_id: options.requestId,
        error: userError,
      });
    }
    return { ...emptyDashboardData, error: "session_expired" };
  }

  const { data: profile, error: profileError } = await client
    .from("users")
    .select("company_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!profile?.company_id) {
    logger.error("Dashboard profile missing", {
      request_id: options.requestId,
      user_id: userData.user.id,
      error: profileError,
    });
    return { ...emptyDashboardData, error: "missing_profile" };
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
    logger.error("Failed to load dashboard data", {
      request_id: options.requestId,
      jobs_error: jobsError,
      customers_error: customersError,
      company_id: profile.company_id,
    });
    return { ...emptyDashboardData, error: "load_failed" };
  }

  return buildDashboardData({ jobs, customers, now });
}

export async function getDispatchBoard() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return [];
  }

  const client = createUserClient(token);
  const { data: technicians, error: techniciansError } = await client
    .from("users")
    .select("user_id, full_name")
    .eq("role", "technician")
    .limit(10);

  const { data: jobs, error: jobsError } = await client
    .from("jobs")
    .select("job_id, technician_id, address, service_type, estimated_revenue, scheduled_start_time, status")
    .order("scheduled_date", { ascending: true })
    .limit(50);

  if (techniciansError || jobsError || !technicians || !jobs) {
    logger.error("Failed to load dispatch board", {
      technicians_error: techniciansError,
      jobs_error: jobsError,
    });
    return [];
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
    return [];
  }

  const client = createUserClient(token);
  const { data, error } = await client
    .from("jobs")
    .select("job_id, service_type, status, scheduled_date, estimated_revenue")
    .order("scheduled_date", { ascending: true });

  if (error || !data) {
    logger.error("Failed to load jobs list", { error });
    return [];
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
    return [];
  }

  const client = createUserClient(token);
  const { data, error } = await client
    .from("customers")
    .select("customer_id, first_name, last_name, status, customer_type, last_service_date, account_balance")
    .limit(100);

  if (error || !data) {
    logger.error("Failed to load customers", { error });
    return [];
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
    return [];
  }

  const client = createUserClient(token);
  const { data, error } = await client
    .from("invoices")
    .select("invoice_number, payment_status, total_amount, due_date")
    .limit(100);

  if (error || !data) {
    logger.error("Failed to load invoices", { error });
    return [];
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
    return [];
  }
  const client = createUserClient(token);
  const { data, error } = await client
    .from("leaderboard")
    .select("rank, total_revenue, leads_generated, conversion_rate")
    .order("rank", { ascending: true })
    .limit(10);

  if (error || !data) {
    logger.error("Failed to load leaderboard", { error });
    return [];
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
    return [];
  }
  const client = createUserClient(token);
  const { data, error } = await client
    .from("incidents")
    .select("incident_id, description, severity, status")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) {
    logger.error("Failed to load incidents", { error });
    return [];
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
    return [];
  }
  const client = createUserClient(token);
  const { data, error } = await client
    .from("job_quality_issues")
    .select("issue_id, description, severity, status")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) {
    logger.error("Failed to load quality issues", { error });
    return [];
  }
  return data.map((issue) => ({
    id: issue.issue_id,
    title: issue.description ?? "Quality issue",
    detail: issue.severity ?? "",
    status: issue.status ?? "",
  }));
}

export async function getReportSummary() {
  return emptyReportSummary;
}

export async function getTechnicianSchedule() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return [];
  }
  const client = createUserClient(token);
  const { data: userData, error: userError } = await client.auth.getUser();
  if (!userData?.user) {
    if (userError) {
      logger.warn("Technician schedule session check failed", { error: userError });
    }
    return [];
  }
  const { data, error } = await client
    .from("jobs")
    .select("job_id, service_type, status, scheduled_start_time, address")
    .eq("technician_id", userData.user.id)
    .order("scheduled_date", { ascending: true })
    .limit(20);

  if (error || !data) {
    logger.error("Failed to load technician schedule", { error });
    return [];
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
    return [];
  }
  const client = createUserClient(token);
  const { data: userData, error: userError } = await client.auth.getUser();
  if (!userData?.user) {
    if (userError) {
      logger.warn("Notifications session check failed", { error: userError });
    }
    return [];
  }
  const { data, error } = await client
    .from("notifications")
    .select("notif_id, title, body, status")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) {
    logger.error("Failed to load notifications", { error });
    return [];
  }
  return data.map((note) => ({
    id: note.notif_id,
    title: note.title ?? "Notification",
    detail: note.body ?? "",
    status: note.status ?? "",
  }));
}
