import BottomNavMobile from "./BottomNavMobile";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <div className="app-body">
        <main className="content">{children}</main>
        <BottomNavMobile />
      </div>
    </div>
  );
}
