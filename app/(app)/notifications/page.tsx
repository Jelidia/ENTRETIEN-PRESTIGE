"use client";

import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { useEffect, useMemo, useState } from "react";

type NotificationRow = {
  notif_id: string;
  title: string;
  body: string;
  status: string;
  is_read: boolean;
};

type NotificationGroup = {
  key: string;
  title: string;
  body: string;
  status: string;
  ids: string[];
  count: number;
  unreadCount: number;
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

  async function markReadIds(ids: string[]) {
    if (ids.length === 0) return;
    setStatus("");
    for (const id of ids) {
      const response = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(json.error ?? "Impossible de mettre a jour");
        return;
      }
    }
    void loadNotifications();
  }

  async function removeNotificationIds(ids: string[]) {
    if (ids.length === 0) return;
    setStatus("");
    for (const id of ids) {
      const response = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(json.error ?? "Impossible de supprimer");
        return;
      }
    }
    void loadNotifications();
  }

  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, NotificationGroup>();
    notifications.forEach((note) => {
      const key = `${note.title}::${note.body}::${note.status}`;
      const existing = groups.get(key);
      if (existing) {
        existing.ids.push(note.notif_id);
        existing.count += 1;
        if (!note.is_read) {
          existing.unreadCount += 1;
        }
        return;
      }
      groups.set(key, {
        key,
        title: note.title,
        body: note.body,
        status: note.status,
        ids: [note.notif_id],
        count: 1,
        unreadCount: note.is_read ? 0 : 1,
      });
    });
    return Array.from(groups.values());
  }, [notifications]);

  const unreadIds = useMemo(
    () => notifications.filter((note) => !note.is_read).map((note) => note.notif_id),
    [notifications]
  );

  return (
    <div className="page">
      <TopBar
        title="Notifications"
        subtitle="Alertes et mises a jour recentes"
        actions={(
          <button
            className={`button-secondary${unreadIds.length === 0 ? " disabled" : ""}`}
            type="button"
            onClick={() => markReadIds(unreadIds)}
            disabled={unreadIds.length === 0}
          >
            Tout marquer lu
          </button>
        )}
      />
      <div className="card">
        <div className="list">
          {groupedNotifications.map((group) => {
            const hasUnread = group.unreadCount > 0;
            const title = group.count > 1 ? `${group.count} ${group.title}` : group.title;
            return (
              <div className="list-item" key={group.key}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong>{title}</strong>
                  </div>
                  <div className="card-meta">{group.body}</div>
                </div>
                <div className="table-actions">
                  <StatusBadge status={group.status} />
                  {hasUnread ? (
                    <button className="button-ghost" type="button" onClick={() => markReadIds(group.ids)}>
                      Marquer lu
                    </button>
                  ) : null}
                  <button className="button-ghost" type="button" onClick={() => removeNotificationIds(group.ids)}>
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {status ? <div className="hint">{status}</div> : null}
      </div>
    </div>
  );
}
