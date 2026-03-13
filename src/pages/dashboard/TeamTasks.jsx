import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"
import TaskCard from "../../components/TaskCard"

function TeamTasks() {
  const navigate = useNavigate()
  const { tasks, toggleTaskComplete, deleteTask, currentUserEmail, invites } = useTasks()

  const assignedToMe = tasks.filter((t) => {
    const assignedTo = (t.assignedTo || t.assigned_to_email || "").toLowerCase()
    return currentUserEmail && assignedTo === currentUserEmail.toLowerCase()
  })

  const assignedByMe = tasks.filter((t) => {
    const createdBy = (t.createdByEmail || t.created_by_email || "").toLowerCase()
    return currentUserEmail && createdBy === currentUserEmail.toLowerCase() && (t.assignedTo || t.assigned_to_email)
  })

  const pendingInvites = useMemo(() => {
    const email = (currentUserEmail || "").toLowerCase()
    return invites.filter(
      (i) => (i.to_email || i.email || "").toLowerCase() === email && i.status === "pending"
    )
  }, [invites, currentUserEmail])

  const teamStats = useMemo(() => ({
    assignedToMe: assignedToMe.length,
    assignedByMe: assignedByMe.length,
    completed: assignedToMe.filter((t) => t.status === "completed" || t.status === "complete").length,
    pending: pendingInvites.length,
  }), [assignedToMe, assignedByMe, pendingInvites])

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Team Tasks</h1>
          <p className="small-text">Work assigned to you and tasks you've delegated.</p>
        </div>
        <div className="page-actions">
          <button className="button button--ghost" type="button" onClick={() => navigate("/dashboard/collaboration")}>
            Manage invites
          </button>
          <button className="button" type="button" onClick={() => navigate("/dashboard/create")}>
            + New Task
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="report-stats-row">
        <div className="report-stat-card report-stat-card--accent">
          <span className="report-stat-card__value">{teamStats.assignedToMe}</span>
          <span className="report-stat-card__label">Assigned to Me</span>
        </div>
        <div className="report-stat-card report-stat-card--success">
          <span className="report-stat-card__value">{teamStats.completed}</span>
          <span className="report-stat-card__label">Completed</span>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-card__value">{teamStats.assignedByMe}</span>
          <span className="report-stat-card__label">Delegated by Me</span>
        </div>
        <div className="report-stat-card report-stat-card--warning">
          <span className="report-stat-card__value">{teamStats.pending}</span>
          <span className="report-stat-card__label">Pending Invites</span>
        </div>
      </div>

      <div className="dashboard__grid--two">
        <section className="dashboard__panel">
          <div className="dashboard__panel-header">
            <h3>Assigned to Me</h3>
            <span className="status-pill status-pill--progress">{assignedToMe.length}</span>
          </div>
          {assignedToMe.length === 0 ? (
            <div className="empty-state empty-state--small">
              <div className="empty-state__icon">📋</div>
              <p>No tasks assigned to you yet.</p>
            </div>
          ) : (
            <div className="task-list">
              {assignedToMe.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                  onToggleComplete={() => toggleTaskComplete(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="dashboard__panel dashboard__panel--soft">
          <div className="dashboard__panel-header">
            <h3>Delegated by Me</h3>
            <span className="status-pill">{assignedByMe.length}</span>
          </div>
          {assignedByMe.length === 0 ? (
            <div className="empty-state empty-state--small">
              <div className="empty-state__icon">🤝</div>
              <p>You haven't assigned any tasks yet.</p>
              <button className="button button--ghost" type="button" onClick={() => navigate("/dashboard/create")}>
                Create & assign a task
              </button>
            </div>
          ) : (
            <div className="task-list">
              {assignedByMe.map((task) => {
                const status = task.status === "complete" ? "completed" : task.status
                return (
                  <div key={task.id} className="activity-item activity-item--hover" style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/tasks/${task.id}`)}>
                    <div className="activity-item__meta">
                      <span className="activity-item__title">{task.title}</span>
                      <span className={`status-pill status-pill--${status}`}>{status === "progress" ? "In Progress" : status}</span>
                    </div>
                    <p className="small-text" style={{ margin: "0.25rem 0 0" }}>
                      → {task.assignedTo || task.assigned_to_email}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {pendingInvites.length > 0 && (
        <section className="dashboard__panel collab-incoming-banner">
          <div className="dashboard__panel-header">
            <h3>Pending Task Invites</h3>
            <button className="button button--ghost" type="button" onClick={() => navigate("/dashboard/collaboration")}>
              Respond
            </button>
          </div>
          <div className="task-list">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="activity-item">
                <div className="activity-item__meta">
                  <strong>{invite.task_title || "Task invite"}</strong>
                  <span className="status-pill status-pill--progress">Pending</span>
                </div>
                <p className="small-text" style={{ margin: "0.25rem 0 0" }}>
                  From {invite.from_email || "Teammate"} · {invite.task_priority || "medium"} priority
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default TeamTasks
