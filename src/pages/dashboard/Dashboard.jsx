import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"

const StatCard = ({ label, value }) => (
  <div className="stat-card">
    <h4>{label}</h4>
    <strong>{value}</strong>
  </div>
)

const formatDate = (value) => {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString()
}

export default function Dashboard() {

  const navigate = useNavigate()
  const { tasks, currentUserName, currentUserEmail } = useTasks()

  const stats = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : []
    const s = { total: safeTasks.length, completed: 0, progress: 0, pending: 0 }

    safeTasks.forEach((t) => {

      const status = t.status === "complete" ? "completed" : t.status

      if (status === "completed") s.completed++
      else if (status === "progress") s.progress++
      else s.pending++

    })

    return s

  }, [tasks])


  const completionRate =
    stats.total ? Math.round((stats.completed / stats.total) * 100) : 0


  const upcomingTasks = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : []
    return safeTasks
      .filter((t) => t.deadline && new Date(t.deadline) > new Date())
      .sort((a,b)=> new Date(a.deadline) - new Date(b.deadline))
      .slice(0,5)

  }, [tasks])


  const recentTasks = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : []
    return safeTasks
      .sort((a,b)=> new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
      .slice(0,6)
  }, [tasks])


  const userName =
    currentUserName || (currentUserEmail ? currentUserEmail.split("@")[0] : "User")


  return (

    <div className="page-content">

      {/* HEADER */}

      <section className="page-hero">

        <div>
          <h1>Welcome back, {userName} 👋</h1>
          <p>Your productivity dashboard</p>
        </div>

        <button
          className="button"
          onClick={()=>navigate("/dashboard/create")}
        >
          + Create Task
        </button>

      </section>


      {/* STATS */}

      <div className="dashboard__stats">

        <StatCard label="Total Tasks" value={stats.total} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="In Progress" value={stats.progress} />
        <StatCard label="Pending" value={stats.pending} />

      </div>


      {/* PROGRESS */}

      <section className="dashboard__panel">

        <h3>Task Completion</h3>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <p>{completionRate}% tasks completed</p>

      </section>


      {/* UPCOMING DEADLINES */}

      <section className="dashboard__panel">

        <h3>Upcoming Deadlines</h3>

        {upcomingTasks.length === 0 ? (
          <p>No upcoming deadlines</p>
        ) : (

          <ul className="task-list">

            {upcomingTasks.map((t)=>(
              <li
                key={t.id}
                onClick={()=>navigate(`/dashboard/tasks/${t.id}`)}
              >
                <strong>{t.title}</strong>
                <span>{formatDate(t.deadline)}</span>
              </li>
            ))}

          </ul>

        )}

      </section>


      {/* RECENT TASKS TABLE */}

      <section className="dashboard__panel">

        <div className="dashboard__panel-header">

          <h3>Recent Tasks</h3>

          <button
            className="button button--ghost"
            onClick={()=>navigate("/dashboard/tasks")}
          >
            View All
          </button>

        </div>

        <table className="table">

          <thead>
            <tr>
              <th>Task</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Deadline</th>
            </tr>
          </thead>

          <tbody>

            {recentTasks.length === 0 ? (
              <tr>
                <td colSpan="4">No tasks found</td>
              </tr>
            ) : recentTasks.map((t)=>{

              const status = t.status === "complete" ? "completed" : t.status
              const priority = t.priority || "medium"

              return (

                <tr
                  key={t.id}
                  onClick={()=>navigate(`/dashboard/tasks/${t.id}`)}
                  style={{ cursor:"pointer" }}
                >

                  <td>{t.title}</td>

                  <td>
                    <span className={`status-pill status-pill--${status}`}>
                      {status}
                    </span>
                  </td>

                  <td>
                    <span className={`priority-pill priority-pill--${priority}`}>
                      {priority}
                    </span>
                  </td>

                  <td>{formatDate(t.deadline)}</td>

                </tr>

              )

            })}

          </tbody>

        </table>

      </section>

    </div>

  )
}