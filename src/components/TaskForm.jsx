import React, { useEffect, useMemo, useState } from "react"

const TaskForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  statusControl = "select",
  onChange,
  assigneeSuggestions = [],
  submitLabel = "Save task",
  hideSubmit = false,
  renderFormWrapper = true,
}) => {
  const [title, setTitle] = useState(initialValues.title || "")
  const [description, setDescription] = useState(initialValues.description || "")
  const [deadline, setDeadline] = useState(
    initialValues.deadline ? new Date(initialValues.deadline).toISOString().slice(0, 10) : ""
  )
  const [priority, setPriority] = useState(initialValues.priority || "medium")
  const [status, setStatus] = useState(initialValues.status || "pending")
  const [assignedTo, setAssignedTo] = useState(initialValues.assignedTo || "")
  const [shared, setShared] = useState(Boolean(initialValues.shared))
  const [error, setError] = useState("")

  useEffect(() => {
    setTitle(initialValues.title || "")
    setDescription(initialValues.description || "")
    setPriority(initialValues.priority || "medium")
    setStatus(initialValues.status || "pending")
    setAssignedTo(initialValues.assignedTo || "")
    setShared(Boolean(initialValues.shared))
    setDeadline(
      initialValues.deadline ? new Date(initialValues.deadline).toISOString().slice(0, 10) : ""
    )
  }, [initialValues])

  useEffect(() => {
    if (!onChange) return
    const draft = {
      title,
      description,
      deadline: deadline || null,
      priority,
      status,
      assignedTo,
      shared,
    }
    const timer = setTimeout(() => onChange(draft), 300)
    return () => clearTimeout(timer)
  }, [title, description, deadline, priority, status, assignedTo, shared, onChange])

  const dueBadge = useMemo(() => {
    if (!deadline) return null
    const due = new Date(deadline)
    if (Number.isNaN(due.getTime())) return null
    const diffDays = Math.ceil((due.getTime() - Date.now()) / 86400000)
    if (diffDays < 0) return { label: "Overdue", tone: "overdue" }
    if (diffDays === 0) return { label: "Due today", tone: "soon" }
    if (diffDays <= 3) return { label: `Due in ${diffDays} days`, tone: "soon" }
    return { label: `Due in ${diffDays} days`, tone: "safe" }
  }, [deadline])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("A task title is required.")
      return
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      deadline: deadline || null,
      priority,
      status,
      assignedTo: assignedTo.trim(),
      shared,
    })
  }

  const formContent = (
    <>
      <div className="form-group">
        <label htmlFor="task-title">Title</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your task a clear name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add additional details (optional)"
          rows={4}
        />
      </div>

      <div className="form-group">
        <label htmlFor="task-assigned">Assign to (optional)</label>
        <input
          id="task-assigned"
          type="text"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder="Assign to a teammate (email)"
        />
        {assigneeSuggestions.length > 0 && (
          <div className="suggestion-row">
            {assigneeSuggestions.slice(0, 5).map((email) => (
              <button
                key={email}
                type="button"
                className="suggestion-chip"
                onClick={() => setAssignedTo(email)}
              >
                {email}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="task-deadline">Due date</label>
        <input
          id="task-deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        {dueBadge && (
          <div className={`sla-badge sla-badge--${dueBadge.tone}`}>{dueBadge.label}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="task-status">Status</label>
        {statusControl === "buttons" ? (
          <div className="status-toggle" role="group" aria-label="Task status">
            <button
              type="button"
              className={`status-toggle__btn ${status === "pending" ? "is-active" : ""}`}
              onClick={() => setStatus("pending")}
            >
              To Do
            </button>
            <button
              type="button"
              className={`status-toggle__btn ${status === "progress" ? "is-active" : ""}`}
              onClick={() => setStatus("progress")}
            >
              In Progress
            </button>
            <button
              type="button"
              className={`status-toggle__btn ${status === "completed" ? "is-active" : ""}`}
              onClick={() => setStatus("completed")}
            >
              Completed
            </button>
          </div>
        ) : (
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">To Do</option>
            <option value="progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="task-priority">Priority</label>
        <select
          id="task-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <label className="auth-checkbox" style={{ marginBottom: "1rem" }}>
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
        />
        <span>Share with team</span>
      </label>

      {error && <div className="alert">{error}</div>}

      {!hideSubmit && (
        <div className="task-form__actions">
          <button type="submit" className="button">
            {submitLabel}
          </button>
          {onCancel && (
            <button type="button" className="button button--ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      )}
    </>
  )

  if (!renderFormWrapper) {
    return formContent
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {formContent}
    </form>
  )
}

export default TaskForm
