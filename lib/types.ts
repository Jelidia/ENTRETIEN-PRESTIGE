export type Kpi = {
  label: string;
  value: string;
  meta: string;
};

export type ScheduleItem = {
  id: string;
  time: string;
  customer: string;
  address?: string;
  service: string;
  revenue: string;
  status: string;
};

export type DispatchJob = {
  id: string;
  time: string;
  address: string;
  service: string;
  price: string;
  status: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
};

export type DispatchColumn = {
  technician: string;
  technicianId?: string;
  jobs: DispatchJob[];
};

export type Customer = {
  id: string;
  name: string;
  type: string;
  status: string;
  lastService: string;
  balance: string;
};

export type Job = {
  id: string;
  customer: string;
  service: string;
  date: string;
  status: string;
  revenue: string;
};

export type Invoice = {
  number: string;
  customer: string;
  dueDate: string;
  status: string;
  total: string;
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  revenue: string;
  leads: number;
  conversion: string;
};

export type Incident = {
  id: string;
  title: string;
  detail: string;
  status: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  status: string;
};

export type ReportSummary = {
  kpis: Kpi[];
  revenueBars: number[];
};

export type Lead = {
  lead_id: string;
  first_name: string;
  last_name: string;
  status: string;
  estimated_job_value?: number;
  follow_up_date?: string;
  city?: string;
};

export type Territory = {
  territory_id: string;
  territory_name: string;
  monthly_revenue?: number;
  total_customers?: number;
  active_customers?: number;
};

export type Commission = {
  commission_id: string;
  employee_id: string;
  estimated_commission?: number;
  confirmed_commission?: number;
  status: string;
};

export type Payroll = {
  statement_id: string;
  employee_id: string;
  year: number;
  month: number;
  net_pay?: number;
};

export type Checklist = {
  checklist_id: string;
  technician_id: string;
  work_date: string;
  shift_status: string;
};
