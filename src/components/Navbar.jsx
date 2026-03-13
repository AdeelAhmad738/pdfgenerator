import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../context/TaskContext"

const Navbar = () => {
  const navigate = useNavigate()
  const { notifications, invites, currentUserEmail, currentUserName } = useTasks()
  const [searchQuery, setSearchQuery] = useState("")

  const unreadCount = useMemo(() => {
    const email = (currentUserEmail || "").toLowerCase()
    const unreadNotifs = notifications.filter((n) => !n.read).length
    const pendingInvites = invites.filter(
      (i) => (i.to_email || i.email || "").toLowerCase() === email && i.status === "pending"
    ).length
    return unreadNotifs + pendingInvites
  }, [notifications, invites, currentUserEmail])

  const userLabel = currentUserName || currentUserEmail || "User"
  const initials = userLabel
    .split("@")[0]
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "U"

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/dashboard/tasks?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">TF</span>
        <span className="navbar__name">TaskFlow</span>
      </div>

      <div className="navbar__search">
        <svg className="navbar__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search tasks… (Enter)"
          aria-label="Search tasks"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <div className="navbar__actions">
        <button
          className="navbar__icon-button"
          type="button"
          onClick={() => navigate("/dashboard/notifications")}
          aria-label="Notifications"
        >
          <svg className="navbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3.5c-2.9 0-5.25 2.35-5.25 5.25v2.37c0 .86-.34 1.68-.95 2.29l-1.05 1.05a1 1 0 0 0 .7 1.71h13.1a1 1 0 0 0 .7-1.71l-1.05-1.05c-.61-.61-.95-1.43-.95-2.29V8.75C17.25 5.85 14.9 3.5 12 3.5Z" />
            <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
          </svg>
          {unreadCount > 0 && <span className="navbar__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </button>

        <button
          className="navbar__icon-button navbar__profile-btn"
          type="button"
          onClick={() => navigate("/dashboard/profile")}
          aria-label="Profile"
        >
          <span className="avatar">{initials}</span>
          <span className="navbar__profile-name">{userLabel.split("@")[0]}</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
