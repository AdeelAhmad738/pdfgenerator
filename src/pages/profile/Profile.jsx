import { useState, useMemo } from "react"
import { supabase } from "../../services/supabaseClient"
import { useTasks } from "../../context/TaskContext"

function Profile() {

  const { tasks, currentUserEmail } = useTasks()

  const [user] = useState(null)
  const [loading] = useState(true)

  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState("")

  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  /* USER TASKS */

  const userTasks = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : []
    return safeTasks.filter(
      (t) => (t.assignedTo || t.assigned_to_email) === currentUserEmail
    )
  }, [tasks, currentUserEmail])


  const stats = useMemo(() => {

    const s = { total: userTasks.length, completed: 0, progress: 0, pending: 0 }

    userTasks.forEach((t) => {

      const status = t.status === "complete" ? "completed" : t.status

      if (status === "completed") s.completed++
      else if (status === "progress") s.progress++
      else s.pending++

    })

    return s

  }, [userTasks])


  const completionRate =
    stats.total ? Math.round((stats.completed / stats.total) * 100) : 0


  const recentTasks = userTasks.slice(0,5)


  /* PROFILE UPDATE */

  const handleSave = async (e) => {

    e.preventDefault()

    setStatus("")
    setError("")

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        avatar
      }
    })

    if (error) {
      setError(error.message)
      return
    }

    setStatus("Profile updated successfully.")

  }


  const handleAvatarUpload = async (e) => {

    const file = e.target.files[0]
    if (!file) return

    const filePath = `${user.id}-${Date.now()}`

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file)

    if (error) {
      setError(error.message)
      return
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath)

    setAvatar(data.publicUrl)

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
        <h1>Profile & Productivity</h1>
        <p className="small-text">
          Overview of your work performance and account settings.
        </p>
      </div>


      <div className="profile-grid">


        {/* PROFILE CARD */}

        <section className="profile-card">

          <div className="profile-avatar">

            {avatar ? (
              <img src={avatar} alt="avatar" />
            ) : (
              <div className="avatar avatar--large">
                {(user.email || "U").slice(0,2).toUpperCase()}
              </div>
            )}

            <input type="file" onChange={handleAvatarUpload} />

          </div>

          <h3>{name || "Your Name"}</h3>
          <p>{user.email}</p>

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
              <span>Completion Rate</span>
              <strong>{completionRate}%</strong>
            </div>

          </div>

        </section>


        {/* PRODUCTIVITY PANEL */}

        <section className="dashboard__panel">

          <h3>Your Productivity</h3>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <div className="progress-breakdown">

            <div className="progress-row">
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>

            <div className="progress-row">
              <span>In Progress</span>
              <strong>{stats.progress}</strong>
            </div>

            <div className="progress-row">
              <span>Pending</span>
              <strong>{stats.pending}</strong>
            </div>

          </div>

        </section>


        {/* RECENT TASKS */}

        <section className="dashboard__panel">

          <h3>Your Recent Tasks</h3>

          {recentTasks.length === 0 ? (

            <p className="small-text">No assigned tasks yet.</p>

          ) : (

            <div className="activity-list">

              {recentTasks.map((t)=>{

                const status = t.status === "complete" ? "completed" : t.status

                return (

                  <div key={t.id} className="activity-item">

                    <strong>{t.title}</strong>

                    <div className="task-tags">

                      <span className={`status-pill status-pill--${status}`}>
                        {status}
                      </span>

                      <span className="small-text">
                        {t.priority || "medium"}
                      </span>

                    </div>

                  </div>

                )

              })}

            </div>

          )}

        </section>


        {/* EDIT PROFILE */}

        <section className="dashboard__panel">

          <h3>Edit Profile</h3>

          <form onSubmit={handleSave} className="task-form">

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e)=>setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="text" value={user.email} disabled />
            </div>

            {error && <div className="alert alert--danger">{error}</div>}
            {status && <div className="alert alert--success">{status}</div>}

            <button className="button">
              Save Changes
            </button>

          </form>

        </section>


        {/* SECURITY */}

        <section className="dashboard__panel">

          <h3>Security</h3>

          <button
            className="button button--ghost"
            onClick={()=>window.location.href="/update-password"}
          >
            Change Password
          </button>

        </section>

      </div>

    </div>

  )
}

export default Profile