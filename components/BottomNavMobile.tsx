"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
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
    label: "Home",
    permission: "dashboard",
    roles: ["admin", "manager"],
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
    label: "Schedule",
    permission: "dispatch", // Schedule replaces dispatch
    roles: ["admin", "manager"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <rect x="4" y="5" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 3v4M16 3v4M4 11h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/customers",
    label: "Customers",
    permission: "customers",
    roles: ["admin", "manager"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/team",
    label: "Team",
    permission: "team",
    roles: ["admin", "manager"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path
          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    permission: "settings",
    roles: ["admin", "manager"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 1v6m0 6v6M1 12h6m6 0h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },

  // Sales Rep tabs
  {
    href: "/sales/dashboard",
    label: "Home",
    permission: "dashboard",
    roles: ["sales_rep"],
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
    href: "/sales/leads",
    label: "Leads",
    permission: "customers",
    roles: ["sales_rep"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/sales/schedule",
    label: "Schedule",
    permission: "sales",
    roles: ["sales_rep"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <rect x="4" y="5" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 3v4M16 3v4M4 11h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/sales/earnings",
    label: "Earnings",
    permission: "sales",
    roles: ["sales_rep"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 6v6l4 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/sales/settings",
    label: "Settings",
    permission: "settings",
    roles: ["sales_rep"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 1v6m0 6v6M1 12h6m6 0h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },

  // Technician tabs
  {
    href: "/technician",
    label: "Today",
    permission: "technician",
    roles: ["technician"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/technician/schedule",
    label: "Schedule",
    permission: "technician",
    roles: ["technician"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <rect x="4" y="5" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 3v4M16 3v4M4 11h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/technician/equipment",
    label: "Equipment",
    permission: "technician",
    roles: ["technician"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 9h6M9 13h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/technician/earnings",
    label: "Earnings",
    permission: "technician",
    roles: ["technician"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/technician/profile",
    label: "Settings",
    permission: "settings",
    roles: ["technician"],
    icon: ({ active }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx("bottom-nav-icon", active && "bottom-nav-icon-active")}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
];

export default function BottomNavMobile() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/access", {
      credentials: 'same-origin',
    })
      .then((res) => res.json())
      .then((data) => {
        setPermissions(data.permissions);
        setRole(data.role);
      })
      .catch((err) => console.error("Failed to load permissions", err));
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
