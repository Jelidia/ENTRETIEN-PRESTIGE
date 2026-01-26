"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm({ redirect }: { redirect?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to sign in");
      setLoading(false);
      return;
    }

    if (data.mfaRequired) {
      router.push(`/verify-2fa?challenge=${data.challengeId}&redirect=${redirect ?? "/dashboard"}`);
      return;
    }

    router.push(redirect ?? "/dashboard");
  }

  return (
    <div className="auth-card">
      <div className="brand" style={{ marginBottom: 16 }}>
        <div className="brand-mark" aria-hidden="true" />
        Entretien Prestige
      </div>
      <h1 className="auth-title">Sign in</h1>
      <p className="card-meta">Secure access with MFA enforced.</p>
      {error ? <div className="alert" style={{ marginTop: 16 }}>{error}</div> : null}
      <form className="form-grid" style={{ marginTop: 20 }} onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <div className="hint">Minimum 16 characters with mixed types.</div>
        </div>
        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="auth-links">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/register">Create account</Link>
      </div>
    </div>
  );
}
