import { supabase, supabaseKey, supabaseUrl } from "./supabaseClient"

const isConfigured = () => {
  const envUrl = process.env.REACT_APP_SUPABASE_URL
  const envKey = process.env.REACT_APP_SUPABASE_ANON_KEY
  const hasEnv =
    Boolean(envUrl) &&
    Boolean(envKey) &&
    !envUrl.includes("YOUR_") &&
    !envKey.includes("YOUR_") &&
    !envKey.includes("<") &&
    !envKey.includes(">")

  const hasInline = Boolean(supabaseUrl) && Boolean(supabaseKey)
  return hasEnv || hasInline
}

const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  return user
}

export const isSupabaseEnabled = () => isConfigured()

export const fetchTasks = async () => {
  if (!isConfigured()) return []
  const user = await getCurrentUser()
  if (!user?.id) return []

  let query = supabase.from("tasks").select("*").order("created_at", { ascending: false })

  if (user.email) {
    query = query.or(`user_id.eq.${user.id},assigned_to_email.eq.${user.email}`)
  } else {
    query = query.eq("user_id", user.id)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

const mapTaskToDb = (task, user) => {
  return {
    title: task.title,
    description: task.description,
    status: task.status || "pending",
    assigned_to_email: task.assignedTo || null,
    created_by_email: task.createdByEmail || user?.email || null,
    shared: Boolean(task.shared),
    deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
    priority: task.priority || "medium",
    comments: task.comments || [],
    assignment_status: task.assignmentStatus || task.assignment_status || "active",
  }
}

const mapUpdatesToDb = (updates) => {
  const payload = { ...updates }

  if (Object.prototype.hasOwnProperty.call(payload, "assignedTo")) {
    payload.assigned_to_email = payload.assignedTo || null
    delete payload.assignedTo
  }

  if (Object.prototype.hasOwnProperty.call(payload, "createdByEmail")) {
    payload.created_by_email = payload.createdByEmail || null
    delete payload.createdByEmail
  }

  if (Object.prototype.hasOwnProperty.call(payload, "shared")) {
    payload.shared = Boolean(payload.shared)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "deadline") && payload.deadline) {
    payload.deadline = new Date(payload.deadline).toISOString()
  }

  if (Object.prototype.hasOwnProperty.call(payload, "assignmentStatus")) {
    payload.assignment_status = payload.assignmentStatus
    delete payload.assignmentStatus
  }

  return payload
}

export const createTask = async (task) => {
  if (!isConfigured()) return null
  const user = await getCurrentUser()
  if (!user?.id) return null

  const payload = {
    ...mapTaskToDb(task, user),
    user_id: user.id,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from("tasks").insert([payload]).select().single()
  if (error) throw error
  return data
}

export const updateTask = async (id, updates) => {
  if (!isConfigured()) return null

  const payload = mapUpdatesToDb(updates)

  const { data, error } = await supabase
    .from("tasks")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteTask = async (id) => {
  if (!isConfigured()) return false

  const { error } = await supabase.from("tasks").delete().eq("id", id)
  if (error) throw error
  return true
}

export const addCommentToTask = async (taskId, comment) => {
  if (!isConfigured()) return null

  // append comment to existing array field
  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("comments")
    .eq("id", taskId)
    .single()

  if (fetchError) throw fetchError

  const nextComments = [...(existing?.comments || []), comment]

  const { data, error } = await supabase
    .from("tasks")
    .update({ comments: nextComments, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single()

  if (error) throw error
  return data
}
