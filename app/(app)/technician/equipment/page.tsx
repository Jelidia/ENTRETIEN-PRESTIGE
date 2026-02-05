"use client";

import { useMemo, useState } from "react";

type ChecklistItem = {
  id: string;
  label: string;
  requiresPhoto: boolean;
  checked: boolean;
  notes: string;
};

const baseItems: Omit<ChecklistItem, "checked" | "notes">[] = [
  { id: "ladder", label: "Échelle", requiresPhoto: true },
  { id: "supplies", label: "Fournitures de travail", requiresPhoto: false },
  { id: "vehicle", label: "État du véhicule", requiresPhoto: true },
  { id: "safety", label: "Équipement de sécurité", requiresPhoto: false },
];

function buildItems() {
  return baseItems.map((item) => ({ ...item, checked: false, notes: "" }));
}

export default function TechnicianEquipmentPage() {
  const [startItems, setStartItems] = useState<ChecklistItem[]>(() => buildItems());
  const [endItems, setEndItems] = useState<ChecklistItem[]>(() => buildItems());
  const [status, setStatus] = useState("");

  const startReady = useMemo(() => startItems.every((item) => item.checked), [startItems]);
  const endReady = useMemo(() => endItems.every((item) => item.checked), [endItems]);

  function updateItem(
    list: ChecklistItem[],
    setList: (items: ChecklistItem[]) => void,
    id: string,
    update: Partial<ChecklistItem>
  ) {
    setList(list.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }

  async function submitChecklist(type: "start" | "end") {
    setStatus("");
    const items = type === "start" ? startItems : endItems;
    const ready = type === "start" ? startReady : endReady;
    if (!ready) {
      setStatus("Veuillez compléter chaque élément avant d'envoyer.");
      return;
    }
    const profileRes = await fetch("/api/users/me");
    const profileJson = await profileRes.json().catch(() => null);
    if (!profileRes.ok || !profileJson?.user_id) {
      setStatus(profileJson?.error ?? "Impossible de charger le profil");
      return;
    }

    const now = new Date();
    const payload = {
      technicianId: profileJson.user_id,
      workDate: now.toISOString().slice(0, 10),
      startCompleted: type === "start",
      startTime: type === "start" ? now.toISOString() : undefined,
      startItems:
        type === "start"
          ? items.map((item) => ({
              item: item.label,
              checked: item.checked,
              requiresPhoto: item.requiresPhoto,
              notes: item.notes,
            }))
          : undefined,
      endCompleted: type === "end",
      endTime: type === "end" ? now.toISOString() : undefined,
      endItems:
        type === "end"
          ? items.map((item) => ({
              item: item.label,
              checked: item.checked,
              requiresPhoto: item.requiresPhoto,
              notes: item.notes,
            }))
          : undefined,
      shiftStatus: type,
    };

    const response = await fetch("/api/reports/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Impossible d'envoyer la checklist");
      return;
    }
    setStatus(type === "start" ? "Checklist de début envoyée." : "Checklist de fin envoyée.");
  }

  return (
    <div className="page">
      <div className="tech-header">
        <div>
          <div className="card-label">Vérification de l'équipement</div>
          <div className="tech-title">Début et fin de quart</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Début de quart</h3>
        <div className="stack">
          {startItems.map((item) => (
            <div key={item.id} className="card-muted" style={{ padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(event) =>
                      updateItem(startItems, setStartItems, item.id, { checked: event.target.checked })
                    }
                  />
                  <span>{item.label}</span>
                </label>
                {item.requiresPhoto ? <span className="tag">Photo requise</span> : null}
              </div>
              <textarea
                className="textarea"
                placeholder="Notes"
                value={item.notes}
                onChange={(event) => updateItem(startItems, setStartItems, item.id, { notes: event.target.value })}
                style={{ marginTop: "8px" }}
              />
            </div>
          ))}
        </div>
        <button className="button-primary" type="button" disabled={!startReady} onClick={() => submitChecklist("start")}>
          Soumettre le début de quart
        </button>
      </div>

      <div className="card">
        <h3 className="card-title">Fin de quart</h3>
        <div className="stack">
          {endItems.map((item) => (
            <div key={item.id} className="card-muted" style={{ padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(event) =>
                      updateItem(endItems, setEndItems, item.id, { checked: event.target.checked })
                    }
                  />
                  <span>{item.label}</span>
                </label>
                {item.requiresPhoto ? <span className="tag">Photo requise</span> : null}
              </div>
              <textarea
                className="textarea"
                placeholder="Notes"
                value={item.notes}
                onChange={(event) => updateItem(endItems, setEndItems, item.id, { notes: event.target.value })}
                style={{ marginTop: "8px" }}
              />
            </div>
          ))}
        </div>
        <button className="button-primary" type="button" disabled={!endReady} onClick={() => submitChecklist("end")}>
          Soumettre la fin de quart
        </button>
      </div>

      {status ? <div className="hint">{status}</div> : null}
    </div>
  );
}
