"use client";

type KpiCardProps = {
  label: string;
  value: string;
  meta: string;
};

export default function KpiCard({ label, value, meta }: KpiCardProps) {
  return (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
      <div className="card-meta">{meta}</div>
    </div>
  );
}
