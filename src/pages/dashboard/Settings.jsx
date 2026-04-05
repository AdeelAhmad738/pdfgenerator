import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { DEFAULT_PREFERENCES, useTasks } from "../../context/TaskContext"

const SettingToggle = ({ icon, label, description, value, onChange }) => (
  <div className="setting-item">
    <div className="setting-info">
      <span className="setting-icon">{icon}</span>
      <div>
        <h4>{label}</h4>
        <p className="small-text">{description}</p>
      </div>
    </div>
    <div
      className={`settings-switch ${value ? "settings-switch--on" : ""}`}
      role="switch"
      tabIndex={0}
      aria-checked={Boolean(value)}
      onClick={() => onChange(!value)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          onChange(!value)
        }
      }}
    >
      <span className="settings-switch__thumb" />
    </div>
  </div>
)

const SettingAction = ({ label, description, actionLabel, onClick }) => (
  <div className="setting-action">
    <div>
      <h4>{label}</h4>
      <p className="small-text">{description}</p>
    </div>
    <button type="button" className="button button--ghost button--small" onClick={onClick}>
      {actionLabel}
    </button>
  </div>
)

const Settings = () => {
  const navigate = useNavigate()
  const { preferences, updatePreference, currentUserEmail } = useTasks()
  const [statusMessage, setStatusMessage] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = () => {
    if (!currentUserEmail) return
    navigator.clipboard.writeText(currentUserEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setStatusMessage("Email copied to clipboard")
  }

  const handleResetPreferences = () => {
    Object.entries(DEFAULT_PREFERENCES).forEach(([key, value]) => {
      updatePreference(key, value)
    })
    setStatusMessage("Preferences reset to defaults")
  }

  const handleClearCache = () => {
    if (typeof localStorage === "undefined") return
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("task_manager_")) {
        localStorage.removeItem(key)
      }
    })
    setStatusMessage("Local cache cleared")
  }

  const handleRequestExport = () => {
    setStatusMessage("Export queued — watch your inbox")
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="small-text">Simplify your workspace preferences.</p>
        </div>
        {statusMessage && <span className="status-chip is-active">{statusMessage}</span>}
      </div>

      <div className="settings-grid settings-grid--wide">
        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>Account & security</h3>
            <p className="small-text">Account controls + quick actions</p>
          </div>
          <div className="settings-section__body">
            <div className="setting-item setting-item--display">
              <div className="setting-info">
                <span className="setting-icon">👤</span>
                <div>
                  <h4>Email address</h4>
                  <p className="setting-value">{currentUserEmail || "No email provided"}</p>
                </div>
              </div>
              <div className="setting-item__actions">
                <button className="button button--small" onClick={handleCopyEmail}>
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button className="button button--ghost button--small" onClick={() => navigate("/dashboard/profile")}>
                  Profile
                </button>
              </div>
            </div>
            <SettingAction
              label="Security center"
              description="Change your password or refresh workspace access."
              actionLabel="Update password"
              onClick={() => navigate("/update-password")}
            />
          </div>
        </section>

        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>Task automation</h3>
            <p className="small-text">Automate routine task behavior</p>
          </div>
          <div className="settings-section__body">
            <SettingToggle
              icon="🧠"
              label="Auto-assign deadlines"
              description="Suggest due dates while creating tasks"
              value={preferences?.autoAssignDueDates}
              onChange={(val) => updatePreference("autoAssignDueDates", val)}
            />
            <SettingToggle
              icon="💾"
              label="Auto-restore drafts"
              description="Bring back unfinished drafts so you can resume faster"
              value={preferences?.autoRestoreDrafts}
              onChange={(val) => updatePreference("autoRestoreDrafts", val)}
            />
            <SettingToggle
              icon="⚠️"
              label="Confirm deletions"
              description="Require confirmation before removing tasks or drafts"
              value={preferences?.confirmDelete}
              onChange={(val) => updatePreference("confirmDelete", val)}
            />
            <SettingToggle
              icon="🧹"
              label="Prevent duplicates"
              description="Warn when a task with the same title exists"
              value={preferences?.preventDuplicateTasks}
              onChange={(val) => updatePreference("preventDuplicateTasks", val)}
            />
          </div>
        </section>

        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>Notifications</h3>
            <p className="small-text">Choose what updates reach you</p>
          </div>
          <div className="settings-section__body">
            <SettingToggle
              icon="📬"
              label="Task assignments"
              description="Notify when you're assigned a task"
              value={preferences?.notifyOnAssign}
              onChange={(val) => updatePreference("notifyOnAssign", val)}
            />
            <SettingToggle
              icon="⏰"
              label="Deadline reminders"
              description="Remind you before deadlines"
              value={preferences?.notifyOnDeadline}
              onChange={(val) => updatePreference("notifyOnDeadline", val)}
            />
            <SettingToggle
              icon="💬"
              label="Comment alerts"
              description="Alert on new comments from collaborators"
              value={preferences?.notifyOnComments}
              onChange={(val) => updatePreference("notifyOnComments", val)}
            />
          </div>
        </section>

        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>Workspace hygiene</h3>
            <p className="small-text">Clean, export, or reset cached data</p>
          </div>
          <div className="settings-section__body">
            <SettingAction
              label="Reset preferences"
              description="Return all toggles to their defaults"
              actionLabel="Reset"
              onClick={handleResetPreferences}
            />
            <SettingAction
              label="Clear cached data"
              description="Remove drafts, cached tasks, and preferences stored locally"
              actionLabel="Clear cache"
              onClick={handleClearCache}
            />
            <SettingAction
              label="Export workspace"
              description="Request a ZIP with tasks, attachments, and history"
              actionLabel="Request export"
              onClick={handleRequestExport}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

export default Settings
