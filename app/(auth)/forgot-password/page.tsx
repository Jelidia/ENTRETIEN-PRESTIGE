"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to send reset link");
      setLoading(false);
      return;
    }

    setMessage("Reset link sent. Check your inbox.");
    setLoading(false);
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Reset password</h1>
      <p className="card-meta">We will email a secure reset link.</p>
      {error ? <div className="alert" style={{ marginTop: 16 }}>{error}</div> : null}
      {message ? <div className="card" style={{ marginTop: 16 }}>{message}</div> : null}
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
        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <div className="auth-links">
        <Link href="/login">Return to sign in</Link>
      </div>
    </div>
  );
}
