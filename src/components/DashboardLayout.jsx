import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useMemo, useEffect } from "react"
import { supabase } from "../services/supabaseClient"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import { useTasks } from "../context/TaskContext"

const DashboardLayout = () => {
  const navigate = useNavigate()
  const { invites, currentUserEmail, preferences } = useTasks()

  useEffect(() => {
    if (preferences.darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [preferences.darkMode])

  const pendingInviteCount = useMemo(() => {
    const email = (currentUserEmail || "").toLowerCase()
    return invites.filter(
      (i) => (i.to_email || i.email || "").toLowerCase() === email && i.status === "pending"
    ).length
  }, [invites, currentUserEmail])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  const mainLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>,
    },
    {
      to: "/dashboard/tasks",
      label: "My Tasks",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h11M9 6h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>,
    },
    {
      to: "/dashboard/team",
      label: "Team Tasks",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 11a4 4 0 1 0-8 0"/><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/><path d="M20 8a3 3 0 1 0-5.2-2"/></svg>,
    },
    {
      to: "/dashboard/reports",
      label: "Reports",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19h16M6 17V7m6 10V5m6 12v-8"/></svg>,
    },
  ]

  const workspaceLinks = [
    {
      to: "/dashboard/collaboration",
      label: "Collaboration",
      badge: pendingInviteCount,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 20h5v-2a4 4 0 0 0-4-4"/><path d="M9 20H4v-2a4 4 0 0 1 4-4"/><circle cx="12" cy="7" r="4"/><path d="M17 7c0-2.2-1.8-4-4-4S9 4.8 9 7"/></svg>,
    },
    {
      to: "/dashboard/settings",
      label: "Settings",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M3 12a9 9 0 0 1 .2-1.9l2.2-.3.9-1.8-1.4-1.8A9 9 0 0 1 7.5 3l1.8 1.4 1.8-.9.3-2.2A9 9 0 0 1 12 2c.7 0 1.3.1 1.9.2l.3 2.2 1.8.9 1.8-1.4A9 9 0 0 1 21 6.1l-1.4 1.8.9 1.8 2.2.3c.1.6.2 1.2.2 1.9s-.1 1.3-.2 1.9l-2.2.3-.9 1.8 1.4 1.8A9 9 0 0 1 16.5 21l-1.8-1.4-1.8.9-.3 2.2A9 9 0 0 1 12 22c-.7 0-1.3-.1-1.9-.2l-.3-2.2-1.8-.9-1.8 1.4A9 9 0 0 1 3 17.9l1.4-1.8-.9-1.8-2.2-.3A9 9 0 0 1 3 12z"/></svg>,
    },
    {
      to: "/dashboard/profile",
      label: "Profile",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21c0-4.4-3.6-8-8-8s-8 3.6-8 8"/><circle cx="12" cy="7" r="4"/></svg>,
    },
  ]

  const renderLink = (link) => (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.to === "/dashboard"}
      className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
    >
      <span className="sidebar__link-content">
        <span className="sidebar__link-icon">{link.icon}</span>
        <span>{link.label}</span>
      </span>
      {link.badge > 0 && <span className="sidebar__badge">{link.badge > 9 ? "9+" : link.badge}</span>}
    </NavLink>
  )

  return (
    <div className="app">
      <Navbar />
      <div className="layout">
        <Sidebar>
          <div className="sidebar__section-title">Main</div>
          <nav className="sidebar__nav">{mainLinks.map(renderLink)}</nav>
          <div className="sidebar__section-title">Workspace</div>
          <nav className="sidebar__nav">{workspaceLinks.map(renderLink)}</nav>
          <div className="sidebar__footer">
            <button className="sidebar__logout" type="button" onClick={handleSignOut}>
              <span className="sidebar__link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>
                </svg>
              </span>
              Sign out
            </button>
          </div>
        </Sidebar>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
