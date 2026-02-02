"use client";

import { useState } from "react";
import BottomSheet from "./BottomSheet";

type NoShowDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  customerName: string;
  customerPhone: string;
};

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
    await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: customerPhone,
        message: `Bonjour, nous sommes arrivés à votre adresse mais vous n'êtes pas disponible. Veuillez nous contacter pour reprogrammer. Merci!`,
        jobId,
      }),
    });

    // Log contact attempt
    await fetch(`/api/jobs/${jobId}/no-show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactMethod: "sms",
        attempted: true,
      }),
    });

    setLoading(false);
    alert("SMS sent to customer");
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
      alert("Job marked as no-show. Customer and manager notified.");
      onClose();
    } else {
      setLoading(false);
      alert("Failed to mark as no-show");
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Customer Not Available" height="75%">
      <div className="stack">
        {step === "initial" && (
          <>
            <div className="alert" style={{ background: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.3)", color: "var(--warning)" }}>
              <strong>Customer: {customerName}</strong>
              <div>Phone: {customerPhone}</div>
            </div>

            <h3 style={{ marginTop: "16px" }}>Contact Customer</h3>
            <p className="card-meta">Try calling or texting the customer first.</p>

            <button
              className="button-primary"
              onClick={handleCall}
              style={{ width: "100%", padding: "16px", fontSize: "16px" }}
            >
              📞 CALL CUSTOMER
            </button>

            <button
              className="button-secondary"
              onClick={handleSMS}
              disabled={loading}
              style={{ width: "100%", padding: "16px", fontSize: "16px" }}
            >
              📱 SMS CUSTOMER
            </button>
          </>
        )}

        {step === "calling" && (
          <>
            <div className="card" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏱️</div>
              <h3>Waiting for Response...</h3>
              <p className="card-meta">If customer doesn&apos;t answer within 10 minutes, you can skip to the next job.</p>
            </div>

            <div style={{ marginTop: "24px", padding: "16px", border: "1px dashed var(--line)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <p className="card-meta" style={{ marginBottom: "12px" }}>
                After 10 minutes with no answer:
              </p>
              <button
                className="button-ghost"
                onClick={handleSkip}
                disabled={loading}
                style={{ width: "100%", padding: "14px" }}
              >
                {loading ? "Processing..." : "SKIP TO NEXT JOB"}
              </button>
            </div>
          </>
        )}

        {step === "skipped" && (
          <div className="card" style={{ padding: "24px", textAlign: "center", background: "var(--surface-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h3>Job Marked as No-Show</h3>
            <p className="card-meta" style={{ marginTop: "8px" }}>
              Customer has been notified via SMS.<br />
              Manager and sales rep have been alerted.
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
