"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sanitizeRedirect } from "@/lib/types";

export default function VerifyTwoFactorForm({
  challengeId,
  redirect,
}: {
  challengeId?: string;
  redirect?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeId) {
      setError("Missing verification context.");
      return;
    }
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, code }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to verify code");
      setLoading(false);
      return;
    }

    // Calculate role-aware redirect
    const safeRedirect = sanitizeRedirect(redirect, undefined, data.role);
    router.push(safeRedirect);
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Verify two-factor</h1>
      <p className="card-meta">Enter the code from SMS or authenticator.</p>
      {error ? <div className="alert" style={{ marginTop: 16 }}>{error}</div> : null}
      <form className="form-grid" style={{ marginTop: 20 }} onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="label" htmlFor="code">Verification code</label>
          <input
            id="code"
            className="input"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
        </div>
        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}
