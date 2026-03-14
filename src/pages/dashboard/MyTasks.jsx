import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"
import TaskForm from "../../components/TaskForm"
import TaskCard from "../../components/TaskCard"
import CommentForm from "../../components/CommentForm"
import { jsPDF } from "jspdf"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import {
  fetchViews,
  createView,
  deleteView as deleteViewInDb,
  fetchAttachments,
} from "../../services/supabaseExtras"

const statusOptions = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
]

const assignedOptions = [
  { value: "all", label: "All" },
  { value: "me", label: "Assigned to me" },
  { value: "byme", label: "Assigned by me" },
]

const COLUMNS = [
  { key: "pending", label: "To Do", accent: "#f59e0b" },
  { key: "progress", label: "In Progress", accent: "#3b82f6" },
  { key: "completed", label: "Completed", accent: "#22c55e" },
]

const normalizeStatus = (status) => {
  if (status === "complete" || status === "completed") return "completed"
  if (status === "progress") return "progress"
  return "pending"
}

const MyTasks = () => {
  const navigate = useNavigate()
  const { taskId } = useParams()
  const { tasks, deleteTask, updateTask, toggleTaskComplete, addComment, currentUserEmail, preferences } = useTasks()

  const [statusFilter, setStatusFilter] = useState("all")
  const [assignedFilter, setAssignedFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [editingTask, setEditingTask] = useState(null)
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [dueFilter, setDueFilter] = useState("all")
  const [sortMode, setSortMode] = useState("manual")
  const [savedViews, setSavedViews] = useState([])
  const [viewName, setViewName] = useState("")
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false)
  const [attachments, setAttachments] = useState([])
  const descriptionRef = React.useRef(null)

  const currentTask = useMemo(() => {
    if (!taskId) return null
    const safeTasks = Array.isArray(tasks) ? tasks : []
    return safeTasks.find((task) => task.id === taskId) || null
  }, [tasks, taskId])

  const filteredTasks = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : []
    const query = search.trim().toLowerCase()
    return safeTasks.filter((task) => {
      const norm = normalizeStatus(task.status)
      if (!preferences.showCompletedTasks && norm === "completed" && statusFilter === "all") return false
      const matchesStatus = statusFilter === "all" || norm === statusFilter
      const matchesPriority = priorityFilter === "all" || (task.priority || "medium") === priorityFilter
      const dueCheck = () => {
        if (dueFilter === "all") return true
        if (!task.deadline) return false
        const date = new Date(task.deadline)
        if (Number.isNaN(date.getTime())) return false
        const diffDays = Math.ceil((date.getTime() - Date.now()) / 86400000)
        if (dueFilter === "overdue") return diffDays < 0
        if (dueFilter === "soon") return diffDays >= 0 && diffDays <= 3
        if (dueFilter === "week") return diffDays >= 0 && diffDays <= 7
        return true
      }
      const assignedTo = (task.assignedTo || task.assigned_to_email || "").toLowerCase()
      const createdBy = (task.createdByEmail || task.created_by_email || "").toLowerCase()
      const userEmail = (currentUserEmail || "").toLowerCase()
      const matchesAssigned =
        assignedFilter === "all" ? true
        : assignedFilter === "me" ? userEmail && assignedTo === userEmail
        : userEmail && createdBy === userEmail
      const matchesSearch = query ? task.title?.toLowerCase().includes(query) : true
      return matchesStatus && matchesAssigned && matchesPriority && dueCheck() && matchesSearch
    })
  }, [tasks, statusFilter, assignedFilter, priorityFilter, dueFilter, search, currentUserEmail, preferences])

  // Derive column tasks DIRECTLY from filteredTasks status — no separate kanbanOrder state
  // This fixes the "all tasks move" bug caused by kanbanOrder being rebuilt after updateTask
  const getColumnTasks = (colKey) => {
    let colTasks = filteredTasks.filter((t) => normalizeStatus(t.status) === colKey)
    if (sortMode !== "manual") {
      const priorityRank = { high: 1, medium: 2, low: 3 }
      colTasks = [...colTasks].sort((a, b) => {
        if (sortMode === "title") return (a.title || "").localeCompare(b.title || "")
        if (sortMode === "priority") return (priorityRank[a.priority || "medium"] || 2) - (priorityRank[b.priority || "medium"] || 2)
        if (sortMode === "due") {
          const aDate = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
          const bDate = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
          return aDate - bDate
        }
        return 0
      })
    }
    return colTasks
  }

  // Drag between columns: only update the single dragged task's status
  const handleDragEnd = (result) => {
    if (!result.destination) return
    const { draggableId, source, destination } = result
    // Only act when moving to a DIFFERENT column
    if (source.droppableId !== destination.droppableId) {
      updateTask(draggableId, { status: destination.droppableId })
    }
  }

  // Quick-move a single task to a target status without drag
  const moveTaskTo = (taskId, targetStatus) => {
    updateTask(taskId, { status: targetStatus })
  }

  const summary = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : []
    const totals = { total: safeTasks.length, completed: 0, pending: 0, progress: 0 }
    safeTasks.forEach((task) => {
      const s = normalizeStatus(task.status)
      if (s === "completed") totals.completed++
      else if (s === "progress") totals.progress++
      else totals.pending++
    })
    return totals
  }, [tasks])

  useEffect(() => {
    const loadViews = async () => {
      try {
        const data = await fetchViews()
        setSavedViews(data)
      } catch { /* ignore */ }
    }
    loadViews()
  }, [])

  useEffect(() => {
    if (!taskId) {
      setAttachments([])
      return
    }
    setShowFullDescription(false)
    const loadAttachments = async () => {
      try {
        const data = await fetchAttachments(taskId)
        setAttachments(data || [])
      } catch {
        setAttachments([])
      }
    }
    loadAttachments()
  }, [taskId])

  useEffect(() => {
    const el = descriptionRef.current
    if (!el) return

    // If the content is clamped by CSS, scrollHeight will be greater than clientHeight.
    const isOverflowing = el.scrollHeight > el.clientHeight + 1
    setIsDescriptionOverflowing(isOverflowing)
  }, [currentTask?.description, showFullDescription])

  const formatDate = (value) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }

  const getDueBadge = (value) => {
    if (!value) return { label: "No date", tone: "safe" }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return { label: "No date", tone: "safe" }
    const diffDays = Math.ceil((date.getTime() - Date.now()) / 86400000)
    if (diffDays < 0) return { label: "Overdue", tone: "overdue" }
    if (diffDays <= 3) return { label: "Due soon", tone: "soon" }
    return { label: "On track", tone: "safe" }
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setAssignedFilter("all")
    setPriorityFilter("all")
    setDueFilter("all")
    setSearch("")
  }

  const saveCurrentView = () => {
    const name = viewName.trim()
    if (!name) return
    createView({ name, filters: { statusFilter, assignedFilter, priorityFilter, dueFilter, search } })
      .then((saved) => { if (saved) { setSavedViews((c) => [saved, ...c]); setViewName("") } })
      .catch(() => {})
  }

  const applyView = (view) => {
    setStatusFilter(view.filters.statusFilter)
    setAssignedFilter(view.filters.assignedFilter)
    setPriorityFilter(view.filters.priorityFilter)
    setDueFilter(view.filters.dueFilter || "all")
    setSearch(view.filters.search)
  }

  const deleteView = (id) => {
    deleteViewInDb(id).then(() => setSavedViews((c) => c.filter((v) => v.id !== id))).catch(() => {})
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }


  const handleSaveEdit = (taskId, values) => {
    updateTask(taskId, values)
    setEditingTask(null)
  }

  const exportTaskPdf = (task, openInNewTab = false) => {
    const status = normalizeStatus(task.status)
    const doc = new jsPDF({ unit: "pt", format: "letter" })
    doc.setFontSize(18)
    doc.text("Task Summary", 40, 60)
    doc.setFontSize(12)
    doc.text(`Title: ${task.title}`, 40, 90)
    doc.text(`Status: ${status}`, 40, 110)
    doc.text(`Assigned To: ${task.assignedTo || task.assigned_to_email || "Unassigned"}`, 40, 130)
    doc.text(`Priority: ${task.priority || "medium"}`, 40, 150)
    doc.text(`Due Date: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : "No due date"}`, 40, 170)
    doc.text("Description:", 40, 200)
    const description = task.description || "No description provided."
    const splitLines = doc.splitTextToSize(description, 520)
    doc.text(splitLines, 40, 220)

    if (openInNewTab) {
      const url = doc.output("bloburl")
      window.open(url, "_blank")
      return
    }
    doc.save(`task-${task.id}.pdf`)
  }

  // ── Task Detail View ──
  if (taskId) {
    if (!currentTask) {
      return (
        <div className="page-content">
          <div className="empty-state">
            <h2>Task not found</h2>
            <p>This task may have been removed or the link is incorrect.</p>
            <button className="button button--ghost" onClick={() => navigate("/dashboard/tasks")}>
              Back to tasks
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Task Details</h1>
            <p className="small-text">Review and update task information.</p>
          </div>
          <div className="page-actions">
            <button className="button button--ghost" onClick={() => navigate("/dashboard/tasks")}>
              ← Back to Tasks
            </button>
            <button
              className="button button--ghost"
              onClick={() => toggleTaskComplete(currentTask.id)}
            >
              {normalizeStatus(currentTask.status) === "completed" ? "Mark Pending" : "Mark Done"}
            </button>
            <button className="button button--ghost" onClick={() => exportTaskPdf(currentTask, true)}>
              Open PDF
            </button>
            <button className="button button--ghost" onClick={() => exportTaskPdf(currentTask)}>
              Download PDF
            </button>
            <button className="button" onClick={() => handleEdit(currentTask)}>
              Edit Task
            </button>
          </div>
        </div>

        <TaskCard
          task={currentTask}
          onToggleComplete={() => toggleTaskComplete(currentTask.id)}
          onDelete={() => {
            deleteTask(currentTask.id)
            navigate("/dashboard/tasks")
          }}
          compact
        />

        <section className="dashboard__panel">
          <h3>Task Details</h3>
          <div className="task-details">
            <div className="task-details__row">
              <span className="task-details__label">Assigned To</span>
              <span className="task-details__value">{currentTask.assignedTo || currentTask.assigned_to_email || "Unassigned"}</span>
            </div>
            <div className="task-details__row">
              <span className="task-details__label">Due Date</span>
              <span className="task-details__value">{currentTask.deadline ? new Date(currentTask.deadline).toLocaleDateString() : "No due date"}</span>
            </div>
            <div className="task-details__row">
              <span className="task-details__label">Priority</span>
              <span className="task-details__value">{currentTask.priority || "Medium"}</span>
            </div>
            <div className="task-details__row">
              <span className="task-details__label">Status</span>
              <span className="task-details__value">{currentTask.status}</span>
            </div>
            <div className="task-details__row">
              <span className="task-details__label">Description</span>
              <span className="task-details__value task-details__description">
                {currentTask.description ? (
                  <span
                    ref={descriptionRef}
                    className={showFullDescription ? "" : "description-truncate"}
                    onClick={() => isDescriptionOverflowing && setShowFullDescription((p) => !p)}
                    style={{ cursor: isDescriptionOverflowing ? 'pointer' : 'default' }}
                  >
                    {currentTask.description}
                    {isDescriptionOverflowing && (
                      <span className="see-more-indicator">
                        {showFullDescription ? "... Show less" : "... See more"}
                      </span>
                    )}
                  </span>
                ) : (
                  "No description provided."
                )}
              </span>
            </div>
          </div>
        </section>

        {attachments.length > 0 && (
          <section className="dashboard__panel">
            <h3>Attachments</h3>
            <div className="attachment-list">
              {attachments.map((file) => (
                <div key={file.id} className="attachment-item">
                  <div className="attachment-info">
                    <span className="attachment-name">{file.name}</span>
                    <span className="attachment-size">({(file.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <div className="attachment-actions">
                    {file.url && (
                      <>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="button button--ghost button--small">
                          View
                        </a>
                        <a href={file.url} download={file.name} className="button button--ghost button--small">
                          Download
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {editingTask && editingTask.id === currentTask.id && (
          <section className="task-edit">
            <h3>Edit Task</h3>
            <TaskForm
              initialValues={editingTask}
              onSubmit={(updated) => handleSaveEdit(editingTask.id, updated)}
              onCancel={() => setEditingTask(null)}
            />
          </section>
        )}

        <section className="task-comments">
          <h3>Comments</h3>
          {currentTask.comments?.length ? (
            currentTask.comments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-meta">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="comment-body">{comment.text}</p>
              </div>
            ))
          ) : (
            <p className="small-text">No comments yet. Add one below.</p>
          )}
          <CommentForm onSubmit={(text) => addComment(currentTask.id, text)} />
        </section>
      </div>
    )
  }

  // ── Kanban Board View ──
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p className="small-text">Drag tasks between columns or use quick-move buttons.</p>
        </div>
        <div className="page-actions">
          <button className="button" type="button" onClick={() => navigate("/dashboard/create")}>
            + Add Task
          </button>
          <select className="filter-select" value={sortMode} onChange={(e) => setSortMode(e.target.value)} aria-label="Sort tasks">
            <option value="manual">Sort: Manual</option>
            <option value="due">Sort: Due soon</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard__stats dashboard__stats--row">
        <div className="stat-card stat-card--default">
          <div className="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h11M9 6h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>
          </div>
          <div className="stat-card__body"><strong>{summary.total}</strong><h4>Total</h4></div>
        </div>
        <div className="stat-card stat-card--warning">
          <div className="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          </div>
          <div className="stat-card__body"><strong>{summary.pending}</strong><h4>To Do</h4></div>
        </div>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div className="stat-card__body"><strong>{summary.progress}</strong><h4>In Progress</h4></div>
        </div>
        <div className="stat-card stat-card--success">
          <div className="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div className="stat-card__body"><strong>{summary.completed}</strong><h4>Done</h4></div>
        </div>
      </div>

      {/* Edit panel */}
      {editingTask && !taskId && (
        <section className="task-edit">
          <div className="page-header" style={{ marginBottom: "1rem" }}>
            <h2>Edit Task</h2>
            <button className="button button--ghost" type="button" onClick={() => setEditingTask(null)}>Cancel</button>
          </div>
          <TaskForm
            initialValues={editingTask}
            onSubmit={(updated) => handleSaveEdit(editingTask.id, updated)}
            onCancel={() => setEditingTask(null)}
          />
        </section>
      )}

      {/* Filters */}
      <div className="filter-row">
        <div className="filter-control">
          <label htmlFor="statusFilter">Status</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="filter-control">
          <label htmlFor="assignedFilter">Assigned</label>
          <select id="assignedFilter" value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)}>
            {assignedOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="filter-control">
          <label htmlFor="priorityFilter">Priority</label>
          <select id="priorityFilter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="filter-control">
          <label htmlFor="dueFilter">Due Date</label>
          <select id="dueFilter" value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="overdue">Overdue</option>
            <option value="soon">Due soon</option>
            <option value="week">Due in 7 days</option>
          </select>
        </div>
        <div className="filter-control">
          <label htmlFor="taskSearch">Search</label>
          <input id="taskSearch" type="search" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="button button--ghost" type="button" onClick={clearFilters} style={{ alignSelf: "flex-end" }}>
          Clear
        </button>
      </div>

      {/* Saved views */}
      <div className="saved-views">
        <div className="saved-views__create">
          <input type="text" value={viewName} placeholder="Save this filter as..." onChange={(e) => setViewName(e.target.value)} />
          <button className="button button--ghost" type="button" onClick={saveCurrentView}>Save View</button>
        </div>
        {savedViews.length > 0 && (
          <div className="saved-views__list">
            {savedViews.map((view) => (
              <div key={view.id} className="saved-view">
                <button className="saved-view__btn" type="button" onClick={() => applyView(view)}>{view.name}</button>
                <button className="saved-view__delete" type="button" onClick={() => deleteView(view.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const colTasks = getColumnTasks(col.key)
            return (
              <Droppable droppableId={col.key} key={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-column ${snapshot.isDraggingOver ? "kanban-column--over" : ""}`}
                  >
                    {/* Column header */}
                    <div className="kanban-column__header" style={{ borderTop: `3px solid ${col.accent}` }}>
                      <div className="kanban-column__title">
                        <span className="kanban-column__dot" style={{ background: col.accent }} />
                        <h3>{col.label}</h3>
                      </div>
                      <span className="kanban-count">{colTasks.length}</span>
                    </div>

                    {/* Scrollable body */}
                    <div className="kanban-column__body">
                      {colTasks.length === 0 ? (
                        <div className="kanban-empty">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28, marginBottom: "0.5rem", opacity: 0.4 }}>
                            <rect x="3" y="3" width="18" height="18" rx="4"/>
                            <path d="M12 8v8M8 12h8"/>
                          </svg>
                          <p>No tasks here</p>
                          <span>Drag tasks here or create a new one</span>
                        </div>
                      ) : (
                        colTasks.map((task, index) => {
                          const priority = task.priority || "medium"
                          const dueBadge = getDueBadge(task.deadline)
                          const norm = normalizeStatus(task.status)
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={`kanban-card ${dragSnapshot.isDragging ? "kanban-card--dragging" : ""}`}
                                >
                                  {/* Drag handle — only this grabs */}
                                  <div
                                    className="kanban-card__handle"
                                    {...dragProvided.dragHandleProps}
                                    title="Drag to move"
                                  >
                                    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, opacity: 0.4 }}>
                                      <circle cx="7" cy="6" r="1.5"/><circle cx="13" cy="6" r="1.5"/>
                                      <circle cx="7" cy="10" r="1.5"/><circle cx="13" cy="10" r="1.5"/>
                                      <circle cx="7" cy="14" r="1.5"/><circle cx="13" cy="14" r="1.5"/>
                                    </svg>
                                    <span className="kanban-card__drag-hint">drag to move</span>
                                  </div>

                                  {/* Clickable body → navigate to task detail */}
                                  <div
                                    className="kanban-card__body"
                                    onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === "Enter") navigate(`/dashboard/tasks/${task.id}`) }}
                                    title="Click to view task details"
                                  >
                                    <div className="kanban-card__header">
                                      <strong className="kanban-card__title">{task.title}</strong>
                                      <span className={`priority-pill priority-pill--${priority}`}>{priority}</span>
                                    </div>
                                    {task.description && (
                                      <p className="kanban-card__desc">{task.description}</p>
                                    )}
                                    <div className="kanban-card__meta">
                                      {(task.assignedTo || task.assigned_to_email) && (
                                        <span className="kanban-card__assignee">
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
                                            <path d="M20 21c0-4.4-3.6-8-8-8s-8 3.6-8 8"/><circle cx="12" cy="7" r="4"/>
                                          </svg>
                                          {task.assignedTo || task.assigned_to_email}
                                        </span>
                                      )}
                                      {task.deadline && (
                                        <span className={`due-pill due-pill--${dueBadge.tone}`}>
                                          📅 {formatDate(task.deadline)}
                                        </span>
                                      )}
                                    </div>
                                    {task.assignmentStatus === "pending" && (
                                      <span className="status-pill status-pill--progress kanban-card__pending">Awaiting acceptance</span>
                                    )}
                                  </div>

                                  {/* Action buttons */}
                                  <div className="kanban-card__actions">
                                    {/* Quick-move buttons — only show relevant targets */}
                                    {norm !== "pending" && (
                                      <button
                                        type="button"
                                        className="kanban-quick-btn kanban-quick-btn--todo"
                                        onClick={(e) => { e.stopPropagation(); moveTaskTo(task.id, "pending") }}
                                        title="Move to To Do"
                                      >
                                        ← To Do
                                      </button>
                                    )}
                                    {norm !== "progress" && (
                                      <button
                                        type="button"
                                        className="kanban-quick-btn kanban-quick-btn--progress"
                                        onClick={(e) => { e.stopPropagation(); moveTaskTo(task.id, "progress") }}
                                        title="Move to In Progress"
                                      >
                                        ⚡ Progress
                                      </button>
                                    )}
                                    {norm !== "completed" && (
                                      <button
                                        type="button"
                                        className="kanban-quick-btn kanban-quick-btn--done"
                                        onClick={(e) => { e.stopPropagation(); moveTaskTo(task.id, "completed") }}
                                        title="Mark as Done"
                                      >
                                        ✓ Done
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="kanban-quick-btn kanban-quick-btn--edit"
                                      onClick={(e) => { e.stopPropagation(); handleEdit(task) }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="kanban-quick-btn kanban-quick-btn--delete"
                                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          )
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}

export default MyTasks
