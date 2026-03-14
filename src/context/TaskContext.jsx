import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  isSupabaseEnabled,
  fetchTasks as fetchTasksFromDb,
  createTask as createTaskInDb,
  updateTask as updateTaskInDb,
  deleteTask as deleteTaskInDb,
  addCommentToTask,
} from "../services/supabaseTasks"
import { supabase } from "../services/supabaseClient"
import {
  fetchInvites,
  createInvite,
  deleteInvite,
  updateInviteStatus,
  fetchNotifications,
  createNotificationWithAction,
  createActivity,
  markNotificationRead as markNotificationReadInDb,
  markAllNotificationsRead as markAllNotificationsReadInDb,
  sendInviteEmail,
  createNotificationForUser,
} from "../services/supabaseExtras"
import { migrateLocalDataOnce } from "../services/migration"

const TaskContext = createContext(null)

const generateId = () => {
  return uuidv4()
}

export const TaskProvider = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState("")
  const [currentUserEmail, setCurrentUserEmail] = useState("")
  const [currentUserName, setCurrentUserName] = useState("")
  const [tasks, setTasks] = useState(() => {
    // Don't load from localStorage on init - wait for user to be set
    return []
  })

  // Whether the Supabase config is present
  const isRemoteEnabled = isSupabaseEnabled()

  // Whether the Supabase DB tables are actually accessible at runtime
  const [isDbReady, setIsDbReady] = useState(false)

  const [notifications, setNotifications] = useState([])
  const [invites, setInvites] = useState([])
  // Default preferences
  const defaultPreferences = {
    autoAssignDueDates: true,
    showCompletedTasks: true,
    autoRestoreDrafts: true,
    emailAlerts: true,
    dailySummary: false,
    enableTaskPriority: true,
    preventDuplicateTasks: false,
    confirmDelete: true,
    confirmTaskCompletion: false,
    showProductivityStats: true,
    showOverdueTasks: true,
    showRecentActivity: true,
    includeCompletedInReports: false,
    includePriorityInReports: true,
    enableQuickExport: true,
    notifyOnAssign: true,
    notifyOnDeadline: true,
    notifyOnComments: true,
    enableTeamVisibility: true,
    compactView: false,
    showAvatars: false,
  }

  const [preferences, setPreferences] = useState(defaultPreferences)

  // Load preferences when user changes
  useEffect(() => {
    if (!currentUserId) {
      setPreferences(defaultPreferences)
      document.documentElement.classList.remove('dark-mode')
      return
    }
    try {
      const storageKey = `task_manager_preferences_${currentUserId}`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const prefs = JSON.parse(stored)
        setPreferences(prefs)
      } else {
        setPreferences(defaultPreferences)
      }
    } catch {
      setPreferences(defaultPreferences)
    }
    // Always keep light mode enabled
    document.documentElement.classList.remove('dark-mode')
  }, [currentUserId])

  // Save preferences to user-specific storage
  useEffect(() => {
    if (!currentUserId) return
    try {
      const storageKey = `task_manager_preferences_${currentUserId}`
      localStorage.setItem(storageKey, JSON.stringify(preferences))
    } catch {
      // ignore storage errors
    }
  }, [preferences, currentUserId])

  const updatePreference = useCallback((key, value) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value }
      // Apply compact view
      if (key === 'compactView') {
        if (value) {
          document.documentElement.classList.add('compact-view')
        } else {
          document.documentElement.classList.remove('compact-view')
        }
      }
      return updated
    })
  }, [])

  // Clear old user's localStorage when user changes
  useEffect(() => {
    if (!currentUserId) return
    
    // Clear localStorage from previous user to prevent data bleed
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        // Only clear user-specific keys, not global ones
        if (key.includes('task_') && !key.includes(currentUserId)) {
          localStorage.removeItem(key)
        }
      })
    } catch {
      // ignore errors
    }
  }, [currentUserId])

  const normalizeTask = useCallback((task) => {
    if (!task) return task
    return {
      ...task,
      createdAt: task.createdAt ?? task.created_at ?? task.createdAt,
      updatedAt: task.updatedAt ?? task.updated_at ?? task.updatedAt,
      assignedTo: task.assignedTo ?? task.assigned_to_email ?? task.assignedTo,
      createdByEmail: task.createdByEmail ?? task.created_by_email ?? task.createdByEmail,
      deadline: task.deadline ?? task.deadline,
      assignmentStatus:
        task.assignmentStatus ??
        task.assignment_status ??
        task.assignmentStatus ??
        "active",
    }
  }, [])

  // Load the authenticated user
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      setCurrentUserId(data?.user?.id || "")
      setCurrentUserEmail(data?.user?.email || "")
      setCurrentUserName(data?.user?.user_metadata?.full_name || "")
    }
    loadUser()
  }, [])

  // Test DB connectivity once user is available — probe the tasks table
  useEffect(() => {
    if (!isRemoteEnabled || !currentUserId) return

    const testDb = async () => {
      try {
        const { error } = await supabase.from("tasks").select("id").limit(1)
        if (error) {
          console.warn("[TaskContext] DB tables not available — using local storage.", error.message)
          setIsDbReady(false)
        } else {
          setIsDbReady(true)
        }
      } catch (err) {
        console.warn("[TaskContext] DB probe failed — using local storage.", err)
        setIsDbReady(false)
      }
    }

    testDb()
  }, [currentUserId, isRemoteEnabled])

  // Load remote tasks once DB is confirmed available
  useEffect(() => {
    if (!isDbReady) return

    const loadRemoteTasks = async () => {
      try {
        const remoteTasks = await fetchTasksFromDb()
        if (remoteTasks && remoteTasks.length) {
          setTasks(remoteTasks.map(normalizeTask))
        }
      } catch {
        // keep local state on failure
      }
    }

    loadRemoteTasks()
  }, [isDbReady, normalizeTask])

  const addNotification = useCallback(
    async ({ title, message, time = Date.now(), actionLink, actionLabel, taskId }) => {
      if (!isDbReady) return
      try {
        const saved = await createNotificationWithAction({
          userId: currentUserId,
          title,
          message,
          time,
          actionLink,
          actionLabel,
          taskId,
        })
        setNotifications((current) => [saved, ...current])
      } catch {
        // ignore
      }
    },
    [currentUserId, isDbReady]
  )

  const logActivity = useCallback(
    async (taskId, action, details = {}) => {
      if (!isDbReady) return
      try {
        await createActivity({ taskId, action, details })
      } catch {
        // ignore
      }
    },
    [isDbReady]
  )

  // Realtime subscription — only when DB is ready
  useEffect(() => {
    if (!isDbReady || !currentUserId) return

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          const record = normalizeTask(payload.new || payload.old)
          const assignedMatch =
            currentUserEmail &&
            record?.assignedTo?.toLowerCase() === currentUserEmail.toLowerCase() &&
            record?.assignmentStatus === "active"
          const isVisible = record?.user_id === currentUserId || assignedMatch

          if (!isVisible) return

          if (payload.eventType === "INSERT") {
            setTasks((current) => {
              const exists = current.some((task) => task.id === record.id)
              return exists ? current : [record, ...current]
            })
            if (assignedMatch && record?.user_id !== currentUserId) {
              addNotification({
                title: "Task assigned",
                message: `You were assigned "${record.title}".`,
                time: Date.now(),
                taskId: record.id,
                actionLink: `/dashboard/tasks/${record.id}`,
                actionLabel: "Open task",
              })
            }
          }

          if (payload.eventType === "UPDATE") {
            setTasks((current) =>
              current.map((task) => (task.id === record.id ? record : task))
            )
          }

          if (payload.eventType === "DELETE") {
            setTasks((current) => current.filter((task) => task.id !== record.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addNotification, currentUserEmail, currentUserId, isDbReady, normalizeTask])

  // Load notifications and invites when DB is ready
  useEffect(() => {
    if (!isDbReady || !currentUserId) return

    migrateLocalDataOnce()

    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications()
        setNotifications(data)
      } catch {
        // ignore
      }
    }

    const loadInvites = async () => {
      try {
        const data = await fetchInvites()
        setInvites(data)
      } catch {
        // ignore
      }
    }

    loadNotifications()
    loadInvites()
  }, [currentUserId, isDbReady])

  const addInvite = useCallback(
    async (email) => {
      if (!isDbReady) return
      try {
        const invite = await createInvite({ toEmail: email, inviteType: "collaboration" })
        setInvites((current) => [invite, ...current])
        await addNotification({
          title: "Collaboration invite sent",
          message: `Invitation sent to ${email}.`,
          time: Date.now(),
          actionLink: "/dashboard/collaboration",
          actionLabel: "Open collaboration",
        })
        await sendInviteEmail({
          to: email,
          subject: "You're invited to collaborate",
          message: "You have been invited to a task workspace.",
        })
      } catch {
        // ignore
      }
    },
    [addNotification, isDbReady]
  )

  const removeInvite = useCallback(
    async (id) => {
      if (!isDbReady) return
      try {
        await deleteInvite(id)
        setInvites((current) => current.filter((invite) => invite.id !== id))
      } catch {
        // ignore
      }
    },
    [isDbReady]
  )

  const respondToInvite = useCallback(
    async (invite, status) => {
      if (!isDbReady || !invite?.id) return
      try {
        const updatedInvite = await updateInviteStatus(invite.id, status)
        setInvites((current) =>
          current.map((item) => (item.id === invite.id ? updatedInvite : item))
        )

        if (invite.invite_type === "task" && invite.task_id) {
          if (status === "accepted") {
            await updateTaskInDb(invite.task_id, { assignment_status: "active" })
          }
          if (status === "declined") {
            await updateTaskInDb(invite.task_id, {
              assignment_status: "declined",
              assigned_to_email: null,
            })
          }
        }

        await addNotification({
          title: "Invite response",
          message: `You ${status} the ${invite.invite_type || "collaboration"} invite.`,
          time: Date.now(),
          actionLink: "/dashboard/collaboration",
          actionLabel: "Open collaboration",
        })
      } catch {
        // ignore
      }
    },
    [addNotification, isDbReady]
  )

  const addTask = useCallback(
    async ({
      title,
      description,
      assignedTo = "",
      deadline,
      priority = "medium",
      shared = false,
      status = "pending",
    }) => {
      const normalizedAssigned = assignedTo.trim()
      const assignmentStatus =
        normalizedAssigned && normalizedAssigned !== currentUserEmail ? "pending" : "active"

      const newTask = {
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        status: status || "pending",
        assignedTo: normalizedAssigned,
        createdByEmail: currentUserEmail || "",
        deadline: deadline ? new Date(deadline).getTime() : null,
        priority,
        shared,
        assignmentStatus,
        createdAt: Date.now(),
        comments: [],
      }

      if (isDbReady) {
        try {
          const saved = normalizeTask(await createTaskInDb(newTask))
          if (!saved) throw new Error("Supabase task create returned empty result")
          setTasks((current) => [saved, ...current])
          logActivity(saved.id, "created", { title: saved.title })
           if (
            normalizedAssigned &&
            normalizedAssigned !== currentUserEmail &&
            assignmentStatus === "pending"
          ) {
            try {
              const invite = await createInvite({
                toEmail: normalizedAssigned,
                inviteType: "task",
                taskId: saved.id,
                taskTitle: saved.title,
                taskDescription: saved.description,
                taskPriority: saved.priority,
                taskDeadline: saved.deadline,
              })
              setInvites((current) => [invite, ...current])
              
              // Add notification for creator
              addNotification({
                title: "Task assignment sent",
                message: `Assignment request sent to ${normalizedAssigned}.`,
                time: Date.now(),
                actionLink: "/dashboard/collaboration",
                actionLabel: "View invites",
              })
              
              // Try to send email notification to assigned user
              try {
                await sendInviteEmail({
                  to: normalizedAssigned,
                  subject: `You've been assigned a task: ${saved.title}`,
                  message: `A new task has been assigned to you: "${saved.title}". Please accept or decline the assignment.`,
                })
              } catch (emailError) {
                console.warn("Email notification failed, but task was created", emailError)
              }
            } catch (err) {
              console.error("Failed to create invite", err)
            }
          }
          return saved
        } catch {
          // fallback to local state
        }
      }

      setTasks((current) => [newTask, ...current])
      logActivity(newTask.id, "created", { title: newTask.title })
      if (newTask.assignedTo && newTask.assignedTo !== currentUserEmail) {
        addNotification({
          title: "Task assignment sent",
          message: `Assignment request sent to ${newTask.assignedTo}.`,
          time: Date.now(),
          actionLink: "/dashboard/collaboration",
          actionLabel: "View invites",
        })
      }
      return newTask
    },
    [addNotification, currentUserEmail, isDbReady, logActivity, normalizeTask]
  )

  const updateTask = useCallback(
    async (id, updates) => {
      const localAttachments = updates?.attachments
      const dbUpdates = { ...updates }
      if (dbUpdates.attachments) delete dbUpdates.attachments

      const normalizedAssigned = updates?.assignedTo?.trim?.() ?? updates?.assignedTo
      if (typeof normalizedAssigned === "string") {
        dbUpdates.assignedTo = normalizedAssigned
        dbUpdates.assignmentStatus =
          normalizedAssigned && normalizedAssigned !== currentUserEmail ? "pending" : "active"
      }

      if (isDbReady) {
        try {
          const updated = normalizeTask(await updateTaskInDb(id, dbUpdates))
          const merged = localAttachments
            ? { ...updated, attachments: localAttachments }
            : updated
          setTasks((current) =>
            current.map((task) => (task.id === id ? merged : task))
          )
          logActivity(id, "updated", { fields: Object.keys(dbUpdates || {}) })
          const previous = tasks.find((t) => t.id === id)
          if (
            previous &&
            currentUserEmail &&
            (previous.assignedTo || previous.assigned_to_email) &&
            currentUserEmail.toLowerCase() ===
              (previous.assignedTo || previous.assigned_to_email || "").toLowerCase() &&
            previous.user_id &&
            previous.user_id !== currentUserId
          ) {
            await createNotificationWithAction({
              userId: previous.user_id,
              title: "Assignee updated a task",
              message: `Task "${previous.title}" was updated by the assignee.`,
              time: Date.now(),
              taskId: previous.id,
              actionLink: `/dashboard/tasks/${previous.id}`,
              actionLabel: "Open task",
            })
          }
          if (
            normalizedAssigned &&
            normalizedAssigned !== currentUserEmail &&
            dbUpdates.assignmentStatus === "pending"
          ) {
            try {
              const invite = await createInvite({
                toEmail: normalizedAssigned,
                inviteType: "task",
                taskId: id,
                taskTitle: updated?.title,
                taskDescription: updated?.description,
                taskPriority: updated?.priority,
                taskDeadline: updated?.deadline,
              })
              setInvites((current) => [invite, ...current])
              
              addNotification({
                title: "Task assignment sent",
                message: `Assignment request sent to ${normalizedAssigned}.`,
                time: Date.now(),
                actionLink: "/dashboard/collaboration",
                actionLabel: "View invites",
              })
              
              // Send email to assigned user
              try {
                await sendInviteEmail({
                  to: normalizedAssigned,
                  subject: `You've been assigned a task: ${updated?.title}`,
                  message: `A task has been assigned to you: "${updated?.title}". Please accept or decline the assignment.`,
                })
              } catch (emailError) {
                console.warn("Email notification failed, but invite was created", emailError)
              }
            } catch (err) {
              console.error("Failed to create invite", err)
            }
          }
          return merged
        } catch {
          // fallback to local update
        }
      }

      setTasks((current) =>
        current.map((task) => (task.id === id ? { ...task, ...updates } : task))
      )
      const task = tasks.find((t) => t.id === id)
      if (task) {
        logActivity(id, "updated", { fields: Object.keys(updates || {}) })
        if (
          updates.assignedTo &&
          updates.assignedTo !== task.assignedTo &&
          updates.assignedTo !== currentUserEmail
        ) {
          addNotification({
            title: "Task assignment sent",
            message: `Assignment request sent to ${updates.assignedTo}.`,
            time: Date.now(),
            actionLink: "/dashboard/collaboration",
            actionLabel: "View invites",
          })
        }
      }
    },
    [
      addNotification,
      currentUserEmail,
      currentUserId,
      isDbReady,
      logActivity,
      normalizeTask,
      tasks,
    ]
  )

  const toggleTaskComplete = useCallback(
    async (id) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return

      const nextStatus = task.status === "completed" ? "pending" : "completed"

      if (isDbReady) {
        try {
          const updated = await updateTaskInDb(id, { status: nextStatus })
          setTasks((current) =>
            current.map((t) => (t.id === id ? updated : t))
          )
          logActivity(id, "status", { status: nextStatus })
          return
        } catch {
          // fallback to local
        }
      }

      setTasks((current) =>
        current.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      )
      logActivity(id, "status", { status: nextStatus })
    },
    [isDbReady, logActivity, tasks]
  )

  const addComment = useCallback(
    async (taskId, commentText) => {
      const comment = {
        id: generateId(),
        text: commentText,
        author: "You",
        createdAt: Date.now(),
      }

      if (isDbReady) {
        try {
          const updated = await addCommentToTask(taskId, comment)
          setTasks((current) =>
            current.map((task) => (task.id === taskId ? normalizeTask(updated) : task))
          )
        } catch {
          setTasks((current) =>
            current.map((task) =>
              task.id === taskId
                ? { ...task, comments: [...(task.comments || []), comment] }
                : task
            )
          )
        }
      } else {
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId
              ? { ...task, comments: [...(task.comments || []), comment] }
              : task
          )
        )
      }

      const task = tasks.find((t) => t.id === taskId)
      logActivity(taskId, "comment", { text: commentText })
      if (
        task &&
        currentUserEmail &&
        (task.assignedTo || task.assigned_to_email) &&
        currentUserEmail.toLowerCase() ===
          (task.assignedTo || task.assigned_to_email || "").toLowerCase() &&
        task.user_id &&
        task.user_id !== currentUserId
      ) {
        await createNotificationWithAction({
          userId: task.user_id,
          title: "Assignee commented",
          message: `New comment on "${task.title}".`,
          time: Date.now(),
          taskId: task.id,
          actionLink: `/dashboard/tasks/${task.id}`,
          actionLabel: "Open task",
        })
      }
    },
    [currentUserEmail, currentUserId, isDbReady, logActivity, normalizeTask, tasks]
  )

  const markAllNotificationsRead = useCallback(async () => {
    if (!isDbReady) return
    try {
      await markAllNotificationsReadInDb()
      setNotifications((current) => current.map((n) => ({ ...n, read: true })))
    } catch {
      // ignore
    }
  }, [isDbReady])

  const markNotificationRead = useCallback(
    async (id) => {
      if (!isDbReady) return
      try {
        await markNotificationReadInDb(id)
        setNotifications((current) =>
          current.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
      } catch {
        // ignore
      }
    },
    [isDbReady]
  )

  const deleteTask = useCallback(
    async (id) => {
      const task = tasks.find((t) => t.id === id)
      if (isDbReady) {
        try {
          await deleteTaskInDb(id)
          setTasks((current) => current.filter((task) => task.id !== id))
          if (task) logActivity(id, "deleted", { title: task.title })
          return
        } catch {
          // fallback to local delete
        }
      }

      setTasks((current) => current.filter((task) => task.id !== id))
      if (task) logActivity(id, "deleted", { title: task.title })
    },
    [isDbReady, logActivity, tasks]
  )

  const value = useMemo(
    () => ({
      tasks,
      notifications,
      invites,
      currentUserId,
      currentUserEmail,
      currentUserName,
      isDbReady,
      addTask,
      updateTask,
      toggleTaskComplete,
      deleteTask,
      addComment,
      addNotification,
      addInvite,
      removeInvite,
      respondToInvite,
      markAllNotificationsRead,
      markNotificationRead,
      preferences,
      updatePreference,
      isRemoteEnabled,
    }),
    [
      tasks,
      notifications,
      invites,
      currentUserId,
      currentUserEmail,
      currentUserName,
      isDbReady,
      addTask,
      updateTask,
      toggleTaskComplete,
      deleteTask,
      addComment,
      addNotification,
      addInvite,
      removeInvite,
      respondToInvite,
      markAllNotificationsRead,
      markNotificationRead,
      preferences,
      updatePreference,
      isRemoteEnabled,
    ]
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export const useTasks = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error("useTasks must be used within TaskProvider")
  }
  return context
}
