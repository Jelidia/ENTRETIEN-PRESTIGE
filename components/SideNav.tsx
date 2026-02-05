"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useCompany } from "@/contexts/company/CompanyContext";
import type { ReactNode } from "react";
import {
  CustomersOutlineIcon,
  DispatchListIcon,
  EarningsCardIcon,
  GearIcon,
  HomeIcon,
  InvoicesIcon,
  JobsIcon,
  MapIcon,
  NotificationsIcon,
  OperationsStackIcon,
  ProfileIcon,
  ReportsIcon,
  SalesTrendIcon,
  TargetIcon,
} from "@/components/icons/nav-icons";
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
    icon: HomeIcon,
  },
  {
    href: "/dispatch",
    label: "Dispatch",
    permission: "dispatch",
    icon: DispatchListIcon,
  },
  {
    href: "/jobs",
    label: "Jobs",
    permission: "jobs",
    icon: JobsIcon,
  },
  {
    href: "/customers",
    label: "Clients",
    permission: "customers",
    icon: CustomersOutlineIcon,
  },
  {
    href: "/invoices",
    label: "Invoices",
    permission: "invoices",
    icon: InvoicesIcon,
  },
  {
    href: "/sales",
    label: "Sales",
    permission: "sales",
    icon: SalesTrendIcon,
  },
  {
    href: "/operations",
    label: "Ops",
    permission: "operations",
    icon: OperationsStackIcon,
  },
  {
    href: "/reports",
    label: "Reports",
    permission: "reports",
    icon: ReportsIcon,
  },
  {
    href: "/notifications",
    label: "Alerts",
    permission: "notifications",
    icon: NotificationsIcon,
  },
  {
    href: "/technician",
    label: "Today",
    permission: "technician",
    icon: TargetIcon,
  },
  {
    href: "/technician/map",
    label: "Map",
    permission: "technician",
    icon: MapIcon,
  },
  {
    href: "/technician/customers",
    label: "Customers",
    permission: "technician",
    icon: CustomersOutlineIcon,
  },
  {
    href: "/technician/earnings",
    label: "Earnings",
    permission: "technician",
    icon: EarningsCardIcon,
  },
  {
    href: "/technician/profile",
    label: "Profile",
    permission: "technician",
    icon: ProfileIcon,
  },
  {
    href: "/settings",
    label: "Settings",
    permission: "settings",
    icon: GearIcon,
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
  const { company } = useCompany();
  const companyName = company?.name ?? "Entreprise";

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
        <Image
          src="/logo.png"
          alt={`Logo de ${companyName}`}
          width={140}
          height={40}
          priority
          sizes="140px"
          style={{ objectFit: "contain", marginBottom: "8px" }}
        />
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
            <span>Vue technicien</span>
          </Link>
        ) : null}
        <button className="nav-item" type="button" onClick={handleLogout}>
          <span className="nav-dot" style={{ background: "#ef4444" }} aria-hidden="true" />
          <span>Deconnexion</span>
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
