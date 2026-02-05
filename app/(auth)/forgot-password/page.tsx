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
      setError(data.error ?? "Impossible d'envoyer le lien");
      setLoading(false);
      return;
    }

    setMessage("Lien envoyé. Vérifiez votre courriel.");
    setLoading(false);
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Réinitialiser le mot de passe</h1>
      <p className="card-meta">Nous envoyons un lien sécurisé par courriel.</p>
      {error ? <div className="alert" style={{ marginTop: 16 }}>{error}</div> : null}
      {message ? <div className="card" style={{ marginTop: 16 }}>{message}</div> : null}
      <form className="form-grid" style={{ marginTop: 20 }} onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="label" htmlFor="email">Courriel</label>
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
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>
      <div className="auth-links">
        <Link href="/login">Retour à la connexion</Link>
      </div>
    </div>
  );
}
