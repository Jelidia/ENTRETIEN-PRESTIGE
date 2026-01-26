"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { useEffect, useState } from "react";

type NotificationRow = {
  notif_id: string;
  title: string;
  body: string;
  status: string;
  is_read: boolean;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function loadNotifications() {
    const response = await fetch("/api/notifications");
    const json = await response.json().catch(() => ({ data: [] }));
    setNotifications(json.data ?? []);
  }

  async function markRead(id: string) {
    setStatus("");
    const response = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to update");
      return;
    }
    void loadNotifications();
  }

  async function removeNotification(id: string) {
    setStatus("");
    const response = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.error ?? "Unable to delete");
      return;
    }
    void loadNotifications();
  }

  return (
    <div className="page">
      <TopBar title="Notifications" subtitle="Recent alerts and updates" />
      <div className="card">
        <div className="list">
          {notifications.map((note) => (
            <div className="list-item" key={note.notif_id}>
              <div>
                <strong>{note.title}</strong>
                <div className="card-meta">{note.body}</div>
              </div>
              <div className="table-actions">
                <StatusBadge status={note.status} />
                {!note.is_read ? (
                  <button className="button-ghost" type="button" onClick={() => markRead(note.notif_id)}>
                    Mark read
                  </button>
                ) : null}
                <button className="button-ghost" type="button" onClick={() => removeNotification(note.notif_id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {status ? <div className="hint">{status}</div> : null}
      </div>
    </div>
  );
}
