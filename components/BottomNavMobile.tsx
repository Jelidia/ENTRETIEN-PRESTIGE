"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
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

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  roles?: string[];
  permission?: PermissionKey;
  keywords?: string[];
  kind?: "page" | "action";
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

const commandNavItems: CommandItem[] = allNavItems.map((item) => ({
  id: `nav-${item.href}`,
  label: item.label,
  href: item.href,
  roles: item.roles,
  permission: item.permission,
  kind: "page",
}));

const extraCommandItems: CommandItem[] = [
  {
    id: "admin-jobs",
    label: "Jobs",
    description: "Travaux actifs et suivi",
    href: "/jobs",
    roles: ["admin", "manager"],
    permission: "jobs",
    kind: "page",
  },
  {
    id: "admin-invoices",
    label: "Factures",
    description: "Facturation et encaissements",
    href: "/invoices",
    roles: ["admin", "manager"],
    permission: "invoices",
    kind: "page",
  },
  {
    id: "admin-operations",
    label: "Opérations",
    description: "Qualité et checklists",
    href: "/operations",
    roles: ["admin", "manager"],
    permission: "operations",
    kind: "page",
  },
  {
    id: "admin-notifications",
    label: "Notifications",
    description: "Alertes et activité",
    href: "/notifications",
    roles: ["admin", "manager", "technician"],
    permission: "notifications",
    kind: "page",
  },
  {
    id: "admin-inbox",
    label: "Boîte de réception",
    description: "Conversations SMS",
    href: "/inbox",
    roles: ["admin", "manager"],
    permission: "notifications",
    kind: "page",
  },
  {
    id: "admin-profile",
    label: "Profil",
    description: "Informations personnelles",
    href: "/profile",
    roles: ["admin", "manager"],
    permission: "settings",
    kind: "page",
  },
  {
    id: "admin-sales",
    label: "Ventes",
    description: "Tableaux et territoires",
    href: "/sales",
    roles: ["admin", "manager"],
    permission: "sales",
    kind: "page",
  },
  {
    id: "tech-map",
    label: "Carte",
    description: "Positions et itinéraire",
    href: "/technician/map",
    roles: ["technician"],
    permission: "technician",
    kind: "page",
  },
  {
    id: "tech-customers",
    label: "Clients",
    description: "Clients assignés",
    href: "/technician/customers",
    roles: ["technician"],
    permission: "customers",
    kind: "page",
  },
];

const actionCommandItems: CommandItem[] = [
  {
    id: "action-job-create",
    label: "Créer un job",
    description: "Aller à la création de job",
    href: "/jobs",
    roles: ["admin", "manager"],
    permission: "jobs",
    keywords: ["nouveau", "travail", "creation", "job"],
    kind: "action",
  },
  {
    id: "action-invoice-create",
    label: "Créer une facture",
    description: "Aller à la création de facture",
    href: "/invoices",
    roles: ["admin", "manager"],
    permission: "invoices",
    keywords: ["nouvelle", "facture", "creation"],
    kind: "action",
  },
  {
    id: "action-customer-create",
    label: "Créer un client",
    description: "Aller à l'ajout de client",
    href: "/customers",
    roles: ["admin", "manager"],
    permission: "customers",
    keywords: ["nouveau", "client", "creation"],
    kind: "action",
  },
  {
    id: "action-lead-create",
    label: "Créer un prospect",
    description: "Aller à la création de prospect",
    href: "/sales/leads",
    roles: ["sales_rep", "admin", "manager"],
    permission: "sales",
    keywords: ["nouveau", "prospect", "lead"],
    kind: "action",
  },
];

const commandItems = [...commandNavItems, ...extraCommandItems, ...actionCommandItems];

type CommandPaletteProps = {
  permissions: PermissionMap;
  role: string;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function CommandPalette({ permissions, role }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (open && key === "escape") {
        event.preventDefault();
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (inputRef.current) {
      inputRef.current.focus();
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const availableItems = useMemo(
    () =>
      commandItems.filter((item) => {
        if (item.roles && !item.roles.includes(role)) {
          return false;
        }
        if (item.permission && !permissions[item.permission]) {
          return false;
        }
        return true;
      }),
    [permissions, role]
  );

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return availableItems;
    return availableItems.filter((item) => {
      const haystack = [
        item.label,
        item.description ?? "",
        ...(item.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [availableItems, query]);

  useEffect(() => {
    if (!filteredItems.length) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(0);
    }
  }, [filteredItems, activeIndex]);

  function closePalette() {
    setOpen(false);
  }

  function handleSelect(item: CommandItem) {
    closePalette();
    router.push(item.href);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => {
        if (!filteredItems.length) return 0;
        return prev === 0 ? filteredItems.length - 1 : prev - 1;
      });
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const item = filteredItems[activeIndex];
      if (item) {
        handleSelect(item);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="command-palette-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={() => closePalette()}
    >
      <div className="command-palette-card" onClick={(event) => event.stopPropagation()}>
        <div className="command-palette-header">
          <div>
            <div className="card-label">Commande rapide</div>
            <div className="card-meta">Tapez pour naviguer ou lancer une action.</div>
          </div>
          <span className="tag">Ctrl + K</span>
        </div>
        <input
          ref={inputRef}
          className="input command-palette-input"
          placeholder="Rechercher une page ou une action"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleInputKeyDown}
          onClick={(event) => event.stopPropagation()}
          onFocus={(event) => event.target.select()}
        />
        <div className="command-palette-list">
          {filteredItems.length === 0 ? (
            <div className="card-meta">Aucun résultat.</div>
          ) : null}
          {filteredItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="command-palette-item"
              data-active={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={(event) => {
                if (isEditableTarget(event.target)) return;
                handleSelect(item);
              }}
            >
              <div>
                <strong>{item.label}</strong>
                {item.description ? (
                  <div className="command-palette-item-meta">{item.description}</div>
                ) : null}
              </div>
              <span className="tag">{item.kind === "action" ? "Action" : "Page"}</span>
            </button>
          ))}
        </div>
        <div className="command-palette-footer">
          <div className="command-palette-hint">Entrée pour ouvrir · Échap pour fermer</div>
          <div className="command-palette-hint">Flèches pour naviguer</div>
        </div>
      </div>
    </div>
  );
}

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
    <>
      <CommandPalette permissions={permissions} role={role} />
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
    </>
  );
}
