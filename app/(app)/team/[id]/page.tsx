"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";

type TeamProfile = {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  id_document_front_url?: string | null;
  id_document_back_url?: string | null;
  contract_document_url?: string | null;
  contract_signature_url?: string | null;
  contract_signed_at?: string | null;
};

const docConfig = [
  { key: "id_front", label: "ID front", hint: "Driver license or passport" },
  { key: "id_back", label: "ID back", hint: "Back side if applicable" },
  { key: "contract", label: "Contract file", hint: "Signed agreement PDF" },
  { key: "signature", label: "Signature", hint: "Signature image" },
];

const docFieldMap: Record<string, keyof TeamProfile> = {
  id_front: "id_document_front_url",
  id_back: "id_document_back_url",
  contract: "contract_document_url",
  signature: "contract_signature_url",
};

export default function TeamProfilePage() {
  const params = useParams();
  const userId = useMemo(() => {
    const raw = params?.id;
    if (Array.isArray(raw)) return raw[0] ?? "";
    return raw ?? "";
  }, [params]);

  const [profile, setProfile] = useState<TeamProfile | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    country: "CA",
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!userId) return;
    void loadProfile(userId);
  }, [userId]);

  async function loadProfile(id: string) {
    setStatus("");
    const response = await fetch(`/api/users/${id}`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to load team member");
      return;
    }
    const data = json.data as TeamProfile;
    setProfile(data);
    setForm({
      full_name: data.full_name ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      province: data.province ?? "",
      postal_code: data.postal_code ?? "",
      country: data.country ?? "CA",
    });
  }

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setStatus("");
    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to save profile");
      return;
    }
    setProfile(json.data as TeamProfile);
    setStatus("Profile saved.");
  }

  async function uploadDocument(docType: string, file: File) {
    if (!userId) return;
    setStatus("");
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("docType", docType);
    formData.append("file", file);
    const response = await fetch("/api/uploads", { method: "POST", body: formData });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to upload document");
      return;
    }
    const field = docFieldMap[docType];
    setProfile((prev) => (prev ? { ...prev, [field]: json.path } : prev));
    if (docType === "signature") {
      setProfile((prev) => (prev ? { ...prev, contract_signed_at: new Date().toISOString() } : prev));
    }
    setStatus("Document uploaded.");
  }

  async function openDocument(docType: string) {
    if (!userId) return;
    const response = await fetch(`/api/documents?userId=${userId}&docType=${docType}`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.url) {
      setStatus(json.error ?? "Unable to open document");
      return;
    }
    window.open(json.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="page">
      <TopBar
        title="Team profile"
        subtitle="Identity, address, and contract documentation"
        actions={
          <Link className="button-ghost" href="/settings">
            Back to Settings
          </Link>
        }
      />

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Profile details</h3>
              <div className="card-meta">Keep contact and address up to date.</div>
            </div>
          </div>
          <form className="form-grid" onSubmit={saveProfile}>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="profileName">Full name</label>
                <input
                  id="profileName"
                  className="input"
                  value={form.full_name}
                  onChange={(event) => updateField("full_name", event.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="profileEmail">Email</label>
                <input
                  id="profileEmail"
                  className="input"
                  value={profile?.email ?? ""}
                  disabled
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="profilePhone">Phone</label>
                <input
                  id="profilePhone"
                  className="input"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="profileRole">Role</label>
                <input
                  id="profileRole"
                  className="input"
                  value={profile?.role ?? ""}
                  disabled
                />
              </div>
            </div>
            <div className="form-row">
              <label className="label" htmlFor="profileAddress">Address</label>
              <input
                id="profileAddress"
                className="input"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
              />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="profileCity">City</label>
                <input
                  id="profileCity"
                  className="input"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="profileProvince">Province</label>
                <input
                  id="profileProvince"
                  className="input"
                  value={form.province}
                  onChange={(event) => updateField("province", event.target.value)}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label className="label" htmlFor="profilePostal">Postal code</label>
                <input
                  id="profilePostal"
                  className="input"
                  value={form.postal_code}
                  onChange={(event) => updateField("postal_code", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="label" htmlFor="profileCountry">Country</label>
                <input
                  id="profileCountry"
                  className="input"
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                />
              </div>
            </div>
            <button className="button-primary" type="submit">
              Save profile
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Documents</h3>
              <div className="card-meta">Upload ID and contract files.</div>
            </div>
          </div>
          <div className="list">
            {docConfig.map((doc) => {
              const field = docFieldMap[doc.key];
              const hasFile = Boolean(profile?.[field]);
              return (
                <div key={doc.key} className="list-item" style={{ alignItems: "center" }}>
                  <div>
                    <strong>{doc.label}</strong>
                    <div className="card-meta">{doc.hint}</div>
                  </div>
                  <div className="table-actions">
                    <label className="button-secondary" style={{ cursor: "pointer" }}>
                      Upload
                      <input
                        type="file"
                        style={{ display: "none" }}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          if (file) {
                            void uploadDocument(doc.key, file);
                          }
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {hasFile ? (
                      <button className="button-ghost" type="button" onClick={() => openDocument(doc.key)}>
                        View
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card-meta" style={{ marginTop: 12 }}>
            {profile?.contract_signed_at
              ? `Signed on ${new Date(profile.contract_signed_at).toLocaleDateString()}`
              : "Signature date will appear here once uploaded."}
          </div>
        </div>
      </div>

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
