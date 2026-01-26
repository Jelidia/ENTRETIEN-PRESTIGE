import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { getNotifications } from "@/lib/queries";

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="page">
      <TopBar title="Notifications" subtitle="Recent alerts and updates" />
      <div className="card">
        <div className="list">
          {notifications.map((note) => (
            <div className="list-item" key={note.id}>
              <div>
                <strong>{note.title}</strong>
                <div className="card-meta">{note.detail}</div>
              </div>
              <StatusBadge status={note.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
