"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, fullName, email, phone, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to create account");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="auth-card">
      <div className="brand" style={{ marginBottom: 16 }}>
        <div className="brand-mark" aria-hidden="true" />
        Entretien Prestige
      </div>
      <h1 className="auth-title">Create account</h1>
      <p className="card-meta">Start with an admin workspace and invite your team.</p>
      {error ? <div className="alert" style={{ marginTop: 16 }}>{error}</div> : null}
      <form className="form-grid" style={{ marginTop: 20 }} onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="label" htmlFor="companyName">Company name</label>
          <input
            id="companyName"
            className="input"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            className="input"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>
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
          <label className="label" htmlFor="phone">Phone</label>
          <input
            id="phone"
            className="input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
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
          <div className="hint">Minimum 16 characters with uppercase, number, symbol.</div>
        </div>
        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <div className="auth-links">
        <span>Already have an account?</span>
        <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}
