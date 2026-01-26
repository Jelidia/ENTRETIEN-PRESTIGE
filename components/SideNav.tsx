"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import type { PermissionKey, PermissionMap } from "@/lib/permissions";

const navItems: { href: string; label: string; tone: string; permission: PermissionKey }[] = [
  { href: "/dashboard", label: "Dashboard", tone: "#1f4d6b", permission: "dashboard" },
  { href: "/dispatch", label: "Dispatch", tone: "#2b7a78", permission: "dispatch" },
  { href: "/jobs", label: "Jobs", tone: "#2f6b4f", permission: "jobs" },
  { href: "/customers", label: "Customers", tone: "#5a6d8a", permission: "customers" },
  { href: "/invoices", label: "Invoices", tone: "#c58b3a", permission: "invoices" },
  { href: "/sales", label: "Sales", tone: "#8c5f2f", permission: "sales" },
  { href: "/operations", label: "Operations", tone: "#4a596b", permission: "operations" },
  { href: "/reports", label: "Reports", tone: "#3c5d79", permission: "reports" },
  { href: "/notifications", label: "Notifications", tone: "#4d4d4d", permission: "notifications" },
  { href: "/settings", label: "Settings", tone: "#2c384a", permission: "settings" },
];

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);

  useEffect(() => {
    let isActive = true;
    fetch("/api/access")
      .then((res) => res.json())
      .then((json) => {
        if (isActive && json?.permissions) {
          setPermissions(json.permissions as PermissionMap);
        }
      })
      .catch(() => undefined);
    return () => {
      isActive = false;
    };
  }, []);

  const visibleNavItems = useMemo(() => {
    if (!permissions) {
      return navItems;
    }
    return navItems.filter((item) => permissions[item.permission]);
  }, [permissions]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="side-nav">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true" />
        Entretien Prestige
      </div>
      <nav className="nav-group" aria-label="Primary">
        {visibleNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("nav-item", active && "nav-item-active")}
            >
              <span className="nav-dot" style={{ background: item.tone }} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="nav-group" style={{ marginTop: 32 }}>
        {permissions?.technician !== false ? (
          <Link href="/technician" className="nav-item">
            <span className="nav-dot" style={{ background: "#1d7a53" }} aria-hidden="true" />
            <span>Technician view</span>
          </Link>
        ) : null}
        <button className="nav-item" type="button" onClick={handleLogout}>
          <span className="nav-dot" style={{ background: "#b63d3d" }} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
