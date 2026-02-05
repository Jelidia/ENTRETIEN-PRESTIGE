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
        setStatus(profileJson?.error ?? "Impossible de charger le profil");
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
      setStatus(commissionJson.error ?? payrollJson.error ?? "Impossible de charger les revenus");
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
        title="Revenus"
        subtitle="Commissions en attente vs confirmées"
        actions={
          <button className="button-ghost" type="button" onClick={loadData}>
            Rafraîchir
          </button>
        }
      />

      <div className="earnings-grid">
        <div className="card">
          <div className="card-label">Estimé</div>
          <div className="card-value">${totals.estimated.toFixed(0)}</div>
          <div className="card-meta">En attente de confirmation</div>
        </div>
        <div className="card">
          <div className="card-label">Confirmé</div>
          <div className="card-value">${totals.confirmed.toFixed(0)}</div>
          <div className="card-meta">Approuvé par le gestionnaire</div>
        </div>
        <div className="card">
          <div className="card-label">Dernier paiement</div>
          <div className="card-value">${totals.lastPay.toFixed(0)}</div>
          <div className="card-meta">Paiement le plus récent</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Historique des commissions</h3>
        <div className="list" style={{ marginTop: 12 }}>
          {commissions.length === 0 ? (
            <div className="card-meta">Aucune commission pour l'instant.</div>
          ) : (
            commissions.map((row) => (
              <div className="list-item" key={row.commission_id}>
                <div>
                  <strong>Commission {row.commission_id.slice(0, 6)}</strong>
                  <div className="card-meta">
                    Est. {row.estimated_commission ?? 0} · Confirmé {row.confirmed_commission ?? 0}
                  </div>
                </div>
                <span className="tag">{row.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {profile ? null : <div className="hint">Chargement du profil...</div>}
      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
