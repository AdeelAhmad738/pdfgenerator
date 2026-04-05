import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"

const DAY_MS = 86400000

const StatCard = ({ label, value, detail }) => (
  <div className="stat-card">
    <h4>{label}</h4>
    <strong>{value}</strong>
    {detail && <p className="small-text">{detail}</p>}
  </div>
)

const formatDate = (value) => {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString()
}

const getDeadlineTime = (task) => {
  const raw = task.deadline || task.due_date || task.dueDate
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

const normalizeStatus = (status) => {
  if (status === "complete") return "completed"
  if (status === "progress" || status === "in_progress") return "progress"
  return status || "pending"
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { tasks, currentUserName, currentUserEmail } = useTasks()
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const now = Date.now()

  const stats = useMemo(() => {
    const s = { total: safeTasks.length, completed: 0, progress: 0, pending: 0 }
    safeTasks.forEach((t) => {
      const status = normalizeStatus(t.status)
      if (status === "completed") s.completed++
      else if (status === "progress") s.progress++
      else s.pending++
    })
    return s
  }, [safeTasks])

  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0

  const overdueCount = useMemo(
    () =>
      safeTasks.filter((t) => {
        const deadline = getDeadlineTime(t)
        return deadline && deadline < now && normalizeStatus(t.status) !== "completed"
      }).length,
    [safeTasks, now]
  )

  const dueThisWeek = useMemo(
    () =>
      safeTasks.filter((t) => {
        const deadline = getDeadlineTime(t)
        return deadline && deadline >= now && deadline < now + DAY_MS * 7
      }).length,
    [safeTasks, now]
  )

  const focusTasks = useMemo(() => {
    return safeTasks
      .filter((t) => {
        const deadline = getDeadlineTime(t)
        const priority = (t.priority || t.task_priority || "medium").toLowerCase()
        const dueSoon = deadline && deadline >= now && deadline < now + DAY_MS * 3
        return priority === "high" || dueSoon
      })
      .sort((a, b) => {
        const aDeadline = getDeadlineTime(a) || now
        const bDeadline = getDeadlineTime(b) || now
        return aDeadline - bDeadline
      })
      .slice(0, 4)
  }, [safeTasks, now])

  const upcomingTasks = useMemo(() => {
    return safeTasks
      .filter((t) => {
        const deadline = getDeadlineTime(t)
        return deadline && deadline >= now
      })
      .sort((a, b) => (getDeadlineTime(a) || 0) - (getDeadlineTime(b) || 0))
      .slice(0, 5)
  }, [safeTasks, now])

  const recentTasks = useMemo(() => {
    return safeTasks
      .slice()
      .sort((a, b) => {
        const aCreated = new Date(a.createdAt || a.created_at || 0).getTime()
        const bCreated = new Date(b.createdAt || b.created_at || 0).getTime()
        return bCreated - aCreated
      })
      .slice(0, 6)
  }, [safeTasks])

  const userName =
    currentUserName || (currentUserEmail ? currentUserEmail.split("@")[0] : "User")

  const statusBreakdown = useMemo(() => {
    const bucket = { completed: 0, progress: 0, pending: 0 }
    safeTasks.forEach((task) => {
      const status = normalizeStatus(task.status)
      if (bucket[status] !== undefined) {
        bucket[status] += 1
      }
    })
    return Object.entries(bucket).map(([label, value]) => ({ label, value }))
  }, [safeTasks])

  const priorityBreakdown = useMemo(() => {
    const bucket = { high: 0, medium: 0, low: 0 }
    safeTasks.forEach((task) => {
      const priority = (task.priority || task.task_priority || "medium").toLowerCase()
      if (bucket[priority] !== undefined) {
        bucket[priority] += 1
      }
    })
    return Object.entries(bucket).map(([label, value]) => ({ label, value }))
  }, [safeTasks])

  const highlightMetrics = [
    { label: "Total tasks", value: stats.total, detail: "All active work items" },
    { label: "Due this week", value: dueThisWeek, detail: "Needs planning" },
    { label: "Overdue", value: overdueCount, detail: "Re-prioritize" },
    { label: "Focus tasks", value: focusTasks.length, detail: "High priority / due soon" },
  ]

  const totalForBreakdown = stats.total || 1

  return (
    <div className="page-content">
      <section className="dashboard__hero">
        <div>
          <h1>Welcome back, {userName} 👋</h1>
          <p className="small-text">Here’s what needs your attention today.</p>
          <div className="dashboard__hero-actions">
            <button className="button" onClick={() => navigate("/dashboard/create")}>
              + Create Task
            </button>
            <button className="button button--ghost" onClick={() => navigate("/dashboard/collaboration")}>
              View Team
            </button>
          </div>
        </div>
        <div className="dashboard__hero-progress">
          <div className="hero-progress-value">{completionRate}%</div>
          <p className="small-text">tasks completed</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="small-text">Keep the momentum going!</p>
        </div>
      </section>

      <section className="dashboard__breakdown">
        <div className="dashboard__breakdown-group">
          <h4>Status breakdown</h4>
          {statusBreakdown.map((item) => (
            <div key={item.label} className="dashboard__breakdown-row">
              <span className="small-text">{item.label}</span>
              <div className="dashboard__breakdown-bar">
                <div
                  className="dashboard__breakdown-fill"
                  style={{
                    width: `${Math.round((item.value / totalForBreakdown) * 100)}%`,
                  }}
                />
              </div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        <div className="dashboard__breakdown-group">
          <h4>Priority mix</h4>
          {priorityBreakdown.map((item) => (
            <div key={item.label} className="dashboard__breakdown-row">
              <span className="small-text">{item.label}</span>
              <div className="dashboard__breakdown-bar">
                <div
                  className="dashboard__breakdown-fill dashboard__breakdown-fill--muted"
                  style={{
                    width: `${Math.round((item.value / totalForBreakdown) * 100)}%`,
                  }}
                />
              </div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard__stat-grid">
        {highlightMetrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </section>

      <section className="dashboard__panel dashboard__panel--focus">
        <div className="dashboard__panel-header">
          <h3>Focus tasks</h3>
          <button className="button button--ghost" onClick={() => navigate("/dashboard/tasks?filter=focus")}>
            Explore filtered list
          </button>
        </div>
        {focusTasks.length === 0 ? (
          <p className="small-text">No upcoming focus items. Create one to keep your sprint moving.</p>
        ) : (
          <div className="focus-list">
            {focusTasks.map((task) => {
              const status = normalizeStatus(task.status)
              const priority = (task.priority || task.task_priority || "medium").toLowerCase()
              return (
                <div key={task.id} className="focus-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p className="small-text">
                      {formatDate(task.deadline)} · {priority} priority
                    </p>
                  </div>
                  <div className="focus-item__meta">
                    <span className={`status-pill status-pill--${status}`}>{status}</span>
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                    >
                      View
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="dashboard__panel dashboard__panel--grid">
        <div className="panel-block">
          <div className="dashboard__panel-header">
            <h3>Upcoming deadlines</h3>
            <span className="small-text">{upcomingTasks.length} tasks</span>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="small-text">Nothing due soon. Feel free to plan ahead.</p>
          ) : (
            <ul className="task-list task-list--compact">
              {upcomingTasks.map((t) => (
                <li key={t.id} onClick={() => navigate(`/dashboard/tasks/${t.id}`)}>
                  <div>
                    <strong>{t.title}</strong>
                    <p className="small-text">{formatDate(t.deadline)}</p>
                  </div>
                  <span className={`status-pill status-pill--${normalizeStatus(t.status)}`}>
                    {normalizeStatus(t.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel-block">
          <div className="dashboard__panel-header">
            <h3>Recent activity</h3>
            <button className="button button--ghost" onClick={() => navigate("/dashboard/tasks")}>
              View all
            </button>
          </div>
          {recentTasks.length === 0 ? (
            <p className="small-text">No activity yet.</p>
          ) : (
            <div className="recent-list">
              {recentTasks.map((t) => (
                <div
                  key={t.id}
                  className="recent-item"
                  onClick={() => navigate(`/dashboard/tasks/${t.id}`)}
                >
                  <div>
                    <strong>{t.title}</strong>
                    <p className="small-text">{formatDate(t.createdAt || t.created_at)}</p>
                  </div>
                  <div className="recent-item__meta">
                    <span className={`priority-pill priority-pill--${(t.priority || "medium").toLowerCase()}`}>
                      {(t.priority || "medium").toLowerCase()}
                    </span>
                    <span className={`status-pill status-pill--${normalizeStatus(t.status)}`}>
                      {normalizeStatus(t.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard__panel dashboard__panel--actions">
        <h3>Quick actions</h3>
        <div className="dashboard__action-row">
          <button className="button" onClick={() => navigate("/dashboard/create")}>
            Create task
          </button>
          <button className="button button--ghost" onClick={() => navigate("/dashboard/reports")}>
            Go to Reports
          </button>
          <button className="button button--ghost" onClick={() => navigate("/dashboard/collaboration")}>
            Manage collaborators
          </button>
        </div>
      </section>
    </div>
  )
}
