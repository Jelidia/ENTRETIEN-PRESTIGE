import SideNav from "./SideNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <SideNav />
      <main className="content">{children}</main>
    </div>
  );
}
