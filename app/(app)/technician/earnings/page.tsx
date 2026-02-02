"use client";

import { useEffect, useMemo, useState } from "react";

type CommissionRow = {
  commission_id: string;
  employee_id: string;
  estimated_commission?: number;
  confirmed_commission?: number;
  status: string;
};

type PayrollRow = {
  statement_id: string;
  employee_id: string;
  year: number;
  month: number;
  net_pay?: number;
};

export default function TechnicianEarningsPage() {
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const [commissionRes, payrollRes] = await Promise.all([
      fetch("/api/reports/commission"),
      fetch("/api/reports/payroll"),
    ]);
    const commissionJson = await commissionRes.json().catch(() => ({ data: [] }));
    const payrollJson = await payrollRes.json().catch(() => ({ data: [] }));
    if (!commissionRes.ok || !payrollRes.ok) {
      setStatus(commissionJson.error ?? payrollJson.error ?? "Unable to load earnings");
      return;
    }
    setCommissions(commissionJson.data ?? []);
    setPayroll(payrollJson.data ?? []);
  }

  const totals = useMemo(() => {
    const estimated = commissions.reduce((sum, row) => sum + (row.estimated_commission ?? 0), 0);
    const confirmed = commissions.reduce((sum, row) => sum + (row.confirmed_commission ?? 0), 0);
    const lastPay = payroll[0]?.net_pay ?? 0;
    return { estimated, confirmed, lastPay };
  }, [commissions, payroll]);

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Earnings</div>
          <div className="tech-title">Commissions & payouts</div>
        </div>
        <button className="button-ghost" type="button" onClick={loadData}>Refresh</button>
      </div>

      <div className="earnings-grid">
        <div className="card">
          <div className="card-label">Estimated</div>
          <div className="card-value">${totals.estimated.toFixed(0)}</div>
          <div className="card-meta">Current period</div>
        </div>
        <div className="card">
          <div className="card-label">Confirmed</div>
          <div className="card-value">${totals.confirmed.toFixed(0)}</div>
          <div className="card-meta">Ready for payout</div>
        </div>
        <div className="card">
          <div className="card-label">Last payment</div>
          <div className="card-value">${totals.lastPay.toFixed(0)}</div>
          <div className="card-meta">Most recent payroll</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Commission history</h3>
        <div className="list" style={{ marginTop: 12 }}>
          {commissions.map((row) => (
            <div className="list-item" key={row.commission_id}>
              <div>
                <strong>Employee {row.employee_id}</strong>
                <div className="card-meta">Estimated: {row.estimated_commission ?? 0} · Confirmed: {row.confirmed_commission ?? 0}</div>
              </div>
              <span className="tag">{row.status}</span>
            </div>
          ))}
        </div>
      </div>
      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
