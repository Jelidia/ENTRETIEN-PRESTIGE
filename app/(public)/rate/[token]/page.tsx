"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RatingData = {
  job_id: string;
  customer_name: string;
  service_type: string;
  service_date: string;
  technician_name: string;
};

export default function PublicRatingPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [technicianMentioned, setTechnicianMentioned] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadRatingData = useCallback(async () => {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/ratings/validate?token=${params.token}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Token invalide ou expiré");
      setLoading(false);
      return;
    }

    setRatingData(data);
    setLoading(false);
  }, [params.token]);

  useEffect(() => {
    void loadRatingData();
  }, [loadRatingData]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (rating === 0) {
      setError("Veuillez sélectionner une note");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/ratings/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: params.token,
        rating_score: rating,
        feedback: feedback.trim() || null,
        technician_mentioned: technicianMentioned,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Échec de la soumission");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);

    // Redirect to Google review if 4-5 stars
    if (rating >= 4 && data.google_review_url) {
      setTimeout(() => {
        window.location.href = data.google_review_url;
      }, 2000);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>Chargement...</div>
        </div>
      </div>
    );
  }

  if (error && !ratingData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>⚠️ Erreur</h1>
          <p style={styles.error}>{error}</p>
          <p style={styles.meta}>
            Ce lien pourrait avoir expiré ou être invalide.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.title}>Merci!</h1>
          <p style={styles.successText}>
            Votre évaluation a été enregistrée avec succès.
          </p>
          {rating >= 4 && (
            <p style={styles.meta}>
              Vous allez être redirigé vers Google pour laisser un avis public...
            </p>
          )}
          {rating < 4 && (
            <p style={styles.meta}>
              Nous allons examiner vos commentaires et vous contacter si nécessaire.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <h1 style={styles.logoText}>Entretien Prestige</h1>
        </div>

        <h2 style={styles.subtitle}>Évaluez votre service</h2>

        {ratingData && (
          <div style={styles.jobInfo}>
            <div style={styles.infoRow}>
              <span style={styles.label}>Client:</span>
              <span style={styles.value}>{ratingData.customer_name}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Service:</span>
              <span style={styles.value}>{ratingData.service_type}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Date:</span>
              <span style={styles.value}>
                {new Date(ratingData.service_date).toLocaleDateString("fr-CA")}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Technicien:</span>
              <span style={styles.value}>{ratingData.technician_name}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Comment évalueriez-vous notre service?
            </label>
            <div style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    ...styles.starButton,
                    ...(rating >= star ? styles.starActive : {}),
                  }}
                  aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div style={styles.ratingText}>
                {rating === 1 && "Très insatisfait"}
                {rating === 2 && "Insatisfait"}
                {rating === 3 && "Satisfait"}
                {rating === 4 && "Très satisfait"}
                {rating === 5 && "Excellent!"}
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="feedback" style={styles.formLabel}>
              Commentaires (optionnel)
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Partagez votre expérience..."
              style={styles.textarea}
              rows={4}
            />
          </div>

          {rating >= 4 && (
            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={technicianMentioned}
                  onChange={(e) => setTechnicianMentioned(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>
                  Je veux mentionner {ratingData?.technician_name} dans mon avis Google
                  <span style={styles.bonusText}> (Bonus de 5$ pour le technicien!)</span>
                </span>
              </label>
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={submitting || rating === 0}
            style={{
              ...styles.submitButton,
              ...(submitting || rating === 0 ? styles.submitButtonDisabled : {}),
            }}
          >
            {submitting ? "Envoi..." : "Soumettre l'évaluation"}
          </button>

          {rating >= 4 && (
            <p style={styles.googleNotice}>
              Après avoir soumis, vous serez redirigé vers Google pour laisser un avis public.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "600px",
    width: "100%",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  logo: {
    textAlign: "center" as const,
    marginBottom: "24px",
  },
  logoText: {
    fontSize: "24px",
    fontWeight: "bold" as const,
    color: "#1e40af",
    margin: 0,
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold" as const,
    textAlign: "center" as const,
    marginBottom: "16px",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: "20px",
    fontWeight: "600" as const,
    textAlign: "center" as const,
    marginBottom: "24px",
    color: "#475569",
  },
  jobInfo: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  label: {
    fontWeight: "600" as const,
    color: "#64748b",
    fontSize: "14px",
  },
  value: {
    color: "#1e293b",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  formLabel: {
    fontSize: "16px",
    fontWeight: "600" as const,
    color: "#1e293b",
  },
  starContainer: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    padding: "16px 0",
  },
  starButton: {
    fontSize: "48px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#cbd5e1",
    transition: "color 0.2s, transform 0.2s",
    padding: "0 4px",
  },
  starActive: {
    color: "#fbbf24",
    transform: "scale(1.1)",
  },
  ratingText: {
    textAlign: "center" as const,
    fontSize: "18px",
    fontWeight: "600" as const,
    color: "#1e293b",
  },
  textarea: {
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical" as const,
  },
  checkboxGroup: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "8px",
    padding: "16px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    fontSize: "14px",
    color: "#1e293b",
    cursor: "pointer",
  },
  checkbox: {
    marginTop: "2px",
    cursor: "pointer",
  },
  bonusText: {
    color: "#10b981",
    fontWeight: "600" as const,
  },
  submitButton: {
    backgroundColor: "#1e40af",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "600" as const,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  submitButtonDisabled: {
    backgroundColor: "#cbd5e1",
    cursor: "not-allowed",
  },
  googleNotice: {
    fontSize: "13px",
    color: "#64748b",
    textAlign: "center" as const,
    margin: 0,
  },
  loading: {
    textAlign: "center" as const,
    padding: "40px 20px",
    color: "#64748b",
    fontSize: "16px",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    padding: "12px",
    backgroundColor: "#fee2e2",
    borderRadius: "6px",
    textAlign: "center" as const,
  },
  meta: {
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center" as const,
    marginTop: "16px",
  },
  successIcon: {
    fontSize: "64px",
    textAlign: "center" as const,
    color: "#10b981",
    marginBottom: "16px",
  },
  successText: {
    fontSize: "18px",
    textAlign: "center" as const,
    color: "#1e293b",
    marginBottom: "16px",
  },
};
