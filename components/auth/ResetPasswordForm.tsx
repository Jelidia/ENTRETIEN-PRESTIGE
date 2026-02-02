"use client";

import { useState } from "react";

export default function ResetPasswordForm({ code }: { code?: string }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to reset password");
      setLoading(false);
      return;
    }

    setMessage("Password updated. You can sign in now.");
    setLoading(false);
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Set new password</h1>
      <p className="card-meta">Choose a strong password to continue.</p>
      {error ? <div className="alert" style={{ marginTop: 16 }}>{error}</div> : null}
      {message ? <div className="card" style={{ marginTop: 16 }}>{message}</div> : null}
      <form className="form-grid" style={{ marginTop: 20 }} onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="label" htmlFor="password">New password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
