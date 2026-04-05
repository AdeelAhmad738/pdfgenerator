import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"
import TaskCard from "../../components/TaskCard"

const getStatusLabel = (status) => (status === "complete" ? "completed" : status || "pending")

const STATUS_CHIP_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "progress", label: "In progress" },
  { value: "completed", label: "Completed" },
]

const PRIORITY_OPTIONS = [
  { value: "all", label: "Any priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const DUE_FILTER_OPTIONS = [
  { value: "all", label: "Any date" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
]

const normalizeStatusValue = (status) => {
  const value = (status || "").toString().toLowerCase()
  if (value === "complete" || value === "completed") return "completed"
  if (value === "progress" || value === "in_progress" || value === "in-progress" || value === "active") return "progress"
  if (value === "pending" || value === "todo" || value === "backlog") return "pending"
  return value || "pending"
}

const matchesStatusFilter = (task, filter) => {
  if (filter === "all") return true
  return normalizeStatusValue(task.status) === filter
}

const matchesPriorityFilter = (task, filter) => {
  if (filter === "all") return true
  const priority = (task.priority || task.task_priority || "").toString().toLowerCase()
  return priority === filter
}

const matchesDueFilter = (task, filter) => {
  if (filter === "all") return true
  const deadline = task.deadline ? new Date(task.deadline) : task.due_date ? new Date(task.due_date) : null
  if (!deadline || Number.isNaN(deadline.getTime())) return filter === "overdue" ? false : true

  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const dayAhead = new Date(startOfDay)
  dayAhead.setDate(dayAhead.getDate() + 1)
  const weekAhead = new Date(startOfDay)
  weekAhead.setDate(weekAhead.getDate() + 7)
  const monthAhead = new Date(startOfDay)
  monthAhead.setMonth(monthAhead.getMonth() + 1)

  switch (filter) {
    case "overdue":
      return deadline < now
    case "today":
      return deadline >= startOfDay && deadline < dayAhead
    case "this_week":
      return deadline >= startOfDay && deadline < weekAhead
    case "this_month":
      return deadline >= startOfDay && deadline < monthAhead
    default:
      return true
  }
}

const matchesTaskSearch = (task, term) => {
  if (!term) return true
  const normalizedTerm = term.toLowerCase()
  const haystack = [
    task.title,
    task.description,
    task.assignedTo,
    task.assigned_to_email,
    task.createdByEmail,
    task.created_by_email,
  ]
  return haystack.some((value) => (value || "").toString().toLowerCase().includes(normalizedTerm))
}

const DelegatedCard = ({ task, onView, onReassign }) => {
  const status = getStatusLabel(task.status)
  const assignee = task.assignedTo || task.assigned_to_email || "Unassigned"
  return (
    <div className="delegated-card" data-status={status}>
      <div>
        <strong>{task.title}</strong>
        <p className="small-text">Assigned to {assignee}</p>
        <p className="small-text">
          Due {task.deadline ? new Date(task.deadline).toLocaleDateString() : "TBD"}
        </p>
      </div>
      <div className="delegated-card__meta">
        <span className={`status-pill status-pill--${status}`}>{status}</span>
        <span className="small-text">Priority: {(task.priority || "medium").toUpperCase()}</span>
      </div>
      <div className="delegated-card__actions">
        <button className="button button--ghost button--small" onClick={() => onView(task)}>
          View
        </button>
        <button className="button button--primary button--small" onClick={() => onReassign(task)}>
          Reassign
        </button>
      </div>
    </div>
  )
}

function TeamTasks() {
  const navigate = useNavigate()
  const { tasks, toggleTaskComplete, deleteTask, currentUserEmail, invites, assignTaskToUser } = useTasks()
  const [teamSearch, setTeamSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [assignedPriority, setAssignedPriority] = useState("all")
  const [assignedDue, setAssignedDue] = useState("all")
  const [delegatedSearch, setDelegatedSearch] = useState("")
  const [delegatedStatus, setDelegatedStatus] = useState("all")
  const [delegatedPriority, setDelegatedPriority] = useState("all")
  const [delegatedDue, setDelegatedDue] = useState("all")

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
    completed: assignedToMe.filter((t) => getStatusLabel(t.status) === "completed").length,
    pending: pendingInvites.length,
  }), [assignedToMe, assignedByMe, pendingInvites])

  const filteredAssignedToMe = useMemo(() => {
    return assignedToMe
      .filter((task) => matchesTaskSearch(task, teamSearch))
      .filter((task) => matchesStatusFilter(task, statusFilter))
      .filter((task) => matchesPriorityFilter(task, assignedPriority))
      .filter((task) => matchesDueFilter(task, assignedDue))
  }, [assignedToMe, teamSearch, statusFilter, assignedPriority, assignedDue])

  const filteredDelegated = useMemo(() => {
    return assignedByMe
      .filter((task) => matchesTaskSearch(task, delegatedSearch))
      .filter((task) => matchesStatusFilter(task, delegatedStatus))
      .filter((task) => matchesPriorityFilter(task, delegatedPriority))
      .filter((task) => matchesDueFilter(task, delegatedDue))
  }, [assignedByMe, delegatedSearch, delegatedStatus, delegatedPriority, delegatedDue])

  const teamWorkload = useMemo(() => {
    const map = new Map()
    tasks.forEach((task) => {
      const assignee = (task.assignedTo || task.assigned_to_email || "").trim().toLowerCase()
      if (!assignee) return
      const entry = map.get(assignee) || { assignee, count: 0, overdue: 0 }
      entry.count += 1
      if (task.deadline && new Date(task.deadline).getTime() < Date.now()) {
        entry.overdue += 1
      }
      map.set(assignee, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [tasks])

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

      <div className="team-view-grid">
        <section className="dashboard__panel team-panel">
          <div className="dashboard__panel-header">
            <h3>Assigned to Me</h3>
            <span className="status-pill status-pill--progress">{filteredAssignedToMe.length}</span>
          </div>
          <div className="team-panel__filters">
            <div className="team-panel__filters-row">
              <input
                type="search"
                placeholder="Search tasks or assignees"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
              />
              <div className="team-panel__selects">
                <label className="team-panel__select-label">
                  <span>Priority</span>
                  <select value={assignedPriority} onChange={(e) => setAssignedPriority(e.target.value)}>
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="team-panel__select-label">
                  <span>Due</span>
                  <select value={assignedDue} onChange={(e) => setAssignedDue(e.target.value)}>
                    {DUE_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="status-chip-row">
              {STATUS_CHIP_OPTIONS.map((chip) => (
                <button
                  key={`assigned-${chip.value}`}
                  type="button"
                  className={`status-chip ${statusFilter === chip.value ? "is-active" : ""}`}
                  onClick={() => setStatusFilter(chip.value)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
          {filteredAssignedToMe.length === 0 ? (
            <div className="empty-state empty-state--small">
              <div className="empty-state__icon">📂</div>
              <p>No tasks match the current filters.</p>
            </div>
          ) : (
            <div className="panel-scroll">
              <div className="task-list">
                {filteredAssignedToMe.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                    onToggleComplete={() => toggleTaskComplete(task.id)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="dashboard__panel dashboard__panel--soft team-panel delegated-panel">
          <div className="dashboard__panel-header">
            <h3>Delegated by Me</h3>
            <span className="status-pill">{filteredDelegated.length}</span>
          </div>
          <div className="team-panel__filters">
            <div className="team-panel__filters-row">
              <input
                type="search"
                placeholder="Search delegated tasks"
                value={delegatedSearch}
                onChange={(e) => setDelegatedSearch(e.target.value)}
              />
              <div className="team-panel__selects">
                <label className="team-panel__select-label">
                  <span>Priority</span>
                  <select value={delegatedPriority} onChange={(e) => setDelegatedPriority(e.target.value)}>
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="team-panel__select-label">
                  <span>Due</span>
                  <select value={delegatedDue} onChange={(e) => setDelegatedDue(e.target.value)}>
                    {DUE_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="status-chip-row">
              {STATUS_CHIP_OPTIONS.map((chip) => (
                <button
                  key={`delegated-${chip.value}`}
                  type="button"
                  className={`status-chip ${delegatedStatus === chip.value ? "is-active" : ""}`}
                  onClick={() => setDelegatedStatus(chip.value)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
          {filteredDelegated.length === 0 ? (
            <div className="empty-state empty-state--small">
              <div className="empty-state__icon">🤝</div>
              <p>No delegated tasks match the filters.</p>
              <button className="button button--ghost" type="button" onClick={() => navigate("/dashboard/create")}>
                ✨ Create & assign
              </button>
            </div>
          ) : (
            <div className="panel-scroll panel-scroll--delegated">
              <div className="delegated-list">
                {filteredDelegated.map((task) => (
                  <DelegatedCard
                    key={task.id}
                    task={task}
                    onView={() => navigate(`/dashboard/tasks/${task.id}`)}
                    onReassign={async (item) => {
                      const assignee = window.prompt("Reassign to (email):", item.assignedTo || item.assigned_to_email || "")
                      if (assignee && assignee.trim()) {
                        await assignTaskToUser(item.id, assignee.trim())
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

        </section>
      </div>

      <section className="dashboard__panel team-workload-panel">
        <div className="dashboard__panel-header">
          <h3>Team workload</h3>
          <p className="small-text">Top collaborators with open tasks</p>
        </div>
        <div className="team-workload">
          {teamWorkload.length === 0 ? (
            <p className="small-text">No team workload to show yet.</p>
          ) : (
            teamWorkload.map((row) => (
              <div key={row.assignee} className="team-workload__row">
                <div>
                  <strong>{row.assignee || "Unassigned"}</strong>
                  <p className="small-text">Active tasks: {row.count}</p>
                </div>
                <span className="status-pill status-pill--warning">
                  {row.overdue} overdue
                </span>
              </div>
            ))
          )}
        </div>
      </section>

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

