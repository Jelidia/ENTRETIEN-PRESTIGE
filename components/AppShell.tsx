import SideNav, { BottomNav } from "./SideNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <SideNav />
      <div className="app-body">
        <main className="content">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
