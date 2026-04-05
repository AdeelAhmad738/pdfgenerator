import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"

const timeLabel = (ts) => {
  const diff = Date.now() - ts
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 172800000) return "Yesterday"
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const isToday = (ts) => {
  const d = new Date(ts)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

const typeIcon = (title = "") => {
  const t = title.toLowerCase()
  if (t.includes("assign")) return "📌"
  if (t.includes("comment")) return "💬"
  if (t.includes("complet")) return "✅"
  if (t.includes("invite") || t.includes("collab")) return "🤝"
  if (t.includes("delet")) return "🗑️"
  if (t.includes("updat")) return "✏️"
  return "🔔"
}

function Notifications() {
  const navigate = useNavigate()
  const {
    notifications,
    invites,
    currentUserEmail,
    currentUserId,
    markAllNotificationsRead,
    markNotificationRead,
    respondToInvite,
    removeInvite,
  } = useTasks()
  const [filter, setFilter] = useState("all") // all | unread
  const [processingInviteId, setProcessingInviteId] = useState(null)

  const sorted = useMemo(() => {
    const email = (currentUserEmail || "").toLowerCase()
    const inviteNotes = invites
      .filter((i) => (i.to_email || i.email || "").toLowerCase() === email)
      .map((invite) => {
        const link =
          invite.invite_type === "task" && invite.task_id
            ? `/dashboard/tasks/${invite.task_id}`
            : "/dashboard/collaboration"
        const label = invite.invite_type === "task" ? "Open task" : "Open collaboration"
        return {
          id: `invite-${invite.id}`,
          type: "invite",
          invite,
          title:
            invite.invite_type === "task"
              ? `Task assignment invite · ${invite.task_title || "Untitled task"}`
              : "Collaboration invite",
          message: `From ${invite.from_email || "Teammate"} · ${invite.status}`,
          time: new Date(invite.created_at).getTime(),
          read: invite.status !== "pending",
          action_link: link,
          action_label: label,
          isRecipient: true,
          isSender: invite.from_user_id === currentUserId,
        }
      })

    return [...notifications, ...inviteNotes].sort((a, b) => b.time - a.time)
  }, [notifications, invites, currentUserEmail, currentUserId])

  const filtered = filter === "unread" ? sorted.filter((n) => !n.read) : sorted

  const todayItems = filtered.filter((n) => isToday(n.time))
  const earlierItems = filtered.filter((n) => !isToday(n.time))
  const unreadCount = sorted.filter((n) => !n.read).length

  const handleInviteResponse = async (invite, status) => {
    if (!invite) return
    setProcessingInviteId(invite.id)
    try {
      await respondToInvite(invite, status)
    } finally {
      setProcessingInviteId(null)
    }
  }

  const handleCancelInvite = async (inviteId) => {
    if (!inviteId) return
    setProcessingInviteId(inviteId)
    try {
      await removeInvite(inviteId)
    } finally {
      setProcessingInviteId(null)
    }
  }

  const renderNote = (note) => (
    <div
      key={note.id}
      className={`notification-item ${note.read ? "notification-item--read" : "notification-item--unread"}`}
    >
      <div className="notification-item__icon">{typeIcon(note.title, note.message)}</div>
      <div className="notification-item__body">
        <div className="notification-item__header">
          <span className="notification-item__title">{note.title}</span>
          <span className="notification-item__time">{timeLabel(note.time)}</span>
        </div>
        <p className="notification-item__msg">{note.message}</p>
        <div className="notification-item__actions">
          {note.action_link && (
            <button className="button button--small" type="button" onClick={() => navigate(note.action_link)}>
              {note.action_label || "Open"}
            </button>
          )}
          {note.type === "invite" && note.invite && (
            <>
              {note.invite.status === "pending" && note.isRecipient && (
                <>
                  <button
                    className="button button--small button--primary"
                    type="button"
                    onClick={() => handleInviteResponse(note.invite, "accepted")}
                    disabled={processingInviteId === note.invite.id}
                  >
                    Accept
                  </button>
                  <button
                    className="button button--small button--ghost"
                    type="button"
                    onClick={() => handleInviteResponse(note.invite, "declined")}
                    disabled={processingInviteId === note.invite.id}
                  >
                    Decline
                  </button>
                </>
              )}
              {note.invite.status === "pending" && note.isSender && (
                <button
                  className="link-button link-button--danger"
                  type="button"
                  onClick={() => handleCancelInvite(note.invite.id)}
                  disabled={processingInviteId === note.invite.id}
                >
                  Cancel invite
                </button>
              )}
            </>
          )}
          {note.type !== "invite" && !note.read && (
            <button
              className="link-button"
              type="button"
              onClick={() => markNotificationRead(note.id)}
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="small-text">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <div className="page-actions">
          <div className="filter-chips">
            <button className={`filter-chip ${filter === "all" ? "is-active" : ""}`} onClick={() => setFilter("all")}>All</button>
            <button className={`filter-chip ${filter === "unread" ? "is-active" : ""}`} onClick={() => setFilter("unread")}>
              Unread {unreadCount > 0 && <span className="chip-badge">{unreadCount}</span>}
            </button>
          </div>
          {unreadCount > 0 && (
            <button className="button button--ghost" type="button" onClick={markAllNotificationsRead}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="dashboard__panel">
          <div className="empty-state">
            <div className="empty-state__icon">🔔</div>
            <h2>{filter === "unread" ? "No unread notifications" : "No notifications yet"}</h2>
            <p>{filter === "unread" ? "You're all caught up!" : "Task updates and mentions will appear here."}</p>
          </div>
        </div>
      ) : (
        <div className="notifications-feed">
          {todayItems.length > 0 && (
            <div className="notifications-group">
              <div className="notifications-group__label">Today</div>
              <div className="dashboard__panel" style={{ padding: 0, overflow: "hidden" }}>
                {todayItems.map(renderNote)}
              </div>
            </div>
          )}
          {earlierItems.length > 0 && (
            <div className="notifications-group">
              <div className="notifications-group__label">Earlier</div>
              <div className="dashboard__panel" style={{ padding: 0, overflow: "hidden" }}>
                {earlierItems.map(renderNote)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Notifications
