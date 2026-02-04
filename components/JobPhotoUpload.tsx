"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type PhotoType = "before" | "after";
type PhotoSide = "front" | "back" | "left" | "right";

type Photo = {
  photo_id: string;
  photo_type: PhotoType;
  side: PhotoSide;
  photo_url: string;
  uploaded_at: string;
};

type JobPhotoUploadProps = {
  jobId: string;
  onComplete?: () => void;
};

const PHOTO_SIDES: { value: PhotoSide; label: string; labelFr: string }[] = [
  { value: "front", label: "Front", labelFr: "Avant" },
  { value: "back", label: "Back", labelFr: "Arrière" },
  { value: "left", label: "Left", labelFr: "Gauche" },
  { value: "right", label: "Right", labelFr: "Droite" },
];

const PHOTO_TYPES: { value: PhotoType; label: string; labelFr: string }[] = [
  { value: "before", label: "Before", labelFr: "Avant" },
  { value: "after", label: "After", labelFr: "Après" },
];

export default function JobPhotoUpload({ jobId, onComplete }: JobPhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [missing, setMissing] = useState<Array<{ photo_type: PhotoType; side: PhotoSide }>>([]);
  const [selectedType, setSelectedType] = useState<PhotoType>("before");
  const [selectedSide, setSelectedSide] = useState<PhotoSide>("front");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/jobs/${jobId}/photos`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to load photos");
      setLoading(false);
      return null;
    }

    const payload = {
      photos: data.photos ?? [],
      complete: Boolean(data.complete),
      missing: data.missing ?? [],
    };
    setPhotos(payload.photos);
    setComplete(payload.complete);
    setMissing(payload.missing);
    setLoading(false);

    if (payload.complete && onComplete) {
      onComplete();
    }
    return payload;
  }, [jobId, onComplete]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("photo_type", selectedType);
      formData.append("side", selectedSide);

      const uploadRes = await fetch(`/api/jobs/${jobId}/photos`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? "Failed to upload photo");
      }

      // Reload photos
      const updated = await loadPhotos();

      // Auto-advance to next missing photo
      const nextMissing = updated?.missing?.[0];
      if (nextMissing) {
        setSelectedType(nextMissing.photo_type);
        setSelectedSide(nextMissing.side);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function getPhotoUrl(type: PhotoType, side: PhotoSide): string | null {
    const photo = photos.find((p) => p.photo_type === type && p.side === side);
    return photo?.photo_url ?? null;
  }

  function isPhotoMissing(type: PhotoType, side: PhotoSide): boolean {
    return !photos.some((p) => p.photo_type === type && p.side === side);
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm("Supprimer cette photo?")) return;

    const res = await fetch(`/api/jobs/${jobId}/photos?photo_id=${photoId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to delete photo");
      return;
    }

    await loadPhotos();
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-meta">Chargement des photos...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Photos du travail</h3>
          <div className="card-meta">
            {complete ? (
              <span className="tag" style={{ background: "#10b981", color: "white" }}>
                ✓ Toutes les photos téléchargées (8/8)
              </span>
            ) : (
              <span className="tag" style={{ background: "#f59e0b", color: "white" }}>
                Photos manquantes: {missing.length}/8
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="form-grid" style={{ marginTop: "16px" }}>
        <div className="grid-2">
          <div className="form-row">
            <label className="label" htmlFor="photoType">
              Type de photo
            </label>
            <select
              id="photoType"
              className="select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as PhotoType)}
            >
              {PHOTO_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.labelFr} ({type.label})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="label" htmlFor="photoSide">
              Côté
            </label>
            <select
              id="photoSide"
              className="select"
              value={selectedSide}
              onChange={(e) => setSelectedSide(e.target.value as PhotoSide)}
            >
              {PHOTO_SIDES.map((side) => (
                <option key={side.value} value={side.value}>
                  {side.labelFr} ({side.label})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: "none" }}
          />
          <button
            className="button-primary"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Téléchargement..." : "📷 Prendre photo"}
          </button>
          {getPhotoUrl(selectedType, selectedSide) && (
            <div className="hint" style={{ color: "#10b981" }}>
              ✓ Photo déjà téléchargée (remplacer?)
            </div>
          )}
        </div>

        {error && <div className="alert">{error}</div>}
      </div>

      {/* Photo Grid */}
      <div style={{ marginTop: "24px" }}>
        {PHOTO_TYPES.map((type) => (
          <div key={type.value} style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
              {type.labelFr} ({type.label})
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "12px",
              }}
            >
              {PHOTO_SIDES.map((side) => {
                const photoUrl = getPhotoUrl(type.value, side.value);
                const photo = photos.find(
                  (p) => p.photo_type === type.value && p.side === side.value
                );
                return (
                  <div
                    key={side.value}
                    style={{
                      border: photoUrl ? "2px solid #10b981" : "2px dashed #cbd5e1",
                      borderRadius: "8px",
                      padding: "8px",
                      textAlign: "center",
                      backgroundColor: photoUrl ? "#f0fdf4" : "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: photoUrl ? "#10b981" : "#64748b",
                      }}
                    >
                      {side.labelFr}
                    </div>
                    {photoUrl ? (
                      <>
                        <Image
                          src={photoUrl}
                          alt={`${type.labelFr} - ${side.labelFr}`}
                          width={140}
                          height={100}
                          sizes="140px"
                          style={{
                            width: "100%",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            marginBottom: "8px",
                          }}
                        />
                        <button
                          className="button-ghost"
                          type="button"
                          onClick={() => photo && handleDeletePhoto(photo.photo_id)}
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                        >
                          Supprimer
                        </button>
                      </>
                    ) : (
                      <div
                        style={{
                          height: "100px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "32px",
                          color: "#cbd5e1",
                        }}
                      >
                        📷
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!complete && (
        <div className="alert" style={{ marginTop: "24px" }}>
          <strong>⚠️ Photos obligatoires</strong>
          <div style={{ marginTop: "8px" }}>
            Vous devez télécharger 8 photos (4 avant + 4 après) pour compléter le travail.
          </div>
        </div>
      )}
    </div>
  );
}
