import clsx from "clsx";

type NavIconProps = {
  active: boolean;
};

const iconClass = (active: boolean) =>
  clsx("bottom-nav-icon", active && "bottom-nav-icon-active");

export function HomeIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5a1 1 0 0 1-1-1v-4.5h-3V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <rect x="4" y="5" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 3v4M16 3v4M4 11h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CustomersGroupIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TeamIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SettingsPlusIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 1v6m0 6v6M1 12h6m6 0h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LeadsIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClockIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 6v6l4 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TechnicianTodayIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <polyline
        points="12 6 12 12 16 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EquipmentIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 9h6M9 13h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DollarIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function DispatchListIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M4 6h16M4 12h16M4 18h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="18" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

export function JobsIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 9h8M8 13h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CustomersOutlineIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
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
  );
}

export function InvoicesIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
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
  );
}

export function SalesTrendIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
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
  );
}

export function OperationsStackIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
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
  );
}

export function ReportsIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M5 19V9M12 19V5M19 19v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 19h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NotificationsIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function TargetIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M12 3v4m0 10v4M4.5 12h4m7 0h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

export function MapIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5L3.5 20V6.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 4v13.5M15 6.5V20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function EarningsCardIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M4 6h16v12H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7 9h10M7 13h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProfileIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 20c1.8-3.4 4.6-5 8-5s6.2 1.6 8 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GearIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass(active)}>
      <path
        d="M12 8.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Zm8 3.8-1.7-.3a6.8 6.8 0 0 0-.9-2.1l1-1.4-1.9-1.9-1.4 1a6.8 6.8 0 0 0-2.1-.9L12 4l-2.1.4a6.8 6.8 0 0 0-2.1.9l-1.4-1-1.9 1.9 1 1.4a6.8 6.8 0 0 0-.9 2.1L4 12l.4 2.1c.2.7.5 1.4.9 2.1l-1 1.4 1.9 1.9 1.4-1c.7.4 1.4.7 2.1.9L12 20l2.1-.4c.7-.2 1.4-.5 2.1-.9l1.4 1 1.9-1.9-1-1.4c.4-.7.7-1.4.9-2.1L20 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
