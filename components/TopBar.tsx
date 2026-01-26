"use client";

type TopBarProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="top-bar">
      <div>
        <div className="card-label">Workspace</div>
        <h1 style={{ margin: "8px 0 4px", fontSize: "28px" }}>{title}</h1>
        {subtitle ? <div className="card-meta">{subtitle}</div> : null}
      </div>
      {actions ? <div className="top-actions">{actions}</div> : null}
    </div>
  );
}
