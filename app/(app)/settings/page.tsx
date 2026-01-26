import TopBar from "@/components/TopBar";
import NotificationSettingsForm from "@/components/forms/NotificationSettingsForm";

export default function SettingsPage() {
  return (
    <div className="page">
      <TopBar
        title="Settings"
        subtitle="Security, access control, and notifications"
        actions={<button className="button-primary" type="button">Save changes</button>}
      />

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Security controls</h3>
          <div className="list" style={{ marginTop: 12 }}>
            <div className="list-item">
              <div>
                <strong>Two-factor required</strong>
                <div className="card-meta">SMS and authenticator enforced</div>
              </div>
              <span className="tag">Enabled</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Session timeout</strong>
                <div className="card-meta">15 minutes for all roles</div>
              </div>
              <span className="tag">Active</span>
            </div>
            <div className="list-item">
              <div>
                <strong>Account lockout</strong>
                <div className="card-meta">5 attempts, 30 minute hold</div>
              </div>
              <span className="tag">Active</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Notification rules</h3>
          <NotificationSettingsForm />
        </div>
      </div>
    </div>
  );
}
