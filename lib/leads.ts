
export const leadStatuses = ["new", "contacted", "estimated", "won", "lost"] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export type LeadRow = {
  lead_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string | null;
  estimated_job_value: number | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string | null;
  sales_rep_id?: string | null;
};

export type LeadResponse = {
  lead_id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  status: LeadStatus;
  estimated_value: number;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string | null;
};

const leadStatusSet = new Set<string>(leadStatuses);

export function normalizeLeadStatus(value: string | null): LeadStatus {
  if (value && leadStatusSet.has(value)) {
    return value as LeadStatus;
  }
  return "new";
}

export function splitCustomerName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? "";
  const lastName = parts.length ? parts.join(" ") : null;
  return {
    firstName: firstName || null,
    lastName,
  };
}

export function mapLeadRow(row: LeadRow): LeadResponse {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  const fallbackName = row.email ?? row.phone ?? "Client";
  return {
    lead_id: row.lead_id,
    customer_name: name || fallbackName,
    phone: row.phone ?? "",
    email: row.email ?? null,
    address: row.address ?? null,
    status: normalizeLeadStatus(row.status),
    estimated_value: row.estimated_job_value ?? 0,
    follow_up_date: row.follow_up_date ?? null,
    notes: row.notes ?? null,
    created_at: row.created_at ?? null,
  };
}
