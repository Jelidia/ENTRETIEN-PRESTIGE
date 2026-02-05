"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import LogoutButton from "./LogoutButton";
import { useCompany } from "@/contexts/company/CompanyContext";

type TopBarProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showLogout?: boolean;
};

export default function TopBar({ title, subtitle, actions, showLogout = true }: TopBarProps) {
  const [logoError, setLogoError] = useState(false);
  const { company } = useCompany();
  const companyName = useMemo(() => company?.name ?? "Entreprise", [company?.name]);

  return (
    <div className="top-bar">
      <div className="top-bar-title">
        <div className="brand-avatar" aria-hidden="true">
          {!logoError ? (
            <Image
              className="brand-logo"
              src="/logo.png"
              alt={`Logo de ${companyName}`}
              width={140}
              height={40}
              priority
              sizes="44px"
              onError={() => setLogoError(true)}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: "140px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "18px",
                color: "#1E40AF"
              }}
            >
              EP
            </div>
          )}
        </div>
          <div>
          <div className="card-label">{companyName}</div>
            <h1 style={{ margin: "8px 0 4px", fontSize: "28px" }}>{title}</h1>
            {subtitle ? <div className="card-meta">{subtitle}</div> : null}
          </div>
      </div>
      <div className="top-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {actions}
        {showLogout && <LogoutButton />}
      </div>
    </div>
  );
}
