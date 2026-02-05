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
      setError(data.error ?? "Impossible de reinitialiser le mot de passe");
      setLoading(false);
      return;
    }

    setMessage("Mot de passe mis a jour. Vous pouvez vous connecter.");
    setLoading(false);
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Nouveau mot de passe</h1>
      <p className="card-meta">Choisissez un mot de passe securise.</p>
      {error ? <div className="alert" style={{ marginTop: 16 }}>{error}</div> : null}
      {message ? <div className="card" style={{ marginTop: 16 }}>{message}</div> : null}
      <form className="form-grid" style={{ marginTop: 20 }} onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="label" htmlFor="password">Nouveau mot de passe</label>
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
          {loading ? "Mise a jour..." : "Mettre a jour"}
        </button>
      </form>
    </div>
  );
}
