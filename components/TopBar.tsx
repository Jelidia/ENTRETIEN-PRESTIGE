"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import LogoutButton from "./LogoutButton";
import GlobalSearch from "./search/GlobalSearch";
import { useCompany } from "@/contexts/company/CompanyContext";

type TopBarProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showLogout?: boolean;
};

export default function TopBar({ title, subtitle, actions, showLogout = true }: TopBarProps) {
  const [logoError, setLogoError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { company } = useCompany();
  const companyName = useMemo(() => company?.name ?? "Entreprise", [company?.name]);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

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
        <GlobalSearch />
        <span
          className="pill"
          style={{
            backgroundColor: isOnline ? "#dcfce7" : "#fee2e2",
            color: isOnline ? "#166534" : "#991b1b",
          }}
        >
          {isOnline ? "En ligne" : "Hors ligne"}
        </span>
        {actions}
        {showLogout && <LogoutButton />}
      </div>
    </div>
  );
}
