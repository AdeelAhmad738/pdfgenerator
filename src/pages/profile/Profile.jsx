import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabaseClient"
import { useTasks } from "../../context/TaskContext"

const normalizeStatus = (status) => {
  if (!status) return "pending"
  if (status === "complete") return "completed"
  return status.toLowerCase()
}

const formatDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString()
}

const DAY_MS = 86400000

function Profile() {
  const navigate = useNavigate()
  const { tasks, currentUserEmail, invites } = useTasks()
  const [user, setUser] = useState(null)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  const safeTasks = Array.isArray(tasks) ? tasks : []
  const normalizedEmail = (currentUserEmail || "").toLowerCase()

  const userTasks = useMemo(() => {
    if (!normalizedEmail) return []
    return safeTasks.filter(
      (task) =>
        (task.assignedTo || task.assigned_to_email || "").toLowerCase() === normalizedEmail
    )
  }, [safeTasks, normalizedEmail])

  const teamMembers = useMemo(() => {
    const map = new Map()
    userTasks.forEach((task) => {
      const ownerEmail = (task.createdByEmail || task.created_by_email || "").toLowerCase().trim()
      if (!ownerEmail || ownerEmail === normalizedEmail) return
      const entry = map.get(ownerEmail) || { email: ownerEmail, tasks: [], lastAssigned: 0 }
      entry.displayName = entry.displayName || task.createdByEmail || task.created_by_email || ownerEmail
      entry.tasks.push(task)
      const updatedAt = new Date(task.updatedAt || task.updated_at || task.createdAt || task.created_at || Date.now()).getTime()
      entry.lastAssigned = Math.max(entry.lastAssigned, updatedAt)
      map.set(ownerEmail, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.tasks.length - a.tasks.length)
  }, [userTasks, normalizedEmail])

  const stats = useMemo(() => {
    const total = userTasks.length
    const completed = userTasks.filter((task) => normalizeStatus(task.status) === "completed").length
    const pending = userTasks.filter(
      (task) => normalizeStatus(task.status) === "pending" || normalizeStatus(task.status) === "progress"
    ).length
    const overdue = userTasks.filter((task) => {
      const deadline = task.deadline ? new Date(task.deadline).getTime() : null
      return deadline && deadline < Date.now() && normalizeStatus(task.status) !== "completed"
    }).length
    const completionRate = total ? Math.round((completed / total) * 100) : 0
    return { total, completed, pending, overdue, completionRate }
  }, [userTasks])

  const focusTasks = useMemo(() => {
    return userTasks
      .filter((task) => {
        const deadline = task.deadline ? new Date(task.deadline).getTime() : null
        return deadline && deadline >= Date.now() && deadline <= Date.now() + DAY_MS * 7
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3)
  }, [userTasks])

  const pendingInvites = useMemo(() => invites.filter((invite) => invite.status === "pending"), [invites])

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const currentUser = data?.user
        if (currentUser) {
          setUser(currentUser)
          setName(currentUser.user_metadata?.full_name || "")
        }
      } catch (err) {
        setError("Unable to load your profile.")
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Name cannot be empty.")
      return
    }
    setStatus("")
    setError("")
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
      if (error) throw error
      setStatus("Profile updated.")
      setTimeout(() => setStatus(""), 2500)
    } catch (err) {
      setError(err.message || "Failed to update profile.")
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <div className="dashboard__panel">
          <h2>Loading profile...</h2>
        </div>
      </div>
    )
  }

  const displayName = name || user?.user_metadata?.full_name || "Your name"
  const email = user?.email || currentUserEmail || ""

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Team profile</h1>
        <p className="small-text">
          A simplified overview of your impact and teammates you collaborate with.
        </p>
      </div>

      {status && <div className="alert alert--success">{status}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <section className="team-profile-hero">
        <div>
          <p className="small-text">You</p>
          <h2>{displayName}</h2>
          <p className="small-text">{email}</p>
          <div className="team-profile-actions">
            <button className="button" onClick={() => navigate("/dashboard/team")}>
              View team tasks
            </button>
            <button className="button button--ghost" onClick={() => navigate("/dashboard/collaboration")}>
              Manage collaboration
            </button>
          </div>
        </div>
        <div className="team-profile-stats">
          <div>
            <span className="small-text">Completion</span>
            <strong>{stats.completionRate}%</strong>
          </div>
          <div>
            <span className="small-text">Total assigned</span>
            <strong>{stats.total}</strong>
          </div>
          <div>
            <span className="small-text">Invites</span>
            <strong>{pendingInvites.length}</strong>
          </div>
        </div>
      </section>

      <section className="profile-stats-grid">
        <article className="insight-card">
          <span className="insight-label">Pending attention</span>
          <strong>{stats.pending}</strong>
          <p className="small-text">Waiting on you</p>
        </article>
        <article className="insight-card">
          <span className="insight-label">Overdue</span>
          <strong>{stats.overdue}</strong>
          <p className="small-text">Needs priority</p>
        </article>
        <article className="insight-card">
          <span className="insight-label">Completed</span>
          <strong>{stats.completed}</strong>
          <p className="small-text">Done items</p>
        </article>
      </section>

      <section className="team-section">
        <div className="panel-header">
          <h3>Team view</h3>
          <p className="small-text">See teammates who assign tasks to you.</p>
        </div>
        {teamMembers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🤝</div>
            <p>No teammates have assigned you tasks yet.</p>
            <p className="small-text">Hit "View team tasks" to invite collaborations.</p>
          </div>
        ) : (
          <div className="team-member-list">
            {teamMembers.map((member) => {
              const lastAssigned =
                member.lastAssigned === 0 ? "No updates" : formatDate(member.lastAssigned)
              return (
                <div key={member.email} className="team-member-card">
                  <div>
                    <strong>{member.displayName}</strong>
                    <p className="small-text">{member.email}</p>
                    <p className="small-text">Last assigned {lastAssigned}</p>
                  </div>
                  <div className="team-member-info">
                    <span>{member.tasks.length} task{member.tasks.length !== 1 ? "s" : ""}</span>
                    <button className="link-button" onClick={() => navigate("/dashboard/team-tasks")}>
                      View tasks
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="profile-account-card">
        <h3>Account</h3>
        <form onSubmit={handleSave} className="task-form">
          <div className="form-group">
            <label>Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <button type="submit" className="button">
            Save name
          </button>
        </form>
      </section>
    </div>
  )
}

export default Profile
