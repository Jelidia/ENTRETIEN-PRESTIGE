"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", tone: "#1f4d6b" },
  { href: "/dispatch", label: "Dispatch", tone: "#2b7a78" },
  { href: "/jobs", label: "Jobs", tone: "#2f6b4f" },
  { href: "/customers", label: "Customers", tone: "#5a6d8a" },
  { href: "/invoices", label: "Invoices", tone: "#c58b3a" },
  { href: "/sales", label: "Sales", tone: "#8c5f2f" },
  { href: "/operations", label: "Operations", tone: "#4a596b" },
  { href: "/reports", label: "Reports", tone: "#3c5d79" },
  { href: "/notifications", label: "Notifications", tone: "#4d4d4d" },
  { href: "/settings", label: "Settings", tone: "#2c384a" },
];

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();

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
        {navItems.map((item) => {
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
        <Link href="/technician" className="nav-item">
          <span className="nav-dot" style={{ background: "#1d7a53" }} aria-hidden="true" />
          <span>Technician view</span>
        </Link>
        <button className="nav-item" type="button" onClick={handleLogout}>
          <span className="nav-dot" style={{ background: "#b63d3d" }} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
