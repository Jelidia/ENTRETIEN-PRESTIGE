import type { PermissionMap } from "@/lib/permissions";
import BottomNavMobile from "./BottomNavMobile";

type AppShellProps = {
  children: React.ReactNode;
  initialPermissions?: PermissionMap | null;
  initialRole?: string | null;
};

export default function AppShell({
  children,
  initialPermissions = null,
  initialRole = null,
}: AppShellProps) {
  return (
    <div className="shell">
      <div className="app-body">
        <main className="content">{children}</main>
        <BottomNavMobile initialPermissions={initialPermissions} initialRole={initialRole} />
      </div>
    </div>
  );
}
