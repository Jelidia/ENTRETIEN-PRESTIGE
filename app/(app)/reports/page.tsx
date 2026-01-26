"use client";

import KpiCard from "@/components/KpiCard";
import TopBar from "@/components/TopBar";
import { useEffect, useState } from "react";

const defaultKpis = [
  { label: "Total revenue", value: "$118,450", meta: "Last 30 days" },
  { label: "Jobs completed", value: "312", meta: "9 cancellations" },
  { label: "Upsells", value: "$12,900", meta: "26% of jobs" },
  { label: "Refunds", value: "$1,230", meta: "2 cases" },
];

const defaultBars = [42, 48, 38, 55, 62, 58, 70, 76, 64, 72, 80, 68];

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

type AuditRow = {
  audit_id: string;
  action: string;
  status: string;
  created_at: string;
};

export default function ReportsPage() {
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [commissionForm, setCommissionForm] = useState({
    employeeId: "",
    jobId: "",
    servicePrice: "",
    commissionRate: "",
    estimatedCommission: "",
  });
  const [payrollForm, setPayrollForm] = useState({
    employeeId: "",
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    baseSalary: "",
    commissionConfirmed: "",
    deductions: "",
    netPay: "",
    jobsCompleted: "",
    totalRevenue: "",
  });
  const [commissionStatus, setCommissionStatus] = useState("");
  const [payrollStatus, setPayrollStatus] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const [commissionRes, payrollRes, auditRes] = await Promise.all([
      fetch("/api/reports/commission"),
      fetch("/api/reports/payroll"),
      fetch("/api/reports/audit-log"),
    ]);
    const commissionJson = await commissionRes.json().catch(() => ({ data: [] }));
    const payrollJson = await payrollRes.json().catch(() => ({ data: [] }));
    const auditJson = await auditRes.json().catch(() => ({ data: [] }));

    setCommissions(commissionJson.data ?? []);
    setPayroll(payrollJson.data ?? []);
    setAudit((auditJson.data ?? []).slice(0, 6));
  }

  async function submitCommission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCommissionStatus("");
    const response = await fetch("/api/reports/commission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: commissionForm.employeeId,
        jobId: commissionForm.jobId || undefined,
        servicePrice: Number(commissionForm.servicePrice),
        commissionRate: Number(commissionForm.commissionRate),
        estimatedCommission: commissionForm.estimatedCommission
          ? Number(commissionForm.estimatedCommission)
          : undefined,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setCommissionStatus(json.error ?? "Unable to save commission");
      return;
    }
    setCommissionStatus("Commission saved.");
    setCommissionForm({ employeeId: "", jobId: "", servicePrice: "", commissionRate: "", estimatedCommission: "" });
    void loadData();
  }

  async function submitPayroll(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPayrollStatus("");
    const response = await fetch("/api/reports/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: payrollForm.employeeId,
        year: Number(payrollForm.year),
        month: Number(payrollForm.month),
        baseSalary: Number(payrollForm.baseSalary),
        commissionConfirmed: payrollForm.commissionConfirmed ? Number(payrollForm.commissionConfirmed) : undefined,
        deductions: payrollForm.deductions ? Number(payrollForm.deductions) : undefined,
        netPay: Number(payrollForm.netPay),
        jobsCompleted: payrollForm.jobsCompleted ? Number(payrollForm.jobsCompleted) : undefined,
        totalRevenue: payrollForm.totalRevenue ? Number(payrollForm.totalRevenue) : undefined,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPayrollStatus(json.error ?? "Unable to save payroll");
      return;
    }
    setPayrollStatus("Payroll statement saved.");
    setPayrollForm({
      employeeId: "",
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString(),
      baseSalary: "",
      commissionConfirmed: "",
      deductions: "",
      netPay: "",
      jobsCompleted: "",
      totalRevenue: "",
    });
    void loadData();
  }

  return (
    <div className="page">
      <TopBar
        title="Reports"
        subtitle="Performance, revenue, and quality signals"
        actions={
          <a className="button-secondary" href="/api/jobs/export">
            Download CSV
          </a>
        }
      />

      <section className="kpi-grid">
        {defaultKpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="card">
        <h3 className="card-title">Monthly revenue</h3>
        <div className="chart" style={{ marginTop: 16 }}>
          {defaultBars.map((bar, index) => (
            <div key={index} className="chart-bar" style={{ height: `${bar}%` }} />
          ))}
        </div>
      </section>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Commissions</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Estimated</th>
                <th>Confirmed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.commission_id}>
                  <td>{commission.employee_id}</td>
                  <td>{commission.estimated_commission ?? 0}</td>
                  <td>{commission.confirmed_commission ?? 0}</td>
                  <td>{commission.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 className="card-title">Payroll</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Net pay</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((statement) => (
                <tr key={statement.statement_id}>
                  <td>{statement.employee_id}</td>
                  <td>{statement.month}/{statement.year}</td>
                  <td>{statement.net_pay ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Add commission</h3>
          <form className="form-grid" onSubmit={submitCommission}>
            <div className="form-row">
              <label className="label" htmlFor="commissionEmployee">Employee ID</label>
              <input
                id="commissionEmployee"
                className="input"
                value={commissionForm.employeeId}
                onChange={(event) => setCommissionForm({ ...commissionForm, employeeId: event.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label className="label" htmlFor="commissionJob">Job ID</label>
              <input
                id="commissionJob"
                className="input"
                value={commissionForm.jobId}
                onChange={(event) => setCommissionForm({ ...commissionForm, jobId: event.target.value })}
              />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="servicePrice">Service price</label>
                <input
                  id="servicePrice"
                  className="input"
                  type="number"
                  value={commissionForm.servicePrice}
                  onChange={(event) => setCommissionForm({ ...commissionForm, servicePrice: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="commissionRate">Rate (%)</label>
                <input
                  id="commissionRate"
                  className="input"
                  type="number"
                  value={commissionForm.commissionRate}
                  onChange={(event) => setCommissionForm({ ...commissionForm, commissionRate: event.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="estimatedCommission">Estimated commission</label>
              <input
                id="estimatedCommission"
                className="input"
                type="number"
                value={commissionForm.estimatedCommission}
                onChange={(event) =>
                  setCommissionForm({ ...commissionForm, estimatedCommission: event.target.value })
                }
              />
            </div>
            <button className="button-primary" type="submit">Save commission</button>
            {commissionStatus ? <div className="hint">{commissionStatus}</div> : null}
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Add payroll statement</h3>
          <form className="form-grid" onSubmit={submitPayroll}>
            <div className="form-row">
              <label className="label" htmlFor="payrollEmployee">Employee ID</label>
              <input
                id="payrollEmployee"
                className="input"
                value={payrollForm.employeeId}
                onChange={(event) => setPayrollForm({ ...payrollForm, employeeId: event.target.value })}
                required
              />
            </div>
            <div className="grid-3">
              <div className="form-row">
                <label className="label" htmlFor="payrollYear">Year</label>
                <input
                  id="payrollYear"
                  className="input"
                  type="number"
                  value={payrollForm.year}
                  onChange={(event) => setPayrollForm({ ...payrollForm, year: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="payrollMonth">Month</label>
                <input
                  id="payrollMonth"
                  className="input"
                  type="number"
                  value={payrollForm.month}
                  onChange={(event) => setPayrollForm({ ...payrollForm, month: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="payrollNet">Net pay</label>
                <input
                  id="payrollNet"
                  className="input"
                  type="number"
                  value={payrollForm.netPay}
                  onChange={(event) => setPayrollForm({ ...payrollForm, netPay: event.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="payrollBase">Base salary</label>
                <input
                  id="payrollBase"
                  className="input"
                  type="number"
                  value={payrollForm.baseSalary}
                  onChange={(event) => setPayrollForm({ ...payrollForm, baseSalary: event.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="payrollCommission">Commission</label>
                <input
                  id="payrollCommission"
                  className="input"
                  type="number"
                  value={payrollForm.commissionConfirmed}
                  onChange={(event) =>
                    setPayrollForm({ ...payrollForm, commissionConfirmed: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="payrollDeductions">Deductions</label>
                <input
                  id="payrollDeductions"
                  className="input"
                  type="number"
                  value={payrollForm.deductions}
                  onChange={(event) => setPayrollForm({ ...payrollForm, deductions: event.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="payrollRevenue">Total revenue</label>
                <input
                  id="payrollRevenue"
                  className="input"
                  type="number"
                  value={payrollForm.totalRevenue}
                  onChange={(event) => setPayrollForm({ ...payrollForm, totalRevenue: event.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="payrollJobs">Jobs completed</label>
              <input
                id="payrollJobs"
                className="input"
                type="number"
                value={payrollForm.jobsCompleted}
                onChange={(event) => setPayrollForm({ ...payrollForm, jobsCompleted: event.target.value })}
              />
            </div>
            <button className="button-primary" type="submit">Save payroll</button>
            {payrollStatus ? <div className="hint">{payrollStatus}</div> : null}
          </form>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Audit trail</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((entry) => (
              <tr key={entry.audit_id}>
                <td>{entry.action}</td>
                <td>{entry.status}</td>
                <td>{new Date(entry.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
