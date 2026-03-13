import React from "react"
import { useTasks } from "../../context/TaskContext"

const SETTINGS = [
  {
    group: "Workspace Behavior",
    description: "Control how tasks behave inside your workspace.",
    items: [
      { key: "showCompletedTasks", label: "Show completed tasks in task list" },
      { key: "autoAssignDueDates", label: "Auto assign due date when creating a task" },
      { key: "enableTaskPriority", label: "Enable priority levels for tasks" },
      { key: "preventDuplicateTasks", label: "Prevent duplicate task titles" },
      { key: "confirmDelete", label: "Confirm before deleting tasks" },
      { key: "confirmTaskCompletion", label: "Confirm before marking task complete" }
    ]
  },
  {
    group: "Dashboard & Reports",
    description: "Control what information appears on your dashboard and reports.",
    items: [
      { key: "showProductivityStats", label: "Show productivity statistics panel" },
      { key: "showOverdueTasks", label: "Highlight overdue tasks" },
      { key: "showRecentActivity", label: "Show recent activity panel" },
      { key: "includeCompletedInReports", label: "Include completed tasks in reports" },
      { key: "includePriorityInReports", label: "Include task priority in reports" },
      { key: "enableQuickExport", label: "Enable quick export buttons for reports" }
    ]
  },
  {
    group: "Collaboration & Notifications",
    description: "Manage how you collaborate with teammates and receive updates.",
    items: [
      { key: "notifyOnAssign", label: "Notify when a task is assigned to you" },
      { key: "notifyOnDeadline", label: "Notify before task deadline" },
      { key: "notifyOnComments", label: "Notify when a comment is added to your task" },
      { key: "enableTeamVisibility", label: "Show tasks shared with teammates" }
    ]
  },
  {
    group: "Appearance & Theme",
    description: "Customize workspace look and feel.",
    items: [
      { key: "darkMode", label: "Enable dark mode" },
      { key: "compactView", label: "Enable compact task view" },
      { key: "showAvatars", label: "Show user avatars in task list" }
    ]
  }
]

const Settings = () => {
  const { preferences, updatePreference } = useTasks()

  const renderToggle = (key, label) => (
    <label key={key} className="settings-toggle-row">
      <span>{label}</span>
      <div
        className={`settings-switch ${preferences[key] ? "settings-switch--on" : ""}`}
        onClick={() => updatePreference(key, !preferences[key])}
        role="switch"
        aria-checked={preferences[key]}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") updatePreference(key, !preferences[key])
        }}
      >
        <span className="settings-switch__thumb" />
      </div>
    </label>
  )

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Workspace Settings</h1>
          <p className="small-text">Manage your workspace, dashboard, collaboration, and appearance preferences</p>
        </div>
      </div>

      <div className="settings-list">
        {SETTINGS.map(({ group, description, items }) => (
          <section key={group} className="dashboard__panel settings-section">
            <div className="settings-section__header">
              <h3>{group}</h3>
              <p className="small-text">{description}</p>
            </div>
            <div className="settings-section__body">
              {items.map(({ key, label }) => renderToggle(key, label))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default Settings