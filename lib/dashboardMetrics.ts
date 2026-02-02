import type { Kpi, ScheduleItem } from "@/lib/types";
export type DashboardJob = {
  job_id: string;
  customer_id?: string | null;
  service_type?: string | null;
  status?: string | null;
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  estimated_revenue?: number | null;
  actual_revenue?: number | null;
};

export type DashboardCustomer = {
  customer_id: string;
  first_name?: string | null;
  last_name?: string | null;
  status?: string | null;
  average_rating?: number | null;
};

type DashboardDataInput = {
  jobs: DashboardJob[];
  customers: DashboardCustomer[];
  now?: Date;
};

const MONTH_WINDOW = 12;

export function buildDashboardData({ jobs, customers, now = new Date() }: DashboardDataInput) {
  const todayKey = formatDateKey(now);
  const revenueBars = buildRevenueBars(jobs, now);
  const scheduleToday = buildScheduleToday(jobs, customers, todayKey);
  const kpis = buildDashboardKpis(jobs, customers, now, todayKey);

  return { kpis, revenueBars, scheduleToday };
}

export function buildDashboardKpis(
  jobs: DashboardJob[],
  customers: DashboardCustomer[],
  now: Date,
  todayKey: string
): Kpi[] {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const todayJobs = jobs.filter((job) => job.scheduled_date === todayKey);
  const monthlyRevenue = jobs.reduce((total, job) => {
    const date = parseDate(job.scheduled_date);
    if (!date || date < monthStart) {
      return total;
    }
    return total + getJobRevenue(job);
  }, 0);

  const activeClients = customers.filter((customer) => customer.status === "active").length;
  const ratedCustomers = customers.filter(
    (customer): customer is DashboardCustomer & { average_rating: number } =>
      typeof customer.average_rating === "number"
  );
  const averageRating = ratedCustomers.length
    ? ratedCustomers.reduce((sum, customer) => sum + customer.average_rating, 0) / ratedCustomers.length
    : 0;

  return [
    {
      label: "Today jobs",
      value: String(todayJobs.length),
      meta: "Scheduled today",
    },
    {
      label: "Revenue",
      value: formatCurrency(monthlyRevenue),
      meta: "This month",
    },
    {
      label: "Active clients",
      value: String(activeClients),
      meta: "Active customers",
    },
    {
      label: "Avg rating",
      value: averageRating.toFixed(1),
      meta: "Avg customer rating",
    },
  ];
}

export function buildRevenueBars(jobs: DashboardJob[], now: Date): number[] {
  const buckets = buildMonthBuckets(now, MONTH_WINDOW);
  for (const job of jobs) {
    const date = parseDate(job.scheduled_date);
    if (!date) {
      continue;
    }
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const current = buckets.get(key);
    if (current === undefined) {
      continue;
    }
    buckets.set(key, current + getJobRevenue(job));
  }

  const values = Array.from(buckets.values());
  const max = Math.max(0, ...values);
  if (max === 0) {
    return values.map(() => 0);
  }
  return values.map((value) => Math.round((value / max) * 100));
}

export function buildScheduleToday(
  jobs: DashboardJob[],
  customers: DashboardCustomer[],
  todayKey: string
): ScheduleItem[] {
  const customerMap = new Map(
    customers.map((customer) => [
      customer.customer_id,
      [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim(),
    ])
  );

  return jobs
    .filter((job) => job.scheduled_date === todayKey)
    .map((job) => {
      const customerName = job.customer_id ? customerMap.get(job.customer_id) : "";
      return {
        id: job.job_id,
        time: formatTimeRange(job.scheduled_start_time, job.scheduled_end_time),
        customer: customerName || "Client",
        service: job.service_type ?? "Service",
        revenue: formatCurrency(getJobRevenue(job)),
        status: job.status ?? "Scheduled",
      };
    });
}

export function formatDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatCurrency(value: number) {
  const rounded = Math.round(value);
  return `$${rounded.toLocaleString("en-US")}`;
}

function buildMonthBuckets(now: Date, count: number) {
  const buckets = new Map<string, number>();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    buckets.set(`${date.getUTCFullYear()}-${date.getUTCMonth()}`, 0);
  }
  return buckets;
}

function formatTimeRange(start?: string | null, end?: string | null) {
  const startValue = normalizeTime(start);
  const endValue = normalizeTime(end);
  if (startValue && endValue) {
    return `${startValue} - ${endValue}`;
  }
  return startValue || endValue || "--";
}

function normalizeTime(value?: string | null) {
  if (!value) {
    return "";
  }
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const normalized = value.includes("T") ? value : `${value}T00:00:00Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function getJobRevenue(job: DashboardJob) {
  return job.actual_revenue ?? job.estimated_revenue ?? 0;
}
