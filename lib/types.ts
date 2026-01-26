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
};

export type DispatchColumn = {
  technician: string;
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
