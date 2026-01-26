import type {
  Customer,
  DispatchColumn,
  Incident,
  Invoice,
  Job,
  Kpi,
  LeaderboardEntry,
  NotificationItem,
  ReportSummary,
  ScheduleItem,
} from "./types";

export const dashboardKpis: Kpi[] = [
  { label: "Today jobs", value: "12", meta: "2 above average" },
  { label: "Revenue", value: "$4,250", meta: "18% above target" },
  { label: "Active clients", value: "287", meta: "5 new this month" },
  { label: "Avg rating", value: "4.8", meta: "0.2 up this month" },
];

export const reportKpis: Kpi[] = [
  { label: "Total revenue", value: "$118,450", meta: "Last 30 days" },
  { label: "Jobs completed", value: "312", meta: "9 cancellations" },
  { label: "Upsells", value: "$12,900", meta: "26% of jobs" },
  { label: "Refunds", value: "$1,230", meta: "2 cases" },
];

export const revenueBars = [42, 48, 38, 55, 62, 58, 70, 76, 64, 72, 80, 68];

export const scheduleToday: ScheduleItem[] = [
  {
    id: "SCH-001",
    time: "09:00",
    customer: "John Doe",
    service: "Window cleaning",
    revenue: "$250",
    status: "On time",
  },
  {
    id: "SCH-002",
    time: "10:30",
    customer: "Jane Smith",
    service: "Gutter clean",
    revenue: "$180",
    status: "Delayed",
  },
  {
    id: "SCH-003",
    time: "13:00",
    customer: "Mike Brown",
    service: "Roof wash",
    revenue: "$400",
    status: "At risk",
  },
];

export const dispatchBoard: DispatchColumn[] = [
  {
    technician: "John Doe",
    jobs: [
      {
        id: "JOB-101",
        time: "09:00-10:30",
        address: "456 Main St",
        service: "Window wash",
        price: "$250",
        status: "Confirmed",
      },
      {
        id: "JOB-102",
        time: "11:00-12:30",
        address: "567 Oak St",
        service: "Roof cleaning",
        price: "$400",
        status: "No show",
      },
    ],
  },
  {
    technician: "Jane Smith",
    jobs: [
      {
        id: "JOB-201",
        time: "09:00-10:00",
        address: "789 Park Ave",
        service: "Window wash",
        price: "$150",
        status: "Pending",
      },
      {
        id: "JOB-202",
        time: "11:00-12:30",
        address: "234 Elm St",
        service: "Pressure wash",
        price: "$180",
        status: "Completed",
      },
    ],
  },
  {
    technician: "Mike Brown",
    jobs: [
      {
        id: "JOB-301",
        time: "09:30-10:30",
        address: "111 Oak St",
        service: "Gutter clean",
        price: "$300",
        status: "Confirmed",
      },
      {
        id: "JOB-302",
        time: "11:00-12:00",
        address: "567 Pine St",
        service: "Roof cleaning",
        price: "$350",
        status: "Pending",
      },
    ],
  },
];

export const customers: Customer[] = [
  {
    id: "CUS-001",
    name: "Claire Raymond",
    type: "Residential",
    status: "Active",
    lastService: "Jan 12",
    balance: "$0",
  },
  {
    id: "CUS-002",
    name: "Boreal Office",
    type: "Commercial",
    status: "Active",
    lastService: "Jan 18",
    balance: "$450",
  },
  {
    id: "CUS-003",
    name: "Loft 52",
    type: "Residential",
    status: "At risk",
    lastService: "Dec 29",
    balance: "$120",
  },
  {
    id: "CUS-004",
    name: "Northview Mall",
    type: "Commercial",
    status: "Active",
    lastService: "Jan 20",
    balance: "$0",
  },
];

export const jobs: Job[] = [
  {
    id: "JOB-991",
    customer: "Claire Raymond",
    service: "Window cleaning",
    date: "Jan 25",
    status: "In progress",
    revenue: "$250",
  },
  {
    id: "JOB-992",
    customer: "Boreal Office",
    service: "Gutter clean",
    date: "Jan 25",
    status: "Scheduled",
    revenue: "$180",
  },
  {
    id: "JOB-993",
    customer: "Loft 52",
    service: "Roof wash",
    date: "Jan 26",
    status: "Created",
    revenue: "$400",
  },
  {
    id: "JOB-994",
    customer: "Northview Mall",
    service: "Pressure wash",
    date: "Jan 27",
    status: "Scheduled",
    revenue: "$750",
  },
];

export const invoices: Invoice[] = [
  {
    number: "INV-901",
    customer: "Claire Raymond",
    dueDate: "Jan 30",
    status: "Paid",
    total: "$250",
  },
  {
    number: "INV-902",
    customer: "Boreal Office",
    dueDate: "Feb 2",
    status: "Sent",
    total: "$480",
  },
  {
    number: "INV-903",
    customer: "Loft 52",
    dueDate: "Feb 5",
    status: "Overdue",
    total: "$120",
  },
];

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Sophie Tremblay", revenue: "$38,200", leads: 48, conversion: "54%" },
  { rank: 2, name: "Lucas Martin", revenue: "$32,700", leads: 44, conversion: "47%" },
  { rank: 3, name: "Andre Gagnon", revenue: "$28,900", leads: 39, conversion: "41%" },
];

export const incidents: Incident[] = [
  {
    id: "INC-01",
    title: "Equipment damage",
    detail: "Ladder foot replaced during job",
    status: "Reported",
  },
  {
    id: "INC-02",
    title: "Client complaint",
    detail: "Streaking on second floor windows",
    status: "Under review",
  },
];

export const qualityIssues: Incident[] = [
  {
    id: "QLT-01",
    title: "Missed frame detail",
    detail: "Follow-up scheduled for Jan 27",
    status: "In progress",
  },
  {
    id: "QLT-02",
    title: "No-show reported",
    detail: "Reschedule required",
    status: "Escalated",
  },
];

export const technicianJobs: ScheduleItem[] = [
  {
    id: "TECH-01",
    time: "09:00",
    customer: "John House",
    address: "456 Main St",
    service: "Window washing",
    revenue: "$250",
    status: "Check in",
  },
  {
    id: "TECH-02",
    time: "11:00",
    customer: "Jane Office",
    address: "789 Park Ave",
    service: "Roof cleaning",
    revenue: "$400",
    status: "Upcoming",
  },
  {
    id: "TECH-03",
    time: "14:00",
    customer: "Building Complex",
    address: "111 Oak St",
    service: "Gutter cleaning",
    revenue: "$300",
    status: "Upcoming",
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "NOT-01",
    title: "Job delay",
    detail: "Team B is 18 minutes behind",
    status: "Unread",
  },
  {
    id: "NOT-02",
    title: "Invoice paid",
    detail: "INV-901 paid by Claire Raymond",
    status: "Read",
  },
  {
    id: "NOT-03",
    title: "Weather alert",
    detail: "High winds tomorrow afternoon",
    status: "Unread",
  },
];

export const reportSummary: ReportSummary = {
  kpis: reportKpis,
  revenueBars,
};
