"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginForm({ redirect }: { redirect?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Auto-login check on component mount
  useEffect(() => {
    const lastPhone = localStorage.getItem("lastPhone");
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("ep_access_token="))
      ?.split("=")[1];

    if (lastPhone && sessionToken) {
      // Check if session is valid by calling an API endpoint
      fetch("/api/access")
        .then((res) => {
          if (res.ok) {
            // Valid session - auto-redirect to dashboard
            router.push(redirect ?? "/dashboard");
          } else {
            // Session expired - pre-fill email/phone
            setEmail(lastPhone);
          }
        })
        .catch(() => {
          // Error checking session - pre-fill email/phone
          setEmail(lastPhone);
        });
    } else if (lastPhone) {
      // No session but has remembered phone - pre-fill
      setEmail(lastPhone);
    }
  }, [redirect, router]);

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

    // Store email/phone if "Remember me" is checked
    if (rememberMe) {
      localStorage.setItem("lastPhone", email);
    } else {
      localStorage.removeItem("lastPhone");
    }

    if (data.mfaRequired) {
      router.push(`/verify-2fa?challenge=${data.challengeId}&redirect=${redirect ?? "/dashboard"}`);
      return;
    }

    router.push(redirect ?? "/dashboard");
  }

  return (
    <div className="auth-card">
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Image
          src="/logo.png"
          alt="Entretien Prestige"
          width={180}
          height={50}
          priority
          style={{ objectFit: "contain", margin: "0 auto" }}
        />
        <h2 style={{ marginTop: 16, fontSize: "24px", fontWeight: "bold", color: "#1E40AF" }}>
          Entretien Prestige
        </h2>
        <p style={{ marginTop: 4, fontSize: "14px", color: "#6B7280" }}>
          Faites briller votre maison
        </p>
      </div>
      <h1 className="auth-title">Sign in</h1>
      <p className="card-meta">Enter your credentials to access your account.</p>
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
          <div className="hint">Minimum 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          <label htmlFor="rememberMe" style={{ fontSize: 14, color: "#6B7280", cursor: "pointer" }}>
            Se souvenir de ce numéro
          </label>
        </div>
        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="auth-links">
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
    </div>
  );
}
