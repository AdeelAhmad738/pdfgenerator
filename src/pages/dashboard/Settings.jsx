import React, { useState } from "react"
import { useTasks } from "../../context/TaskContext"

const Settings = () => {
  const { preferences, updatePreference, currentUserEmail } = useTasks()
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(currentUserEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") onChange(!value)
        }}
      >
        <span className="settings-switch__thumb" />
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="small-text">Manage your preferences and account settings.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* ACCOUNT SECTION */}
        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>Account</h3>
            <p className="small-text">Your account information</p>
          </div>
          <div className="settings-section__body">
            <div className="setting-item setting-item--display">
              <div className="setting-info">
                <span className="setting-icon">👤</span>
                <div>
                  <h4>Email Address</h4>
                  <p className="setting-value">{currentUserEmail}</p>
                </div>
              </div>
              <button className="button button--small" onClick={handleCopyEmail}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </section>

        {/* TASK PREFERENCES */}
        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>Task Preferences</h3>
            <p className="small-text">How tasks should behave</p>
          </div>
          <div className="settings-section__body">
            <SettingToggle
              icon="✓"
              label="Confirm Delete"
              description="Ask before deleting tasks"
              value={preferences.confirmDelete}
              onChange={(val) => updatePreference("confirmDelete", val)}
            />
            <SettingToggle
              icon="🎯"
              label="Auto-assign Deadlines"
              description="Suggest due date when creating tasks"
              value={preferences.autoAssignDueDates}
              onChange={(val) => updatePreference("autoAssignDueDates", val)}
            />
            <SettingToggle
              icon="👁️"
              label="Show Completed Tasks"
              description="Display finished tasks in list view"
              value={preferences.showCompletedTasks}
              onChange={(val) => updatePreference("showCompletedTasks", val)}
            />
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>Notifications</h3>
            <p className="small-text">When to notify you</p>
          </div>
          <div className="settings-section__body">
            <SettingToggle
              icon="📬"
              label="Task Assignments"
              description="Notify when assigned a task"
              value={preferences.notifyOnAssign}
              onChange={(val) => updatePreference("notifyOnAssign", val)}
            />
            <SettingToggle
              icon="⏰"
              label="Deadline Reminders"
              description="Remind before task deadline"
              value={preferences.notifyOnDeadline}
              onChange={(val) => updatePreference("notifyOnDeadline", val)}
            />
            <SettingToggle
              icon="💬"
              label="Comments"
              description="Notify on task comments"
              value={preferences.notifyOnComments}
              onChange={(val) => updatePreference("notifyOnComments", val)}
            />
          </div>
        </section>

        {/* APPEARANCE */}
        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>Appearance</h3>
            <p className="small-text">Visual preferences</p>
          </div>
          <div className="settings-section__body">
            <SettingToggle
              icon="📦"
              label="Compact View"
              description="Reduce spacing and padding"
              value={preferences.compactView}
              onChange={(val) => updatePreference("compactView", val)}
            />
          </div>
        </section>

        {/* PRIVACY & TEAM */}
        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>Collaboration</h3>
            <p className="small-text">Team visibility settings</p>
          </div>
          <div className="settings-section__body">
            <SettingToggle
              icon="👥"
              label="Team Visibility"
              description="Allow team to see your profile"
              value={preferences.enableTeamVisibility}
              onChange={(val) => updatePreference("enableTeamVisibility", val)}
            />
            <SettingToggle
              icon="📊"
              label="Share Stats"
              description="Show productivity stats to team"
              value={preferences.showProductivityStats}
              onChange={(val) => updatePreference("showProductivityStats", val)}
            />
          </div>
        </section>

        {/* ABOUT */}
        <section className="dashboard__panel settings-section">
          <div className="settings-section__header">
            <h3>About</h3>
            <p className="small-text">App information</p>
          </div>
          <div className="settings-section__body">
            <div className="about-item">
              <span>Version</span>
              <strong>1.0.0</strong>
            </div>
            <div className="about-item">
              <span>Database</span>
              <strong>Supabase</strong>
            </div>
            <div className="about-item">
              <span>Last Updated</span>
              <strong>{new Date().toLocaleDateString()}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Settings
