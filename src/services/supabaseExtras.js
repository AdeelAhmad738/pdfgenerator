import { supabase } from "./supabaseClient"

const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const fetchDraft = async () => {
  const user = await getCurrentUser()
  if (!user?.id) return null

  const { data, error } = await supabase
    .from("task_drafts")
    .select("draft, updated_at")
    .eq("user_id", user.id)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return data || null
}

export const upsertDraft = async (draft) => {
  const user = await getCurrentUser()
  if (!user?.id) return null

  const payload = {
    user_id: user.id,
    draft,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("task_drafts")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteDraft = async () => {
  const user = await getCurrentUser()
  if (!user?.id) return false

  const { error } = await supabase.from("task_drafts").delete().eq("user_id", user.id)
  if (error) throw error
  return true
}

export const fetchTemplates = async () => {
  const user = await getCurrentUser()
  if (!user?.id) return []

  const { data, error } = await supabase
    .from("task_templates")
    .select("*")
    .or(`user_id.eq.${user.id},shared.eq.true`)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const createTemplate = async (template) => {
  const user = await getCurrentUser()
  if (!user?.id) return null

  const payload = {
    user_id: user.id,
    name: template.label,
    category: template.category || "Custom",
    values: template.values || {},
    shared: Boolean(template.shared),
  }

  const { data, error } = await supabase
    .from("task_templates")
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTemplate = async (id, updates) => {
  const payload = {
    name: updates.label,
    category: updates.category,
    values: updates.values,
    shared: updates.shared,
  }

  const { data, error } = await supabase
    .from("task_templates")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteTemplate = async (id) => {
  const { error } = await supabase.from("task_templates").delete().eq("id", id)
  if (error) throw error
  return true
}

export const fetchViews = async () => {
  const user = await getCurrentUser()
  if (!user?.id) return []

  const { data, error } = await supabase
    .from("task_views")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const createView = async (view) => {
  const user = await getCurrentUser()
  if (!user?.id) return null

  const payload = {
    user_id: user.id,
    name: view.name,
    filters: view.filters,
  }

  const { data, error } = await supabase
    .from("task_views")
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteView = async (id) => {
  const { error } = await supabase.from("task_views").delete().eq("id", id)
  if (error) throw error
  return true
}

export const fetchInvites = async () => {
  const user = await getCurrentUser()
  if (!user?.id) return []

  let query = supabase
    .from("task_invites")
    .select("*")
    .order("created_at", { ascending: false })

  if (user.email) {
    query = query.or(`from_user_id.eq.${user.id},to_email.eq.${user.email}`)
  } else {
    query = query.eq("from_user_id", user.id)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const createInvite = async (payloadOrEmail) => {
  const user = await getCurrentUser()
  if (!user?.id) return null

  const payload =
    typeof payloadOrEmail === "string"
      ? { toEmail: payloadOrEmail, inviteType: "collaboration" }
      : payloadOrEmail || {}

  const toEmail = payload.toEmail || payload.email

  const insertPayload = {
    user_id: user.id,
    from_user_id: user.id,
    from_email: user.email || null,
    email: toEmail,
    to_email: toEmail,
    invite_type: payload.inviteType || "collaboration",
    task_id: payload.taskId || null,
    task_title: payload.taskTitle || null,
    task_description: payload.taskDescription || null,
    task_priority: payload.taskPriority || null,
    task_deadline: payload.taskDeadline ? new Date(payload.taskDeadline).toISOString() : null,
    status: "pending",
  }

  const { data, error } = await supabase
    .from("task_invites")
    .insert([insertPayload])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateInviteStatus = async (id, status) => {
  const { data, error } = await supabase
    .from("task_invites")
    .update({ status })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteInvite = async (id) => {
  const { error } = await supabase.from("task_invites").delete().eq("id", id)
  if (error) throw error
  return true
}

export const uploadAttachment = async ({ taskId, file }) => {
  const user = await getCurrentUser()
  if (!user?.id) return null

  const filePath = `${user.id}/${taskId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from("task-files")
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage.from("task-files").getPublicUrl(filePath)

  const payload = {
    task_id: taskId,
    name: file.name,
    type: file.type,
    size: file.size,
    path: filePath,
    url: publicUrlData?.publicUrl || null,
  }

  const { data, error } = await supabase
    .from("task_attachments")
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return data
}

export const fetchAttachments = async (taskId) => {
  const { data, error } = await supabase
    .from("task_attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const deleteAttachment = async (attachment) => {
  if (!attachment) return false
  if (attachment.path) {
    await supabase.storage.from("task-files").remove([attachment.path])
  }
  const { error } = await supabase.from("task_attachments").delete().eq("id", attachment.id)
  if (error) throw error
  return true
}

export const sendInviteEmail = async (payload) => {
  const endpoint = process.env.REACT_APP_INVITE_FUNCTION_URL
  if (!endpoint) return false
  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return true
}

export const fetchNotifications = async () => {
  const user = await getCurrentUser()
  if (!user?.id) return []

  const { data, error } = await supabase
    .from("task_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("time", { ascending: false })

  if (error) throw error
  return data || []
}

export const createNotification = async ({ title, message, time }) => {
  const user = await getCurrentUser()
  if (!user?.id) return null

  const payload = {
    user_id: user.id,
    title,
    message,
    action_link: null,
    action_label: null,
    task_id: null,
    time: time ? new Date(time).toISOString() : new Date().toISOString(),
    read: false,
  }

  const { data, error } = await supabase
    .from("task_notifications")
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return data
}

export const createNotificationForUser = async ({ userId, title, message, time }) => {
  if (!userId) return null
  const payload = {
    user_id: userId,
    title,
    message,
    action_link: null,
    action_label: null,
    task_id: null,
    time: time ? new Date(time).toISOString() : new Date().toISOString(),
    read: false,
  }
  const { data, error } = await supabase
    .from("task_notifications")
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}

export const createNotificationWithAction = async ({
  userId,
  title,
  message,
  time,
  actionLink,
  actionLabel,
  taskId,
}) => {
  const payload = {
    user_id: userId,
    title,
    message,
    action_link: actionLink || null,
    action_label: actionLabel || null,
    task_id: taskId || null,
    time: time ? new Date(time).toISOString() : new Date().toISOString(),
    read: false,
  }
  const { data, error } = await supabase
    .from("task_notifications")
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}

export const markNotificationRead = async (id) => {
  const { error } = await supabase
    .from("task_notifications")
    .update({ read: true })
    .eq("id", id)
  if (error) throw error
  return true
}

export const markAllNotificationsRead = async () => {
  const user = await getCurrentUser()
  if (!user?.id) return false

  const { error } = await supabase
    .from("task_notifications")
    .update({ read: true })
    .eq("user_id", user.id)

  if (error) throw error
  return true
}

export const fetchActivity = async (taskId) => {
  if (!taskId) return []
  const { data, error } = await supabase
    .from("task_activity")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export const createActivity = async ({ taskId, action, details = {} }) => {
  if (!taskId || !action) return null
  const user = await getCurrentUser()
  if (!user?.id) return null
  const payload = {
    task_id: taskId,
    actor_id: user.id,
    actor_email: user.email || null,
    action,
    details,
  }
  const { data, error } = await supabase
    .from("task_activity")
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}
