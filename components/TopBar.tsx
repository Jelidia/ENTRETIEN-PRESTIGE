"use client";

type TopBarProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="top-bar">
      <div className="top-bar-title">
        <div className="brand-avatar" aria-hidden="true">
          <img
            className="brand-logo"
            src="/logo.png"
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
        <div>
          <div className="card-label">Workspace</div>
          <h1 style={{ margin: "8px 0 4px", fontSize: "28px" }}>{title}</h1>
          {subtitle ? <div className="card-meta">{subtitle}</div> : null}
        </div>
      </div>
      {actions ? <div className="top-actions">{actions}</div> : null}
    </div>
  );
}
