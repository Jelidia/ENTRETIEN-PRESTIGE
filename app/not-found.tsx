import Link from "next/link";

export default function NotFound() {
  return (
    <main className="hero">
      <div className="hero-card">
        <h1 className="hero-title">Page not found</h1>
        <p className="hero-subtitle">Return to the workspace to continue.</p>
        <Link className="button-primary" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
