"use client";

import type { PermissionMap } from "@/lib/permissions";
import BottomNavMobile from "./BottomNavMobile";
import { CompanyProvider, type CompanyInfo } from "@/contexts/company/CompanyContext";

type AppShellProps = {
  children: React.ReactNode;
  initialPermissions?: PermissionMap | null;
  initialRole?: string | null;
  initialCompany?: CompanyInfo | null;
};

export default function AppShell({
  children,
  initialPermissions = null,
  initialRole = null,
  initialCompany = null,
}: AppShellProps) {
  return (
    <CompanyProvider initialCompany={initialCompany}>
      <div className="shell">
        <div className="app-body">
          <main className="content">{children}</main>
          <BottomNavMobile initialPermissions={initialPermissions} initialRole={initialRole} />
        </div>
      </div>
    </CompanyProvider>
  );
}
