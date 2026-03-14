import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabaseClient"
import { useTasks } from "../../context/TaskContext"

function Profile() {
  const navigate = useNavigate()
  const { tasks, currentUserEmail } = useTasks()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  /* USER TASKS ANALYTICS */
  const userTasks = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : []
    return safeTasks.filter(
      (t) => (t.assignedTo || t.assigned_to_email) === currentUserEmail
    )
  }, [tasks, currentUserEmail])

  const stats = useMemo(() => {
    const s = { 
      total: userTasks.length, 
      completed: 0, 
      progress: 0, 
      pending: 0, 
      high: 0, 
      medium: 0, 
      low: 0,
      overdue: 0 
    }
    
    userTasks.forEach((t) => {
      const taskStatus = t.status === "complete" ? "completed" : t.status
      if (taskStatus === "completed") s.completed++
      else if (taskStatus === "progress") s.progress++
      else s.pending++
      
      const priority = t.priority || "medium"
      if (priority === "high") s.high++
      else if (priority === "medium") s.medium++
      else s.low++
      
      if (t.deadline && new Date(t.deadline) < Date.now() && taskStatus !== "completed") {
        s.overdue++
      }
    })
    return s
  }, [userTasks])

  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0
  const activeTasks = userTasks.filter(t => t.status !== "completed").slice(0, 3)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const currentUser = data?.user

        if (!currentUser) return

        setUser(currentUser)
        setName(currentUser.user_metadata?.full_name || "")
        setAvatar(currentUser.user_metadata?.avatar || "")
      } catch (err) {
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setStatus("")
    setError("")

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name, avatar }
      })

      if (error) throw error

      setStatus("Profile updated successfully!")
      setTimeout(() => setStatus(""), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setError("")
      const fileExt = file.name.split(".").pop()
      const filePath = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      setAvatar(data.publicUrl)
      setStatus("Avatar updated successfully!")
      setTimeout(() => setStatus(""), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setStatus("")
    setError("")

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setStatus("Password updated successfully!")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordChange(false)
      setTimeout(() => setStatus(""), 3000)
    } catch (err) {
      setError(err.message)
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

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>My Profile</h1>
        <p className="small-text">View your productivity and manage account settings.</p>
      </div>

      {status && <div className="alert alert--success">{status}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="profile-grid">
        {/* PROFILE CARD */}
        <section className="profile-card">
          <div className="profile-avatar">
            {avatar ? (
              <img src={avatar} alt="Profile avatar" />
            ) : (
              <div className="avatar avatar--large">
                {(user?.email || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload" className="avatar-upload-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.828 14.828a4 4 0 0 1-5.656 0M9 10h1.586a1 1 0 0 1 .707.293l.707.707A1 1 0 0 0 13.414 11H15m-3-3v6"/>
              </svg>
            </label>
          </div>

          <h3>{name || "Your Name"}</h3>
          <p>{user?.email}</p>

          <div className="profile-meta">
            <div>
              <span>Total Tasks</span>
              <strong>{stats.total}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
            <div>
              <span>Success Rate</span>
              <strong>{completionRate}%</strong>
            </div>
          </div>

          <div className="profile-actions">
            <button className="button button--primary" onClick={() => navigate("/dashboard/tasks")}>
              View All Tasks
            </button>
            <button className="button button--ghost" onClick={() => navigate("/dashboard/create-task")}>
              New Task
            </button>
          </div>
        </section>

        {/* PRODUCTIVITY SUMMARY */}
        <section className="dashboard__panel">
          <h3>Productivity Summary</h3>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completionRate}%` }} />
          </div>
          <div className="progress-breakdown">
            <div className="progress-row">
              <span>In Progress</span>
              <strong>{stats.progress}</strong>
            </div>
            <div className="progress-row">
              <span>Pending</span>
              <strong>{stats.pending}</strong>
            </div>
            <div className="progress-row">
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
          </div>
        </section>

        {/* TASK PRIORITIES */}
        <section className="dashboard__panel">
          <h3>Task Priorities</h3>
          <div className="priority-breakdown">
            <div className="priority-item">
              <span className="priority-label priority-label--high">High Priority</span>
              <strong>{stats.high}</strong>
            </div>
            <div className="priority-item">
              <span className="priority-label priority-label--medium">Medium Priority</span>
              <strong>{stats.medium}</strong>
            </div>
            <div className="priority-item">
              <span className="priority-label priority-label--low">Low Priority</span>
              <strong>{stats.low}</strong>
            </div>
          </div>
          {stats.overdue > 0 && (
            <div className="alert alert--warning" style={{ marginTop: '12px' }}>
              ⚠ You have {stats.overdue} overdue task{stats.overdue !== 1 ? 's' : ''}
            </div>
          )}
        </section>

        {/* ACTIVE TASKS */}
        {activeTasks.length > 0 && (
          <section className="dashboard__panel">
            <h3>Active Tasks</h3>
            <div className="activity-list">
              {activeTasks.map((t) => {
                const taskStatus = t.status === "complete" ? "completed" : t.status
                return (
                  <div key={t.id} className="activity-item">
                    <strong>{t.title}</strong>
                    <div className="task-tags">
                      <span className={`status-pill status-pill--${taskStatus}`}>
                        {taskStatus}
                      </span>
                      <span className={`priority-pill priority-pill--${t.priority || 'medium'}`}>
                        {t.priority || "medium"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* EDIT PROFILE */}
        <section className="dashboard__panel">
          <h3>Account Settings</h3>
          <form onSubmit={handleSaveProfile} className="task-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={user?.email || ""} disabled />
              <small className="small-text">Email cannot be changed</small>
            </div>
            <button type="submit" className="button">
              Save Changes
            </button>
          </form>
        </section>

        {/* SECURITY */}
        <section className="dashboard__panel">
          <div className="panel-header">
            <h3>Security</h3>
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordChange && (
            <form onSubmit={handlePasswordChange} className="task-form">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength="6"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  minLength="6"
                  required
                />
              </div>
              <button type="submit" className="button">
                Update Password
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}

export default Profile
