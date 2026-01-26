type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("delay") || normalized.includes("overdue")
      ? "badge-warning"
      : normalized.includes("risk") ||
          normalized.includes("issue") ||
          normalized.includes("incident") ||
          normalized.includes("no show") ||
          normalized.includes("escalated")
        ? "badge-danger"
        : "badge-success";

  return <span className={`badge ${tone}`}>{status}</span>;
}
