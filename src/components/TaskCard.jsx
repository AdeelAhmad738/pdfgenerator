import React from "react"

const Badge = ({ status }) => {
  const normalized = status === "complete" ? "completed" : status
  const statusMap = {
    pending: { label: "Pending", color: "rgba(245, 158, 11, 0.16)", border: "rgba(245, 158, 11, 0.35)" },
    completed: { label: "Completed", color: "rgba(34, 197, 94, 0.18)", border: "rgba(34, 197, 94, 0.35)" },
    progress: { label: "In Progress", color: "rgba(59, 130, 246, 0.16)", border: "rgba(59, 130, 246, 0.35)" },
    overdue: { label: "Overdue", color: "rgba(239, 68, 68, 0.14)", border: "rgba(239, 68, 68, 0.4)" },
  }

  const config = statusMap[normalized] || statusMap.pending
  return (
    <span
      className="task-card__badge"
      style={{ background: config.color, borderColor: config.border }}
    >
      {config.label}
    </span>
  )
}

const formatDate = (timestamp) => {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const getDueLabel = (timestamp) => {
  if (!timestamp) return { label: "No date", tone: "safe" }
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return { label: "No date", tone: "safe" }
  const diffDays = Math.ceil((date.getTime() - Date.now()) / 86400000)
  if (diffDays < 0) return { label: "Overdue", tone: "overdue" }
  if (diffDays <= 3) return { label: "Due soon", tone: "soon" }
  return { label: "On track", tone: "safe" }
}

const TaskCard = ({ task, onToggleComplete, onDelete, onClick, compact }) => {
  const handleCardClick = () => {
    if (onClick) onClick(task)
  }

  const cardClass = compact ? "task-card task-card--compact" : "task-card"
  const dueLabel = getDueLabel(task.deadline)
  const priority = task.priority || "medium"

  return (
    <div
      className={cardClass}
      onClick={handleCardClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="task-card__header">
        <h3 className="task-card__title">{task.title}</h3>
        <Badge status={task.status} />
      </div>
      {!compact && <p className="task-card__desc">{task.description}</p>}
      <div className="task-card__meta">
        <div className="task-table-meta">
          <span>Created: {formatDate(task.createdAt)}</span>
          <span>Due: {formatDate(task.deadline)}</span>
          <span className={`priority-pill priority-pill--${priority}`}>
            {priority}
          </span>
          <span className={`due-pill due-pill--${dueLabel.tone}`}>
            {dueLabel.label}
          </span>
        </div>
        <div className="task-card__actions">
          <button
            type="button"
            className="task-card__btn"
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete?.(task)
            }}
          >
            {task.status === "completed" || task.status === "complete" ? "Mark pending" : "Mark done"}
          </button>
          <button
            type="button"
            className="task-card__btn"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(task)
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
