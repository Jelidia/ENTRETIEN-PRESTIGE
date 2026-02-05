"use client";

import StatusBadge from "@/components/StatusBadge";
import { useEffect, useState } from "react";

type CustomerRow = {
  customer_id: string;
  first_name: string;
  last_name: string;
  status: string;
  customer_type: string;
  last_service_date?: string;
  account_balance?: number;
};

export default function TechnicianCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadCustomers();
  }, []);

  async function loadCustomers() {
    const response = await fetch("/api/customers");
    const json = await response.json().catch(() => ({ data: [] }));
    if (!response.ok) {
      setStatus(json.error ?? "Impossible de charger les clients");
      return;
    }
    setCustomers(json.data ?? []);
  }

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Clients</div>
          <div className="tech-title">Clients assignés</div>
        </div>
        <button className="button-secondary" type="button">Ajouter un client</button>
      </div>

      <div className="tech-jobs">
        {customers.map((customer) => (
          <div className="mobile-card" key={customer.customer_id}>
            <div className="mobile-card-title">{customer.first_name} {customer.last_name}</div>
            <div className="mobile-card-meta">{customer.customer_type}</div>
            <div className="mobile-card-meta">Dernier service : {customer.last_service_date ?? ""}</div>
            <div className="table-actions">
              <StatusBadge status={customer.status} />
              <span className="tag">{customer.account_balance ? `$${customer.account_balance}` : "$0"}</span>
            </div>
          </div>
        ))}
      </div>
      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
