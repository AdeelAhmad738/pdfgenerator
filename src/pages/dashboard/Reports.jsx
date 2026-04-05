import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"
import { jsPDF } from "jspdf"
import * as XLSX from "xlsx"

const REPORT_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "progress", label: "In progress" },
  { value: "pending", label: "Pending" },
]

const DAY_MS = 86400000

const normalizeStatus = (status) => {
  if (status === "complete") return "completed"
  if (status === "in_progress" || status === "in-progress" || status === "active")
    return "progress"
  return status || "pending"
}

const matchesSearchTerm = (task, term) => {
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

const formatDateLabel = (value) => {
  if (!value) return "TBD"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "TBD"
  return date.toLocaleDateString()
}

function Reports() {
  const { tasks } = useTasks()
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const applyRange = (from, to) => {
    setStartDate(from)
    setEndDate(to)
  }

  const setTodayFilter = () => {
    const today = new Date()
    const iso = today.toISOString().split("T")[0]
    applyRange(iso, iso)
  }

  const setWeekFilter = () => {
    const today = new Date()
    const end = new Date(today)
    const start = new Date(today)
    start.setDate(start.getDate() - 6)
    applyRange(start.toISOString().split("T")[0], end.toISOString().split("T")[0])
  }

  const setMonthFilter = () => {
    const today = new Date()
    const end = new Date(today)
    const start = new Date(today)
    start.setDate(start.getDate() - 29)
    applyRange(start.toISOString().split("T")[0], end.toISOString().split("T")[0])
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setStatusFilter("all")
    setSearchTerm("")
  }

  const filteredTasks = useMemo(() => {
    let data = [...tasks]

    if (statusFilter !== "all") {
      data = data.filter((t) => normalizeStatus(t.status) === statusFilter)
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null
      const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : null

      data = data.filter((task) => {
        const created = task.createdAt || task.created_at || 0
        if (start && created < start) return false
        if (end && created > end) return false
        return true
      })
    }

    if (searchTerm) {
      data = data.filter((task) => matchesSearchTerm(task, searchTerm))
    }

    return data
  }, [tasks, startDate, endDate, statusFilter, searchTerm])

  const stats = useMemo(() => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter((t) => normalizeStatus(t.status) === "completed").length
    const pending = filteredTasks.filter((t) => normalizeStatus(t.status) === "pending").length
    const overdue = filteredTasks.filter(
      (t) =>
        t.deadline &&
        new Date(t.deadline).getTime() < Date.now() &&
        normalizeStatus(t.status) !== "completed"
    ).length
    const highPriority = filteredTasks.filter(
      (t) => (t.priority || t.task_priority || "medium").toLowerCase() === "high"
    ).length

    const startRange = startDate
      ? new Date(`${startDate}T00:00:00`).getTime()
      : null
    const endRange = endDate ? new Date(`${endDate}T23:59:59`).getTime() : null
    let rangeDays = 7
    if (startRange && endRange) {
      const diff = endRange - startRange
      rangeDays = Math.max(1, Math.round(diff / DAY_MS) + 1)
    }

    const completionRate = total ? Math.round((completed / total) * 100) : 0
    const averagePerDay = rangeDays ? Math.round((total / rangeDays) * 10) / 10 : 0

    const todayString = new Date().toDateString()
    const completedToday = filteredTasks.filter((t) => {
      if (normalizeStatus(t.status) !== "completed") return false
      const completedDate = t.completedAt ? new Date(t.completedAt).toDateString() : ""
      return completedDate === todayString
    }).length

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate,
      highPriority,
      averagePerDay,
      completedToday,
    }
  }, [filteredTasks, startDate, endDate])

  const priorityBreakdown = useMemo(() => {
    const bucket = { high: 0, medium: 0, low: 0, other: 0 }
    filteredTasks.forEach((task) => {
      const priority = (task.priority || task.task_priority || "medium").toLowerCase()
      if (bucket[priority] !== undefined) {
        bucket[priority] += 1
      } else {
        bucket.other += 1
      }
    })
    return Object.entries(bucket).map(([key, value]) => ({
      label: key,
      value,
    }))
  }, [filteredTasks])

  const statusBreakdown = useMemo(() => {
    const bucket = { completed: 0, progress: 0, pending: 0 }
    filteredTasks.forEach((task) => {
      const status = normalizeStatus(task.status)
      if (bucket[status] !== undefined) {
        bucket[status] += 1
      }
    })
    return Object.entries(bucket).map(([key, value]) => ({
      label: key,
      value,
    }))
  }, [filteredTasks])

  const collaboratorBreakdown = useMemo(() => {
    const map = new Map()
    filteredTasks.forEach((task) => {
      const assignee = (task.assignedTo || task.assigned_to_email || "Unassigned").trim()
      const key = assignee || "Unassigned"
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percent: stats.total ? Math.round((count / stats.total) * 100) : 0,
      }))
  }, [filteredTasks, stats.total])

  const dueSoonTasks = useMemo(() => {
    return filteredTasks.filter((task) => {
      const deadline = task.deadline ? new Date(task.deadline) : task.due_date ? new Date(task.due_date) : null
      if (!deadline || Number.isNaN(deadline.getTime())) return false
      const diff = deadline.getTime() - Date.now()
      return diff >= 0 && diff <= DAY_MS * 3
    })
  }, [filteredTasks])

  const trendData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(today)
      day.setDate(day.getDate() - (6 - index))
      const label = day.toLocaleDateString(undefined, { weekday: "short" })
      const count = filteredTasks.filter((task) => {
        const created = task.createdAt || task.created_at
        if (!created) return false
        const createdDate = new Date(created)
        return createdDate >= day && createdDate < new Date(day.getTime() + DAY_MS)
      }).length
      return { label, count }
    })
  }, [filteredTasks])

  const openTask = (taskId) => {
    navigate(`/dashboard/tasks/${taskId}`)
  }

  const exportPdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Task Productivity Report", 14, 20)
    doc.setFontSize(11)
    doc.text(`Total Tasks: ${stats.total}`, 14, 35)
    doc.text(`Completed: ${stats.completed}`, 14, 42)
    doc.text(`Pending: ${stats.pending}`, 14, 49)
    doc.text(`Overdue: ${stats.overdue}`, 14, 56)
    doc.text(`Completion Rate: ${stats.completionRate}%`, 14, 63)
    let y = 80
    filteredTasks.forEach((task, index) => {
      const status = normalizeStatus(task.status) || "pending"
      const line = `${index + 1}. ${task.title} | ${status} | ${
        task.assignedTo || task.assigned_to_email || "Unassigned"
      }`
      doc.text(line, 14, y)
      y += 7
      if (y > 280) {
        doc.addPage()
        y = 20
      }
    })
    doc.save("task-report.pdf")
  }

  const exportExcel = () => {
    const rows = filteredTasks.map((task) => ({
      Title: task.title,
      Status: normalizeStatus(task.status),
      AssignedTo: task.assignedTo || task.assigned_to_email || "Unassigned",
      Priority: task.priority || "medium",
      Created: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-",
      Deadline: task.deadline ? new Date(task.deadline).toLocaleDateString() : "-",
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks")
    XLSX.writeFile(workbook, "task-report.xlsx")
  }

  return (
    <div className="page-content">
      <div className="report-header">
        <div>
          <h1>Reports Dashboard</h1>
          <p className="small-text">Monitor team productivity and spot opportunities in seconds.</p>
        </div>
        <div className="report-header__actions">
          <button className="button button--ghost" type="button" onClick={setTodayFilter}>
            Today
          </button>
          <button className="button button--ghost" type="button" onClick={setWeekFilter}>
            Last 7 days
          </button>
          <button className="button button--ghost" type="button" onClick={setMonthFilter}>
            Last 30 days
          </button>
        </div>
      </div>

      <section className="dashboard__panel report-filter-panel">
        <div className="report-filter-row">
          <input
            type="search"
            placeholder="Search tasks, collaborators, keywords…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="report-filter-chips">
            {REPORT_STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`status-chip ${statusFilter === option.value ? "is-active" : ""}`}
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="report-filter-row">
          <div className="form-group">
            <label>From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="form-group report-filter-actions">
            <label className="sr-only">Reset filters</label>
            <button className="button button--ghost" type="button" onClick={clearFilters}>
              Reset filters
            </button>
          </div>
        </div>
      </section>

      <section className="report-stats-grid">
        <article className="report-stat-card">
          <span className="report-stat-card__value">{stats.total}</span>
          <span className="report-stat-card__label">Total Tasks</span>
        </article>
        <article className="report-stat-card report-stat-card--success">
          <span className="report-stat-card__value">{stats.completed}</span>
          <span className="report-stat-card__label">Completed</span>
        </article>
        <article className="report-stat-card report-stat-card--accent">
          <span className="report-stat-card__value">{stats.completionRate}%</span>
          <span className="report-stat-card__label">Completion Rate</span>
        </article>
        <article className="report-stat-card report-stat-card--warning">
          <span className="report-stat-card__value">{stats.pending}</span>
          <span className="report-stat-card__label">Pending</span>
        </article>
        <article className="report-stat-card report-stat-card--danger">
          <span className="report-stat-card__value">{stats.overdue}</span>
          <span className="report-stat-card__label">Overdue</span>
        </article>
        <article className="report-stat-card report-stat-card--info">
          <span className="report-stat-card__value">{stats.averagePerDay}</span>
          <span className="report-stat-card__label">Tasks / day</span>
        </article>
        <article className="report-stat-card report-stat-card--soft">
          <span className="report-stat-card__value">{stats.highPriority}</span>
          <span className="report-stat-card__label">High priority</span>
        </article>
        <article className="report-stat-card report-stat-card--success">
          <span className="report-stat-card__value">{stats.completedToday}</span>
          <span className="report-stat-card__label">Completed today</span>
        </article>
      </section>

      <section className="dashboard__panel report-breakdown-panel">
        <div className="report-breakdown">
          <h3>Status breakdown</h3>
          <div className="report-breakdown-list">
            {statusBreakdown.map((item) => (
              <div key={item.label} className="report-breakdown-row">
                <span>{item.label}</span>
                <div className="report-breakdown-bar">
                  <div
                    className="report-breakdown-fill"
                    style={{
                      width: stats.total ? `${Math.round((item.value / stats.total) * 100)}%` : "0%",
                    }}
                  />
                </div>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="report-breakdown">
          <h3>Priority mix</h3>
          <div className="report-breakdown-list">
            {priorityBreakdown.map((item) => (
              <div key={item.label} className="report-breakdown-row">
                <span>{item.label}</span>
                <div className="report-breakdown-bar">
                  <div
                    className="report-breakdown-fill report-breakdown-fill--muted"
                    style={{
                      width: stats.total ? `${Math.round((item.value / stats.total) * 100)}%` : "0%",
                    }}
                  />
                </div>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="report-trend-grid">
        <section className="dashboard__panel report-trend-panel">
          <h3>Daily activity</h3>
          <div className="report-trend">
            {trendData.map((day) => (
              <div key={day.label} className="report-trend-column">
                <div
                  className="report-trend-bar"
                  style={{ height: `${Math.min(day.count * 10, 120)}px` }}
                  title={`${day.count} tasks`}
                />
                <span className="small-text">{day.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="dashboard__panel report-collaborators-panel">
          <h3>Top collaborators</h3>
          <div className="report-collaborator-list">
            {collaboratorBreakdown.map((collab) => (
              <div key={collab.name} className="report-collaborator-row">
                <div>
                  <strong>{collab.name}</strong>
                  <p className="small-text">{collab.count} tasks · {collab.percent}% of view</p>
                </div>
                <span className="status-pill status-pill--progress">{collab.count}</span>
              </div>
            ))}
            {collaboratorBreakdown.length === 0 && (
              <p className="small-text">Assign team members to see trending collaborators.</p>
            )}
          </div>
        </section>
      </div>

      <section className="dashboard__panel report-due-panel">
        <div className="report-due-header">
          <h3>Due soon</h3>
          <p className="small-text">{dueSoonTasks.length} tasks due within 3 days</p>
        </div>
        {dueSoonTasks.length === 0 ? (
          <p className="small-text">No urgent deadlines in the current view.</p>
        ) : (
          <div className="report-due-list">
            {dueSoonTasks.map((task) => (
              <div key={task.id} className="report-due-card">
                <div>
                  <strong>{task.title}</strong>
                  <p className="small-text">
                    {task.assignedTo || task.assigned_to_email || "Unassigned"} ·{" "}
                    {(task.priority || "medium").toUpperCase()} · due {formatDateLabel(task.deadline)}
                  </p>
                </div>
                <span className={`status-pill status-pill--${normalizeStatus(task.status)}`}>
                  {normalizeStatus(task.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard__panel report-task-list-panel">
        <h3>Filtered Tasks</h3>
        {filteredTasks.length === 0 ? (
          <p className="small-text">No tasks match the current filters.</p>
        ) : (
          <div className="report-task-list">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="report-task-card"
                onClick={() => openTask(task.id)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <strong>{task.title}</strong>
                  <p className="small-text">
                    {task.description ? `${task.description.slice(0, 80)}...` : "No description yet."}
                  </p>
                </div>
                <div className="report-task-card__meta">
                  <span className={`status-pill status-pill--${normalizeStatus(task.status)}`}>
                    {normalizeStatus(task.status)}
                  </span>
                  <span className="small-text">{formatDateLabel(task.deadline)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard__panel report-export-panel">
        <div className="report-export-header">
          <h3>Export reports</h3>
          <p className="small-text">Download snapshots or share them with your team.</p>
        </div>
        <div className="report-export-actions">
          <button className="button" type="button" onClick={exportPdf}>
            Download PDF
          </button>
          <button className="button button--ghost" type="button" onClick={exportExcel}>
            Download Excel
          </button>
        </div>
      </section>
    </div>
  )
}

export default Reports
