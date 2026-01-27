"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";

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

type Profile = {
  user_id: string;
};

export default function SalesEarningsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setStatus("");
    const profileRes = await fetch("/api/users/me");
    const profileJson = await profileRes.json().catch(() => null);
    if (!profileRes.ok || !profileJson?.user_id) {
      setStatus(profileJson?.error ?? "Unable to load profile");
      return;
    }
    setProfile(profileJson as Profile);

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
    const employeeId = (profileJson as Profile).user_id;
    const filteredCommissions = (commissionJson.data ?? []).filter(
      (row: CommissionRow) => row.employee_id === employeeId
    );
    const filteredPayroll = (payrollJson.data ?? []).filter(
      (row: PayrollRow) => row.employee_id === employeeId
    );
    setCommissions(filteredCommissions);
    setPayroll(filteredPayroll);
  }

  const totals = useMemo(() => {
    const estimated = commissions.reduce((sum, row) => sum + (row.estimated_commission ?? 0), 0);
    const confirmed = commissions.reduce((sum, row) => sum + (row.confirmed_commission ?? 0), 0);
    const lastPay = payroll[0]?.net_pay ?? 0;
    return { estimated, confirmed, lastPay };
  }, [commissions, payroll]);

  return (
    <div className="page">
      <TopBar
        title="Earnings"
        subtitle="Pending vs confirmed commission"
        actions={
          <button className="button-ghost" type="button" onClick={loadData}>
            Refresh
          </button>
        }
      />

      <div className="earnings-grid">
        <div className="card">
          <div className="card-label">Estimated</div>
          <div className="card-value">${totals.estimated.toFixed(0)}</div>
          <div className="card-meta">Pending confirmation</div>
        </div>
        <div className="card">
          <div className="card-label">Confirmed</div>
          <div className="card-value">${totals.confirmed.toFixed(0)}</div>
          <div className="card-meta">Approved by manager</div>
        </div>
        <div className="card">
          <div className="card-label">Last payout</div>
          <div className="card-value">${totals.lastPay.toFixed(0)}</div>
          <div className="card-meta">Most recent payment</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Commission history</h3>
        <div className="list" style={{ marginTop: 12 }}>
          {commissions.length === 0 ? (
            <div className="card-meta">No commissions yet.</div>
          ) : (
            commissions.map((row) => (
              <div className="list-item" key={row.commission_id}>
                <div>
                  <strong>Commission {row.commission_id.slice(0, 6)}</strong>
                  <div className="card-meta">
                    Est. {row.estimated_commission ?? 0} · Confirmed {row.confirmed_commission ?? 0}
                  </div>
                </div>
                <span className="tag">{row.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {profile ? null : <div className="hint">Loading profile...</div>}
      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
