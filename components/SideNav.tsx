"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PermissionKey, PermissionMap } from "@/lib/permissions";

// Simplified navigation - fewer items, more intuitive
const navItems: { href: string; label: string; tone: string; permission: PermissionKey }[] = [
  { href: "/dashboard", label: "Home", tone: "#1e40af", permission: "dashboard" },
  { href: "/jobs", label: "Jobs", tone: "#2563eb", permission: "jobs" },
  { href: "/customers", label: "Clients", tone: "#3b82f6", permission: "customers" },
  { href: "/team", label: "Team", tone: "#1e3a8a", permission: "team" },
  { href: "/reports", label: "Reports", tone: "#334155", permission: "reports" },
];

const bottomNavItems: {
  href: string;
  label: string;
  permission: PermissionKey;
  icon: (props: { active: boolean }) => ReactNode;
}[] = [
  {
    href: "/dashboard",
    label: "Home",
    permission: "dashboard",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5a1 1 0 0 1-1-1v-4.5h-3V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/dispatch",
    label: "Dispatch",
    permission: "dispatch",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M4 6h16M4 12h16M4 18h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="18" cy="18" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/jobs",
    label: "Jobs",
    permission: "jobs",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 9h8M8 13h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/customers",
    label: "Clients",
    permission: "customers",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M8 12a4 4 0 1 1 8 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M4 20c1.5-3 4-4.5 8-4.5s6.5 1.5 8 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/invoices",
    label: "Invoices",
    permission: "invoices",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M6 3h8l4 4v14H6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8 11h8M8 15h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/sales",
    label: "Sales",
    permission: "sales",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M4 16l4-4 4 4 6-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="9" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/operations",
    label: "Ops",
    permission: "operations",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M12 4 4 8l8 4 8-4-8-4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M4 12l8 4 8-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M4 16l8 4 8-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    permission: "reports",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path d="M5 19V9M12 19V5M19 19v-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 19h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/notifications",
    label: "Alerts",
    permission: "notifications",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/technician",
    label: "Today",
    permission: "technician",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M12 3v4m0 10v4M4.5 12h4m7 0h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/technician/map",
    label: "Map",
    permission: "technician",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5L3.5 20V6.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9 4v13.5M15 6.5V20" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/technician/customers",
    label: "Customers",
    permission: "technician",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M8 12a4 4 0 1 1 8 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M4 20c1.5-3 4-4.5 8-4.5s6.5 1.5 8 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/technician/earnings",
    label: "Earnings",
    permission: "technician",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M4 6h16v12H4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M7 9h10M7 13h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/technician/profile",
    label: "Profile",
    permission: "technician",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 20c1.8-3.4 4.6-5 8-5s6.2 1.6 8 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    permission: "settings",
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M12 8.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Zm8 3.8-1.7-.3a6.8 6.8 0 0 0-.9-2.1l1-1.4-1.9-1.9-1.4 1a6.8 6.8 0 0 0-2.1-.9L12 4l-2.1.4a6.8 6.8 0 0 0-2.1.9l-1.4-1-1.9 1.9 1 1.4a6.8 6.8 0 0 0-.9 2.1L4 12l.4 2.1c.2.7.5 1.4.9 2.1l-1 1.4 1.9 1.9 1.4-1c.7.4 1.4.7 2.1.9L12 20l2.1-.4c.7-.2 1.4-.5 2.1-.9l1.4 1 1.9-1.9-1-1.4c.4-.7.7-1.4.9-2.1L20 12Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const defaultAppTabs = navItems.map((item) => item.href);

const preferredTabsByRole: Record<string, string[]> = {
  admin: defaultAppTabs,
  manager: defaultAppTabs,
  dispatcher: defaultAppTabs,
  sales_rep: defaultAppTabs,
  technician: [
    "/technician",
    "/technician/map",
    "/technician/customers",
    "/technician/earnings",
    "/technician/profile",
  ],
};

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    let isActive = true;
    fetch("/api/access")
      .then((res) => res.json())
      .then((json) => {
        if (!isActive) return;
        if (json?.permissions) {
          setPermissions(json.permissions as PermissionMap);
        }
        if (json?.role) {
          setRole(String(json.role));
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
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
        {role === "technician" ? (
          <Link href="/technician" className="nav-item">
            <span className="nav-dot" style={{ background: "#10b981" }} aria-hidden="true" />
            <span>Technician view</span>
          </Link>
        ) : null}
        <button className="nav-item" type="button" onClick={handleLogout}>
          <span className="nav-dot" style={{ background: "#ef4444" }} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    let isActive = true;
    fetch("/api/access")
      .then((res) => res.json())
      .then((json) => {
        if (!isActive) return;
        if (json?.permissions) {
          setPermissions(json.permissions as PermissionMap);
        }
        if (json?.role) {
          setRole(String(json.role));
        }
      })
      .catch(() => undefined);
    return () => {
      isActive = false;
    };
  }, []);

  const visibleItems = useMemo(() => {
    const allowed = permissions
      ? bottomNavItems.filter((item) => permissions[item.permission])
      : bottomNavItems;

    const preferred = preferredTabsByRole[role] ?? defaultAppTabs;

    const selected: typeof bottomNavItems = [];
    for (const href of preferred) {
      const item = allowed.find((nav) => nav.href === href);
      if (item) {
        selected.push(item);
      }
    }

    for (const item of allowed) {
      if (!selected.some((existing) => existing.href === item.href)) {
        selected.push(item);
      }
    }

    return selected;
  }, [permissions, role]);

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {visibleItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx("bottom-nav-item", active && "bottom-nav-item-active")}
            aria-current={active ? "page" : undefined}
          >
            {item.icon({ active })}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
