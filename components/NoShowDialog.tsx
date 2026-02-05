"use client";

import { useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";

type NoShowDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  customerName: string;
  customerPhone: string;
};

type ToastTone = "success" | "error";
type ToastState = { message: string; tone: ToastTone };

export default function NoShowDialog({
  isOpen,
  onClose,
  jobId,
  customerName,
  customerPhone,
}: NoShowDialogProps) {
  const [step, setStep] = useState<"initial" | "calling" | "skipped">("initial");
  const [contactMethod, setContactMethod] = useState<"call" | "sms" | "none">("none");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone });
  };

  async function handleCall() {
    setStep("calling");
    setContactMethod("call");

    // Log contact attempt
    await fetch(`/api/jobs/${jobId}/no-show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactMethod: "call",
        attempted: true,
      }),
    });

    // Open phone dialer
    window.location.href = `tel:${customerPhone}`;
  }

  async function handleSMS() {
    setContactMethod("sms");
    setLoading(true);

    // Send SMS
    const smsResponse = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: customerPhone,
        message: `Bonjour, nous sommes arrivés à votre adresse mais vous n'êtes pas disponible. Veuillez nous contacter pour reprogrammer. Merci!`,
        jobId,
      }),
    });

    // Log contact attempt
    const logResponse = await fetch(`/api/jobs/${jobId}/no-show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactMethod: "sms",
        attempted: true,
      }),
    });

    setLoading(false);
    if (!smsResponse.ok || !logResponse.ok) {
      showToast("Impossible d'envoyer le SMS.", "error");
      return;
    }
    showToast("SMS envoyé au client.", "success");
  }

  async function handleSkip() {
    setLoading(true);

    // Mark as no-show and notify manager/sales rep
    const res = await fetch(`/api/jobs/${jobId}/no-show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skip: true,
        contactMethod,
      }),
    });

    if (res.ok) {
      // Trigger SMS to customer
      await fetch("/api/sms/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "no_show",
          jobId,
        }),
      });

      setLoading(false);
      setStep("skipped");
      showToast("Travail marqué absent. Le client et le gestionnaire ont été avisés.", "success");
      onClose();
    } else {
      setLoading(false);
      showToast("Impossible de marquer le travail absent.", "error");
    }
  }

  return (
    <>
      {toast ? (
        <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      ) : null}
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Client indisponible" height="75%">
        <div className="stack">
        {step === "initial" && (
          <>
            <div className="alert" style={{ background: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.3)", color: "var(--warning)" }}>
              <strong>Client : {customerName}</strong>
              <div>Téléphone : {customerPhone}</div>
            </div>

            <h3 style={{ marginTop: "16px" }}>Contacter le client</h3>
            <p className="card-meta">Essayez d&apos;abord d&apos;appeler ou d&apos;envoyer un SMS au client.</p>

            <button
              className="button-primary"
              onClick={handleCall}
              style={{ width: "100%", padding: "16px", fontSize: "16px" }}
            >
              📞 APPELER LE CLIENT
            </button>

            <button
              className="button-secondary"
              onClick={handleSMS}
              disabled={loading}
              style={{ width: "100%", padding: "16px", fontSize: "16px" }}
            >
              📱 SMS AU CLIENT
            </button>
          </>
        )}

        {step === "calling" && (
          <>
            <div className="card" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏱️</div>
              <h3>En attente de réponse...</h3>
              <p className="card-meta">Si le client ne répond pas après 10 minutes, vous pouvez passer au prochain travail.</p>
            </div>

            <div style={{ marginTop: "24px", padding: "16px", border: "1px dashed var(--line)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <p className="card-meta" style={{ marginBottom: "12px" }}>
                Après 10 minutes sans réponse :
              </p>
              <button
                className="button-ghost"
                onClick={handleSkip}
                disabled={loading}
                style={{ width: "100%", padding: "14px" }}
              >
                {loading ? "Traitement..." : "PASSER AU PROCHAIN TRAVAIL"}
              </button>
            </div>
          </>
        )}

        {step === "skipped" && (
          <div className="card" style={{ padding: "24px", textAlign: "center", background: "var(--surface-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h3>Travail marqué absent</h3>
            <p className="card-meta" style={{ marginTop: "8px" }}>
              Le client a été avisé par SMS.<br />
              Le gestionnaire et le représentant ont été informés.
            </p>
          </div>
        )}
        </div>
      </BottomSheet>
    </>
  );
}

function Toast({ message, tone, onClose }: { message: string; tone: ToastTone; onClose: () => void }) {
  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" className="toast-close" onClick={onClose}>
        Fermer
      </button>
    </div>
  );
}
