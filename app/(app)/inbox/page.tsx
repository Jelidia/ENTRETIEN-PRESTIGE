"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";

type SMSThread = {
  thread_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: SMSMessage[];
  assigned_to: string | null;
  assigned_name: string | null;
};

type SMSMessage = {
  sms_id: string;
  direction: "inbound" | "outbound";
  content: string;
  created_at: string;
  is_read: boolean;
};

export default function InboxPage() {
  const [threads, setThreads] = useState<SMSThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<SMSThread | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone });
  };

  async function loadThreads() {
    setLoading(true);
    const res = await fetch("/api/sms/inbox");
    if (res.ok) {
      const data = await res.json();
      setThreads(data.threads || []);
      setCurrentUserId(data.userId ?? "");
    }
    setLoading(false);
  }

  async function loadMessages(thread: SMSThread) {
    const res = await fetch(`/api/sms/inbox/${thread.thread_id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error ?? "Conversation verrouillée.", "error");
      return;
    }
    setSelectedThread({
      ...thread,
      messages: data.messages || [],
    });

    // Mark as read
    const readRes = await fetch(`/api/sms/inbox/${thread.thread_id}/read`, {
      method: "POST",
    });
    if (!readRes.ok) {
      const readData = await readRes.json().catch(() => ({}));
      showToast(readData.error ?? "Impossible de marquer comme lu.", "error");
    }

    // Refresh threads to update unread count
    loadThreads();
  }

  async function sendReply() {
    if (!selectedThread || !replyMessage.trim()) return;
    if (selectedThread.assigned_to && selectedThread.assigned_to !== currentUserId) {
      showToast("Conversation assignée à un autre membre.", "error");
      return;
    }
    if (!selectedThread.customer_phone) {
      showToast("Numéro de téléphone manquant.", "error");
      return;
    }

    setSending(true);
    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: selectedThread.customer_phone,
        message: replyMessage,
        threadId: selectedThread.thread_id,
        customerId: selectedThread.customer_id,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setReplyMessage("");
      // Reload messages
      await loadMessages(selectedThread);
    } else {
      showToast(data.error ?? "Échec de l'envoi du message.", "error");
    }
    setSending(false);
  }

  const isSelectedLocked = Boolean(selectedThread?.assigned_to && selectedThread.assigned_to !== currentUserId);

  return (
    <div className="page">
      {toast ? (
        <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      ) : null}
      <TopBar
        title="Boîte de réception"
        subtitle="Conversations SMS bidirectionnelles"
        actions={
          <button className="button-secondary" onClick={loadThreads}>
            ↻ Rafraîchir
          </button>
        }
      />

      <div className="inbox-container">
        {/* Thread List */}
        <div className="card" style={{ overflow: "auto" }}>
          <h3 className="card-title">Conversations</h3>

          {loading && <p>Chargement...</p>}

          {!loading && threads.length === 0 && (
            <p className="card-meta">Aucune conversation pour l&apos;instant</p>
          )}

          <div className="list">
            {threads.map((thread) => {
              const isLocked = Boolean(thread.assigned_to && thread.assigned_to !== currentUserId);
              const assignmentLabel = thread.assigned_to
                ? isLocked
                  ? `Assignée à ${thread.assigned_name ?? "un collègue"}`
                  : "Assignée à vous"
                : "";
              return (
                <div
                  key={thread.thread_id}
                  className="list-item"
                  onClick={() => {
                    if (isLocked) {
                      showToast(assignmentLabel || "Conversation assignée à un autre membre.", "error");
                      return;
                    }
                    void loadMessages(thread);
                  }}
                  style={{
                    cursor: isLocked ? "not-allowed" : "pointer",
                    opacity: isLocked ? 0.7 : 1,
                    background: selectedThread?.thread_id === thread.thread_id ? "var(--surface-muted)" : undefined,
                  }}
                  aria-disabled={isLocked}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{thread.customer_name}</strong>
                      <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                        {thread.unread_count > 0 && (
                          <span
                            className="badge badge-warning"
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                          >
                            {thread.unread_count}
                          </span>
                        )}
                        {assignmentLabel ? <span className="tag">{assignmentLabel}</span> : null}
                      </div>
                    </div>
                    <div className="card-meta">{thread.customer_phone ?? ""}</div>
                    <div style={{ marginTop: "8px", fontSize: "14px", color: "var(--ink-700)" }}>
                      {thread.last_message.substring(0, 60)}...
                    </div>
                    <div className="card-meta" style={{ marginTop: "4px" }}>
                      {new Date(thread.last_message_at).toLocaleString("fr-CA")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Thread */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          {!selectedThread && (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--ink-500)" }}>
              Sélectionnez une conversation pour voir les messages
            </div>
          )}

          {selectedThread && (
            <>
              {/* Thread Header */}
              <div style={{ padding: "16px", borderBottom: "1px solid var(--line)" }}>
                <strong>{selectedThread.customer_name}</strong>
                <div className="card-meta">{selectedThread.customer_phone ?? ""}</div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedThread.messages.map((msg) => (
                  <div
                    key={msg.sms_id}
                    style={{
                      alignSelf: msg.direction === "outbound" ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: msg.direction === "outbound" ? "var(--accent)" : "var(--surface-muted)",
                        color: msg.direction === "outbound" ? "#fff" : "var(--ink-900)",
                      }}
                    >
                      {msg.content}
                    </div>
                    <div
                      className="card-meta"
                      style={{
                        marginTop: "4px",
                        fontSize: "11px",
                        textAlign: msg.direction === "outbound" ? "right" : "left",
                      }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("fr-CA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div style={{ padding: "16px", borderTop: "1px solid var(--line)" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <textarea
                    className="textarea"
                    placeholder="Écrivez votre message..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={2}
                    style={{ minHeight: "auto" }}
                    disabled={isSelectedLocked}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                  />
                  <button
                    className="button-primary"
                    onClick={sendReply}
                    disabled={sending || !replyMessage.trim() || isSelectedLocked}
                  >
                    {sending ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
                {selectedThread.assigned_to && selectedThread.assigned_to !== currentUserId ? (
                  <div className="hint" style={{ marginTop: "8px" }}>
                    Conversation assignée à un autre membre.
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type ToastTone = "success" | "error";
type ToastState = { message: string; tone: ToastTone };

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
