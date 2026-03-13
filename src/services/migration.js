import { supabase } from "./supabaseClient"
import { createTask } from "./supabaseTasks"
import {
  createTemplate,
  createView,
  createInvite,
  createNotification,
  upsertDraft,
} from "./supabaseExtras"

const safeJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export const migrateLocalDataOnce = async () => {
  if (localStorage.getItem("task_manager_migrated") === "true") return

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) return

  // Tasks
  const localTasks = safeJson(localStorage.getItem("task_manager_tasks"), [])
  for (const task of localTasks) {
    try {
      await createTask(task)
    } catch {
      // ignore individual task failures
    }
  }

  // Draft
  const localDraft = safeJson(localStorage.getItem("task_manager_draft"), null)
  if (localDraft) {
    try {
      await upsertDraft(localDraft)
    } catch {
      // ignore
    }
  }

  // Templates
  const templateKey = `task_manager_templates_${user.email || "guest"}`
  const localTemplates = safeJson(localStorage.getItem(templateKey), [])
  for (const template of localTemplates) {
    try {
      await createTemplate({
        label: template.label,
        category: template.category || "Custom",
        values: template.values || {},
        shared: Boolean(template.shared),
      })
    } catch {
      // ignore
    }
  }

  // Saved views
  const viewsKey = `task_manager_saved_views_${user.email || "guest"}`
  const localViews = safeJson(localStorage.getItem(viewsKey), [])
  for (const view of localViews) {
    try {
      await createView({
        name: view.name,
        filters: view.filters,
      })
    } catch {
      // ignore
    }
  }

  // Invites
  const localInvites = safeJson(localStorage.getItem("task_manager_invites"), [])
  for (const invite of localInvites) {
    try {
      await createInvite(invite.email)
    } catch {
      // ignore
    }
  }

  // Notifications
  const localNotifications = safeJson(localStorage.getItem("task_manager_notifications"), [])
  for (const note of localNotifications) {
    try {
      await createNotification({
        title: note.title,
        message: note.message,
        time: note.time,
      })
    } catch {
      // ignore
    }
  }

  localStorage.setItem("task_manager_migrated", "true")
}
