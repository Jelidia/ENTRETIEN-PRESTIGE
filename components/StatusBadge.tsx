"use client";

type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const isWarning =
    normalized.includes("delay") ||
    normalized.includes("overdue") ||
    normalized.includes("unread") ||
    normalized.includes("inactive") ||
    normalized.includes("inactif");
  const isDanger =
    normalized.includes("risk") ||
    normalized.includes("issue") ||
    normalized.includes("incident") ||
    normalized.includes("no show") ||
    normalized.includes("escalated") ||
    normalized.includes("suspended") ||
    normalized.includes("suspendu");
  const tone = isWarning ? "badge-warning" : isDanger ? "badge-danger" : "badge-success";

  return <span className={`badge ${tone}`}>{status}</span>;
}
