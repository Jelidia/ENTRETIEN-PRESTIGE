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

const MAX_UPLOAD_FILES = 10;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

export default function JobPhotoUpload({ jobId, onComplete }: JobPhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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
      setError(data.error ?? "Impossible de charger les photos");
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

  async function uploadPhoto(file: File, photoType: PhotoType, side: PhotoSide) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("photo_type", photoType);
    formData.append("side", side);

    const uploadRes = await fetch(`/api/jobs/${jobId}/photos`, {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json().catch(() => ({}));

    if (!uploadRes.ok) {
      throw new Error(uploadData.error ?? "Impossible de téléverser la photo");
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files ?? []);
    if (!list.length) return;

    const limited = list.slice(0, MAX_UPLOAD_FILES);
    const isBatch = limited.length > 1;
    const targets = isBatch
      ? [...missing]
      : [{ photo_type: selectedType, side: selectedSide }];

    if (isBatch && targets.length === 0) {
      setError("Toutes les photos requises sont déjà téléversées.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    setError("");

    let uploadedAny = false;
    let finalError = "";

    try {
      for (const file of limited) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Veuillez choisir un fichier image.");
        }
        if (file.size > MAX_UPLOAD_SIZE) {
          throw new Error("L'image doit faire moins de 5 Mo.");
        }
        const target = isBatch ? targets.shift() : targets[0];
        if (!target) {
          throw new Error("Il n'y a plus d'emplacements manquants.");
        }
        await uploadPhoto(file, target.photo_type, target.side);
        uploadedAny = true;
      }
    } catch (err) {
      finalError = err instanceof Error ? err.message : "Impossible de téléverser la photo.";
    }

    const updated = uploadedAny ? await loadPhotos() : null;
    const nextMissing = updated?.missing?.[0];
    if (nextMissing) {
      setSelectedType(nextMissing.photo_type);
      setSelectedSide(nextMissing.side);
    }

    if (!finalError && list.length > MAX_UPLOAD_FILES) {
      finalError = `Maximum ${MAX_UPLOAD_FILES} photos à la fois.`;
    }

    if (finalError) {
      setError(finalError);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    await handleFiles(files);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (uploading) return;
    setDragActive(true);
  }

  function handleDragLeave() {
    setDragActive(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (uploading) return;
    setDragActive(false);
    if (event.dataTransfer.files?.length) {
      void handleFiles(event.dataTransfer.files);
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
      setError(data.error ?? "Impossible de supprimer la photo");
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
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-disabled={uploading}
            style={{
              border: `2px dashed ${dragActive ? "#2563eb" : "#cbd5e1"}`,
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              background: dragActive ? "rgba(37, 99, 235, 0.08)" : "rgba(148, 163, 184, 0.08)",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.6 : 1,
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontWeight: 600 }}>Glissez jusqu'à 10 photos ici</div>
            <div className="card-meta">Ou cliquez pour sélectionner. Les lots remplissent les photos manquantes.</div>
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
            multiple
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
