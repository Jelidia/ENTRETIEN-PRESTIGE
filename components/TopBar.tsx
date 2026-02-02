"use client";

import Image from "next/image";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

type TopBarProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showLogout?: boolean;
};

export default function TopBar({ title, subtitle, actions, showLogout = true }: TopBarProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="top-bar">
      <div className="top-bar-title">
        <div className="brand-avatar" aria-hidden="true">
          {!logoError ? (
            <Image
              className="brand-logo"
              src="/logo.png"
              alt="Entretien Prestige"
              width={140}
              height={40}
              priority
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
          <div className="card-label">Entretien Prestige</div>
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
