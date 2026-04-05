import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"

const formatDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const getStatusLabel = (status) => {
  if (!status) return "pending"
  return status.toLowerCase()
}

const isAssignmentAccepted = (task) => {
  const status = (task.assignmentStatus || task.assignment_status || "active")
    .toString()
    .toLowerCase()
  return status === "active"
}

const STATUS_FILTERS = ["all", "pending", "progress", "completed"]

const CollaboratorCard = ({ collaborator, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      className={`collab-card ${isSelected ? "is-selected" : ""}`}
      onClick={() => onSelect(collaborator)}
    >
      <div>
        <h4>{collaborator.displayName}</h4>
        <p className="small-text">{collaborator.email || "Unknown email"}</p>
      </div>
      <div className="collab-card__stats">
        <span>{collaborator.tasks.length} task{collaborator.tasks.length !== 1 ? "s" : ""}</span>
        <strong>{collaborator.lastAssignedLabel}</strong>
      </div>
    </button>
  )
}

function Collaboration() {
  const navigate = useNavigate()
  const {
    tasks,
    invites,
    addInvite,
    removeInvite,
    respondToInvite,
    currentUserEmail,
    currentUserId,
  } = useTasks()

  const [inviteEmail, setInviteEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [taskSearch, setTaskSearch] = useState("")
  const [taskStatusFilter, setTaskStatusFilter] = useState("all")
  const [collaboratorSearch, setCollaboratorSearch] = useState("")
  const [collaboratorStatusFilter, setCollaboratorStatusFilter] = useState("all")
  const [selectedCollaborator, setSelectedCollaborator] = useState(null)

  const normalizedCurrentEmail = (currentUserEmail || "").toLowerCase()

  const assignedToMe = useMemo(() => {
    return tasks.filter((task) => {
      const recipient = (task.assignedTo || task.assigned_to_email || "").toLowerCase()
      return recipient && recipient === normalizedCurrentEmail && isAssignmentAccepted(task)
    })
  }, [tasks, normalizedCurrentEmail])

  const collaboratorList = useMemo(() => {
    const map = new Map()
    assignedToMe.forEach((task) => {
      const ownerEmail = (task.createdByEmail || task.created_by_email || "").trim().toLowerCase()
      if (!ownerEmail || ownerEmail === normalizedCurrentEmail) return
      const entry = map.get(ownerEmail) || {
        email: ownerEmail,
        displayName: task.createdByEmail || task.created_by_email || "Teammate",
        tasks: [],
        lastAssigned: 0,
      }
      entry.tasks.push(task)
      entry.lastAssigned = Math.max(
        entry.lastAssigned,
        new Date(task.updatedAt || task.updated_at || task.createdAt || task.created_at || Date.now()).getTime()
      )
      map.set(ownerEmail, entry)
    })

    const entries = Array.from(map.values())
      .map((entry) => ({
        ...entry,
        lastAssignedLabel:
          entry.lastAssigned === 0
            ? "No updates"
            : formatDate(entry.lastAssigned),
      }))
      .sort((a, b) => b.tasks.length - a.tasks.length)

    const normalizedSearch = collaboratorSearch.trim().toLowerCase()

    return entries.filter((entry) => {
      if (normalizedSearch) {
        const target = `${entry.displayName || ""} ${entry.email || ""}`.toLowerCase()
        if (!target.includes(normalizedSearch)) {
          return false
        }
      }

      if (collaboratorStatusFilter === "all") return true
      return entry.tasks.some((task) => getStatusLabel(task.status) === collaboratorStatusFilter)
    })
  }, [assignedToMe, normalizedCurrentEmail, collaboratorSearch, collaboratorStatusFilter])

  useEffect(() => {
    if (collaboratorList.length === 0) {
      setSelectedCollaborator(null)
      return
    }

    if (!selectedCollaborator) {
      setSelectedCollaborator(collaboratorList[0])
      return
    }

    const stillAvailable = collaboratorList.find(
      (item) => item.email === selectedCollaborator.email
    )
    if (!stillAvailable) {
      setSelectedCollaborator(collaboratorList[0])
    }
  }, [collaboratorList, selectedCollaborator])

  const pendingInvites = useMemo(
    () => invites.filter((invite) => invite.status === "pending"),
    [invites]
  )
  const incomingInvites = useMemo(() => {
    const email = normalizedCurrentEmail
    return pendingInvites.filter(
      (invite) => (invite.to_email || invite.email || "").toLowerCase() === email
    )
  }, [pendingInvites, normalizedCurrentEmail])
  const outgoingInvites = useMemo(
    () => pendingInvites.filter((invite) => invite.from_user_id === currentUserId),
    [pendingInvites, currentUserId]
  )

  const collaboratorTasks = useMemo(() => {
    if (!selectedCollaborator) return assignedToMe
    return assignedToMe.filter((task) => {
      const owner = (task.createdByEmail || task.created_by_email || "").trim().toLowerCase()
      return owner === selectedCollaborator.email
    })
  }, [assignedToMe, selectedCollaborator])

  const filteredTasks = useMemo(() => {
    return collaboratorTasks
      .filter((task) => {
        if (!taskSearch) return true
        const term = taskSearch.toLowerCase()
        return (
          (task.title || "").toLowerCase().includes(term) ||
          (task.description || "").toLowerCase().includes(term)
        )
      })
      .filter((task) => {
        if (taskStatusFilter === "all") return true
        return getStatusLabel(task.status) === taskStatusFilter
      })
      .sort((a, b) => {
        const aDate = new Date(a.deadline || a.createdAt || a.created_at || 0).getTime()
        const bDate = new Date(b.deadline || b.createdAt || b.created_at || 0).getTime()
        return bDate - aDate
      })
  }, [collaboratorTasks, taskSearch, taskStatusFilter])

  const stats = useMemo(() => {
    const overdue = assignedToMe.filter(
      (task) =>
        task.deadline &&
        new Date(task.deadline).getTime() < Date.now() &&
        getStatusLabel(task.status) !== "completed"
    ).length
    const progress = assignedToMe.filter((task) => getStatusLabel(task.status) === "progress").length
    const completed = assignedToMe.filter((task) => getStatusLabel(task.status) === "completed").length
    return {
      total: assignedToMe.length,
      overdue,
      progress,
      completed,
      collaborators: collaboratorList.length,
      invites: pendingInvites.length,
    }
  }, [assignedToMe, collaboratorList, pendingInvites])

  const upcoming = useMemo(() => {
    return assignedToMe
      .filter((task) => task.deadline)
      .sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      )
      .slice(0, 3)
  }, [assignedToMe])

  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setSending(true)
    try {
      await addInvite(inviteEmail.trim())
      setInviteEmail("")
    } finally {
      setSending(false)
    }
  }

  const handleInviteResponse = async (invite, status) => {
    await respondToInvite(invite, status)
  }

  const handleInviteCancel = async (inviteId) => {
    await removeInvite(inviteId)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Collaboration</h1>
          <p className="small-text">
            Track teammates, assignments, and shared tasks in one place.
          </p>
        </div>
        <div className="page-actions">
          <button className="button button--ghost" onClick={() => navigate("/dashboard/team-tasks")}>
            View team tasks
          </button>
        </div>
      </div>

      <section className="dashboard__panel collaboration-insights">
        <div className="insight-card">
          <h4>Active collaborators</h4>
          <strong>{stats.collaborators}</strong>
          <p className="small-text">People who assigned tasks to you</p>
        </div>
        <div className="insight-card">
          <h4>Pending tasks</h4>
          <strong>{stats.total}</strong>
          <p className="small-text">Assigned to you</p>
        </div>
        <div className="insight-card">
          <h4>Overdue</h4>
          <strong>{stats.overdue}</strong>
          <p className="small-text">Needs immediate attention</p>
        </div>
        <div className="insight-card">
          <h4>Invites</h4>
          <strong>{stats.invites}</strong>
          <p className="small-text">Awaiting response</p>
        </div>
      </section>

      <div className="collaboration-grid">
        <section className="dashboard__panel collaborators-section">
          <header className="collab-header">
            <div>
              <h3>Collaborators</h3>
              <p className="small-text">Select a teammate to view tasks they shared with you</p>
            </div>
            <div className="collab-list-controls">
              <input
                type="search"
                placeholder="Search collaborators"
                value={collaboratorSearch}
                onChange={(e) => setCollaboratorSearch(e.target.value)}
              />
              <select
                value={collaboratorStatusFilter}
                onChange={(e) => setCollaboratorStatusFilter(e.target.value)}
                aria-label="Filter collaborators by task status"
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All statuses" : option}
                  </option>
                ))}
              </select>
            </div>
          </header>
          <div className="collab-card-list">
            {collaboratorList.length === 0 && (
              <p className="small-text">No collaborators have assigned you tasks yet.</p>
            )}
            {collaboratorList.map((collaborator) => (
              <CollaboratorCard
                key={collaborator.email || collaborator.displayName}
                collaborator={collaborator}
                onSelect={setSelectedCollaborator}
                isSelected={selectedCollaborator?.email === collaborator.email}
              />
            ))}
          </div>
        </section>

        <section className="dashboard__panel detail-section">
            <div className="detail-header">
              <div>
                <h3>{selectedCollaborator ? selectedCollaborator.displayName : "Assignments"}</h3>
                <p className="small-text">
                  {selectedCollaborator
                    ? `Showing tasks from ${selectedCollaborator.displayName}`
                    : incomingInvites.length
                      ? "Accept invites to unlock shared assignments."
                      : "Select a collaborator to view their assignments"}
                </p>
              </div>
              <div className="search-column">
                <input
                  type="text"
                  placeholder="Search tasks, titles or notes"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                />
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                  aria-label="Filter tasks by status"
                >
                  {STATUS_FILTERS.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All statuses" : option === "progress" ? "In progress" : option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <h2>No matching tasks</h2>
              <p className="small-text">
                {selectedCollaborator
                  ? "No tasks meet the active filters."
                  : incomingInvites.length
                    ? "Accept an invite to start collaborating."
                    : "You haven’t been assigned tasks yet."}
              </p>
            </div>
          ) : (
            <div className="collab-task-list">
              {filteredTasks.map((task) => (
                <div key={task.id} className="collab-task" data-status={getStatusLabel(task.status)}>
                  <div className="collab-task__body">
                    <strong>{task.title}</strong>
                    <p className="small-text">
                      {getStatusLabel(task.status)} · Priority: {(task.priority || "medium").toUpperCase()}
                    </p>
                    <p className="small-text">
                      Due {formatDate(task.deadline)} · Assigned by{" "}
                      {selectedCollaborator?.displayName || "the team"}
                    </p>
                  </div>
                  <div className="collab-task__actions">
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                    >
                      Open task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard__panel invite-section">
          <header>
            <div>
              <h3>Manage invites</h3>
              <p className="small-text">Keep team invites aligned</p>
            </div>
          </header>

          <form className="task-form" onSubmit={handleInviteSubmit}>
            <div className="form-group">
              <label>Invite teammate</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
              />
            </div>
            <button className="button" disabled={sending}>
              {sending ? "Sending..." : "Send invite"}
            </button>
          </form>

          <div className="invite-lists">
            <div>
              <h4>Incoming</h4>
              {incomingInvites.length === 0 && <p className="small-text">No requests pending</p>}
              {incomingInvites.map((invite) => (
                <div key={invite.id} className="activity-item">
                  <div>
                    <strong>{invite.from_email || "Teammate"}</strong>
                    <p className="small-text">
                      {invite.invite_type === "task"
                        ? `Task: ${invite.task_title || "Untitled"}`
                        : "Collaboration invite"}
                    </p>
                  </div>
                  <div className="task-tags">
                    <button
                      className="button button--small button--primary"
                      onClick={() => handleInviteResponse(invite, "accepted")}
                    >
                      Accept
                    </button>
                    <button
                      className="button button--small button--ghost"
                      onClick={() => handleInviteResponse(invite, "declined")}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4>Outgoing</h4>
              {outgoingInvites.length === 0 && <p className="small-text">No invites waiting</p>}
              {outgoingInvites.map((invite) => (
                <div key={invite.id} className="activity-item">
                  <div>
                    <strong>{invite.to_email || invite.email}</strong>
                    <p className="small-text">{invite.invite_type} invite</p>
                  </div>
                  <button
                    className="link-button link-button--danger"
                    onClick={() => handleInviteCancel(invite.id)}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard__panel upcoming-section">
          <header>
            <div>
              <h3>Upcoming deadlines</h3>
              <p className="small-text">Prioritize what’s due next</p>
            </div>
          </header>
          {upcoming.length === 0 ? (
            <p className="small-text">No scheduled deadlines right now.</p>
          ) : (
            <div className="collab-task-list">
              {upcoming.map((task) => (
                <div key={task.id} className="collab-task collab-task--dense">
                  <div className="collab-task__body">
                    <strong>{task.title}</strong>
                    <p className="small-text">Due {formatDate(task.deadline)}</p>
                  </div>
                  <div className="collab-task__actions">
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Collaboration
