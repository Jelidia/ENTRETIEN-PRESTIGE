"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { formatPhoneNumber } from "@/lib/smsTemplates";

type SMSThread = {
  thread_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: SMSMessage[];
};

type SMSMessage = {
  message_id: string;
  direction: "inbound" | "outbound";
  message_body: string;
  sent_at: string;
  is_read: boolean;
};

export default function InboxPage() {
  const [threads, setThreads] = useState<SMSThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<SMSThread | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadThreads();
  }, []);

  async function loadThreads() {
    setLoading(true);
    const res = await fetch("/api/sms/inbox");
    if (res.ok) {
      const data = await res.json();
      setThreads(data.threads || []);
    }
    setLoading(false);
  }

  async function loadMessages(thread: SMSThread) {
    const res = await fetch(`/api/sms/inbox/${thread.thread_id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedThread({
        ...thread,
        messages: data.messages || [],
      });

      // Mark as read
      await fetch(`/api/sms/inbox/${thread.thread_id}/read`, {
        method: "POST",
      });

      // Refresh threads to update unread count
      loadThreads();
    }
  }

  async function sendReply() {
    if (!selectedThread || !replyMessage.trim()) return;

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

    if (res.ok) {
      setReplyMessage("");
      // Reload messages
      await loadMessages(selectedThread);
    } else {
      alert("Failed to send message");
    }
    setSending(false);
  }

  return (
    <div className="page">
      <TopBar
        title="Inbox"
        subtitle="Two-way SMS conversations"
        actions={
          <button className="button-secondary" onClick={loadThreads}>
            ↻ Refresh
          </button>
        }
      />

      <div className="inbox-container" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px", height: "calc(100vh - 200px)" }}>
        {/* Thread List */}
        <div className="card" style={{ overflow: "auto" }}>
          <h3 className="card-title">Conversations</h3>

          {loading && <p>Loading...</p>}

          {!loading && threads.length === 0 && (
            <p className="card-meta">No conversations yet</p>
          )}

          <div className="list">
            {threads.map((thread) => (
              <div
                key={thread.thread_id}
                className="list-item"
                onClick={() => loadMessages(thread)}
                style={{
                  cursor: "pointer",
                  background: selectedThread?.thread_id === thread.thread_id ? "var(--surface-muted)" : undefined,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{thread.customer_name}</strong>
                    {thread.unread_count > 0 && (
                      <span
                        className="badge badge-warning"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        {thread.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="card-meta">{thread.customer_phone}</div>
                  <div style={{ marginTop: "8px", fontSize: "14px", color: "var(--ink-700)" }}>
                    {thread.last_message.substring(0, 60)}...
                  </div>
                  <div className="card-meta" style={{ marginTop: "4px" }}>
                    {new Date(thread.last_message_at).toLocaleString("fr-CA")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          {!selectedThread && (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--ink-500)" }}>
              Select a conversation to view messages
            </div>
          )}

          {selectedThread && (
            <>
              {/* Thread Header */}
              <div style={{ padding: "16px", borderBottom: "1px solid var(--line)" }}>
                <strong>{selectedThread.customer_name}</strong>
                <div className="card-meta">{selectedThread.customer_phone}</div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedThread.messages.map((msg) => (
                  <div
                    key={msg.message_id}
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
                      {msg.message_body}
                    </div>
                    <div
                      className="card-meta"
                      style={{
                        marginTop: "4px",
                        fontSize: "11px",
                        textAlign: msg.direction === "outbound" ? "right" : "left",
                      }}
                    >
                      {new Date(msg.sent_at).toLocaleTimeString("fr-CA", {
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
                    placeholder="Type your message..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={2}
                    style={{ minHeight: "auto" }}
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
                    disabled={sending || !replyMessage.trim()}
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
