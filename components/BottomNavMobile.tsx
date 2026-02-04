"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { logger } from "@/lib/logger";
import {
  CalendarIcon,
  ClockIcon,
  CustomersGroupIcon,
  DollarIcon,
  EquipmentIcon,
  HomeIcon,
  LeadsIcon,
  SettingsPlusIcon,
  TeamIcon,
  TechnicianTodayIcon,
  UserIcon,
} from "@/components/icons/nav-icons";
import type { PermissionKey, PermissionMap } from "@/lib/permissions";

// MOBILE-FIRST ONLY: 5 tabs per role (per spec)
// Admin: [📊 Home] [📅 Schedule] [👥 Customers] [🧑‍💼 Team] [⚙️ Settings]
// Manager: [📊 Home] [📅 Schedule] [👥 Customers] [🧑‍💼 Team] [⚙️ Settings]
// Sales Rep: [📊 Home] [🎯 Leads & Customers] [📅 My Schedule] [💰 Earnings] [⚙️ Settings]
// Technician: [🏠 Today] [📅 My Schedule] [📸 Equipment Check] [💰 Earnings] [⚙️ Settings]

type NavItem = {
  href: string;
  label: string;
  permission: PermissionKey;
  roles?: string[]; // Only show for specific roles
  icon: (props: { active: boolean }) => ReactNode;
};

const allNavItems: NavItem[] = [
  // Admin/Manager tabs
  {
    href: "/dashboard",
    label: "Accueil",
    permission: "dashboard",
    roles: ["admin", "manager"],
    icon: HomeIcon,
  },
  {
    href: "/dispatch",
    label: "Horaire",
    permission: "dispatch", // Schedule replaces dispatch
    roles: ["admin", "manager"],
    icon: CalendarIcon,
  },
  {
    href: "/customers",
    label: "Clients",
    permission: "customers",
    roles: ["admin", "manager"],
    icon: CustomersGroupIcon,
  },
  {
    href: "/team",
    label: "Équipe",
    permission: "team",
    roles: ["admin", "manager"],
    icon: TeamIcon,
  },
  {
    href: "/settings",
    label: "Paramètres",
    permission: "settings",
    roles: ["admin", "manager"],
    icon: SettingsPlusIcon,
  },

  // Sales Rep tabs
  {
    href: "/sales/dashboard",
    label: "Accueil",
    permission: "dashboard",
    roles: ["sales_rep"],
    icon: HomeIcon,
  },
  {
    href: "/sales/leads",
    label: "Prospects",
    permission: "customers",
    roles: ["sales_rep"],
    icon: LeadsIcon,
  },
  {
    href: "/sales/schedule",
    label: "Horaire",
    permission: "sales",
    roles: ["sales_rep"],
    icon: CalendarIcon,
  },
  {
    href: "/sales/earnings",
    label: "Gains",
    permission: "sales",
    roles: ["sales_rep"],
    icon: ClockIcon,
  },
  {
    href: "/sales/settings",
    label: "Paramètres",
    permission: "settings",
    roles: ["sales_rep"],
    icon: SettingsPlusIcon,
  },

  // Technician tabs
  {
    href: "/technician",
    label: "Aujourd'hui",
    permission: "technician",
    roles: ["technician"],
    icon: TechnicianTodayIcon,
  },
  {
    href: "/technician/schedule",
    label: "Horaire",
    permission: "technician",
    roles: ["technician"],
    icon: CalendarIcon,
  },
  {
    href: "/technician/equipment",
    label: "Équipement",
    permission: "technician",
    roles: ["technician"],
    icon: EquipmentIcon,
  },
  {
    href: "/technician/earnings",
    label: "Gains",
    permission: "technician",
    roles: ["technician"],
    icon: DollarIcon,
  },
  {
    href: "/technician/profile",
    label: "Profil",
    permission: "settings",
    roles: ["technician"],
    icon: UserIcon,
  },
];

type BottomNavMobileProps = {
  initialPermissions?: PermissionMap | null;
  initialRole?: string | null;
};

export default function BottomNavMobile({
  initialPermissions = null,
  initialRole = null,
}: BottomNavMobileProps) {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<PermissionMap | null>(initialPermissions);
  const [role, setRole] = useState<string | null>(initialRole);

  useEffect(() => {
    fetch("/api/access", {
      credentials: "same-origin",
    })
      .then((res) => res.json())
      .then((payload) => {
        const data = payload?.data ?? payload ?? {};
        if (data.permissions) {
          setPermissions(data.permissions);
        }
        if (data.role) {
          setRole(data.role);
        }
      })
      .catch((err) => logger.error("Failed to load permissions", { error: err }));
  }, []);

  if (!permissions || !role) {
    return null;
  }

  // Filter nav items based on role and permissions
  const visibleItems = allNavItems.filter((item) => {
    // Check role restriction
    if (item.roles && !item.roles.includes(role)) {
      return false;
    }
    // Check permission
    return permissions[item.permission];
  });

  // Ensure exactly 5 tabs (spec requirement)
  const tabs = visibleItems.slice(0, 5);

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {tabs.map((item) => {
        // More precise active tab detection
        // Only mark as active if:
        // 1. Exact match, OR
        // 2. Pathname starts with href + "/" (sub-route), but not if it matches a longer href
        let isActive = pathname === item.href;

        if (!isActive && pathname.startsWith(item.href + "/")) {
          // Check if any other tab has a more specific match
          const hasMoreSpecificMatch = tabs.some(
            (otherItem) =>
              otherItem.href !== item.href &&
              otherItem.href.length > item.href.length &&
              (pathname === otherItem.href || pathname.startsWith(otherItem.href + "/"))
          );
          isActive = !hasMoreSpecificMatch;
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx("bottom-nav-item", isActive && "bottom-nav-item-active")}
            aria-current={isActive ? "page" : undefined}
          >
            {item.icon({ active: isActive })}
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
