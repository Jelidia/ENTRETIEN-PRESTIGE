import Link from "next/link";

export default function HomePage() {
  return (
    <main className="hero">
      <div className="hero-card reveal">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="brand-mark" aria-hidden="true" />
          <div className="brand">Entretien Prestige</div>
        </div>
        <h1 className="hero-title" style={{ marginTop: 24 }}>
          Dispatch, quality, and revenue in one secure workspace.
        </h1>
        <p className="hero-subtitle">
          A Homebase-inspired operations hub built for field services. Track jobs, dispatch
          crews, and keep customer records locked to the right role and company.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          <Link className="button-primary" href="/login">
            Sign in
          </Link>
          <Link className="button-secondary" href="/register">
            Create account
          </Link>
        </div>
      </div>

      <div className="hero-card reveal reveal-delay-1">
        <h2 className="card-title">Secure access</h2>
        <p className="card-meta" style={{ marginTop: 8, marginBottom: 16 }}>
          Multi-factor login with short sessions and audit trails.
        </p>
        <div className="form-grid">
          <div className="form-row">
            <div className="label">Identity</div>
            <input className="input" type="text" placeholder="name@company.ca" readOnly />
          </div>
          <div className="form-row">
            <div className="label">Two-factor</div>
            <input className="input" type="text" placeholder="SMS or authenticator" readOnly />
          </div>
          <button className="button-primary" type="button">
            Enforced for every login
          </button>
        </div>
      </div>

      <div className="hero-card reveal reveal-delay-2">
        <h2 className="card-title">Operational focus</h2>
        <div className="kpi-grid" style={{ marginTop: 16 }}>
          <div className="card card-muted">
            <div className="card-label">Today jobs</div>
            <div className="card-value">12</div>
            <div className="card-meta">2 at risk</div>
          </div>
          <div className="card card-muted">
            <div className="card-label">Revenue</div>
            <div className="card-value">$4,250</div>
            <div className="card-meta">+18% vs average</div>
          </div>
          <div className="card card-muted">
            <div className="card-label">Active clients</div>
            <div className="card-value">287</div>
            <div className="card-meta">5 new this month</div>
          </div>
        </div>
      </div>
    </main>
  );
}
