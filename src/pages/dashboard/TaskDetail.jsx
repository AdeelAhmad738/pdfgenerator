import React, { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"
import { fetchActivity } from "../../services/supabaseExtras"
import TaskForm from "../../components/TaskForm"

const formatDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

const formatTime = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  const diff = Date.now() - date.getTime()
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}

function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, updateTask, toggleTaskComplete, invites, respondToInvite, currentUserEmail, currentUserId } = useTasks()
  
  const [isEditing, setIsEditing] = useState(false)
  const [activity, setActivity] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id])

  // Load activity
  useEffect(() => {
    if (!id) return
    setLoadingActivity(true)
    fetchActivity(id)
      .then((data) => setActivity(data || []))
      .catch(() => setActivity([]))
      .finally(() => setLoadingActivity(false))
  }, [id])

  // Check if current user has a pending task invite
  const pendingInvite = useMemo(() => {
    if (!currentUserEmail || !task) return null
    return invites.find(
      (i) =>
        i.task_id === id &&
        (i.to_email || i.email || "").toLowerCase() === currentUserEmail.toLowerCase() &&
        i.status === "pending"
    )
  }, [invites, id, currentUserEmail])

  const isTaskOwner = task?.user_id === currentUserId
  const isAssignee =
    currentUserEmail &&
    (task?.assignedTo || task?.assigned_to_email || "").toLowerCase() === currentUserEmail.toLowerCase() &&
    task?.assignmentStatus === "active"

  if (!task) {
    return (
      <div className="page-content">
        <div className="page-header">
          <button className="link-button" onClick={() => navigate(-1)}>← Back</button>
        </div>
        <div className="empty-state">
          <p>Task not found</p>
        </div>
      </div>
    )
  }

  const handleAcceptTask = async () => {
    if (pendingInvite) {
      await respondToInvite(pendingInvite, "accepted")
    }
  }

  const handleDeclineTask = async () => {
    if (pendingInvite) {
      await respondToInvite(pendingInvite, "declined")
    }
  }

  const handleUpdateTask = async (updates) => {
    await updateTask(task.id, updates)
    setIsEditing(false)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <button className="link-button" onClick={() => navigate(-1)}>← Back to Tasks</button>
      </div>

      {/* Pending Invite Alert */}
      {pendingInvite && (
        <div className="dashboard__panel" style={{ background: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h4 style={{ margin: "0 0 4px 0" }}>📌 Task Assignment</h4>
              <p style={{ margin: "0", color: "#64748b", fontSize: "14px" }}>
                {task.created_by_email || "Your teammate"} assigned you this task
              </p>
            </div>
            <div className="task-tags">
              <button className="button button--small" onClick={handleAcceptTask}>
                Accept
              </button>
              <button className="button button--ghost button--small" onClick={handleDeclineTask}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Header */}
      <div className="dashboard__panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0" }}>{task.title}</h1>
            <p style={{ margin: 0, color: "#64748b" }}>{task.description}</p>
          </div>
          {(isTaskOwner || isAssignee) && (
            <button className="button button--ghost" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "Edit"}
            </button>
          )}
        </div>

        {/* Task Metadata */}
        <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" }}>Status</label>
            <span className={`status-pill status-pill--${task.status}`}>{task.status}</span>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" }}>Priority</label>
            <span className={`priority-pill priority-pill--${task.priority || "medium"}`}>{task.priority || "medium"}</span>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" }}>Assigned To</label>
            <p style={{ margin: 0 }}>{task.assignedTo || task.assigned_to_email || "-"}</p>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" }}>Due Date</label>
            <p style={{ margin: 0 }}>{formatDate(task.deadline)}</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="dashboard__panel">
          <h3>Edit Task</h3>
          <TaskForm
            initialValues={task}
            onSubmit={handleUpdateTask}
            onCancel={() => setIsEditing(false)}
            submitLabel="Update Task"
          />
        </div>
      )}

      {/* Quick Actions */}
      {(isTaskOwner || isAssignee) && !isEditing && (
        <div className="dashboard__panel">
          <div style={{ display: "flex", gap: "10px" }}>
            {task.status !== "completed" && (
              <button className="button" onClick={() => toggleTaskComplete(task.id)}>
                Mark Complete
              </button>
            )}
            {task.status === "completed" && (
              <button className="button button--ghost" onClick={() => toggleTaskComplete(task.id)}>
                Mark Incomplete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="dashboard__panel">
        <h3>Activity</h3>
        {loadingActivity ? (
          <p style={{ color: "#94a3b8" }}>Loading activity...</p>
        ) : activity.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>No activity yet</p>
        ) : (
          <div className="task-list">
            {activity.map((log) => (
              <div key={log.id} className="activity-item">
                <div>
                  <strong>{log.action}</strong>
                  <p className="small-text">
                    by {log.actor_email || "System"} · {formatTime(log.created_at)}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <small style={{ color: "#94a3b8", display: "block", marginTop: "4px" }}>
                      {JSON.stringify(log.details).substring(0, 100)}...
                    </small>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskDetail
