"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Clear local storage
        localStorage.removeItem("lastPhone");

        // Force full page reload to clear all state
        window.location.href = "/login";
      } else {
        console.error("Logout failed");
        setLoading(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="button-secondary"
      style={{
        padding: "6px 12px",
        fontSize: "14px",
        minWidth: "auto",
      }}
      aria-label="Se déconnecter"
    >
      {loading ? "..." : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ width: 20, height: 20 }}
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}
