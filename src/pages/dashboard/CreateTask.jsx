import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"
import TaskForm from "../../components/TaskForm"
import { uploadAttachment } from "../../services/supabaseExtras"

export default function CreateTask() {
  const navigate = useNavigate()
  const { tasks, addTask, currentUserId } = useTasks()
  const [draft, setDraft] = useState({})
  const [attachments, setAttachments] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [savedAt, setSavedAt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Teammate suggestions from existing tasks
  const assigneeSuggestions = useMemo(() => {
    const emails = new Set()
    tasks.forEach((task) => {
      if (task.assignedTo) emails.add(task.assignedTo)
      if (task.assigned_to_email) emails.add(task.assigned_to_email)
    })
    return Array.from(emails)
  }, [tasks])

  // Get user-specific storage key
  const draftStorageKey = `task_draft_${currentUserId}`

  // Load draft on mount
  useEffect(() => {
    if (!currentUserId) return
    try {
      const stored = localStorage.getItem(draftStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        setDraft(parsed)
        setSavedAt(new Date().toLocaleTimeString())
      }
    } catch {
      // ignore
    }
  }, [currentUserId, draftStorageKey])

  // Autosave draft
  const handleDraftChange = (values) => {
    const nextDraft = { ...draft, ...values }
    setDraft(nextDraft)
    if (!currentUserId) return
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify(nextDraft))
      setSavedAt(new Date().toLocaleTimeString())
    } catch {
      // ignore
    }
  }

  // File validation & upload
  const validateFiles = (files) =>
    files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
    )

  const handleFileUpload = (e) => {
    const validFiles = validateFiles(Array.from(e.target.files))
    setAttachments((prev) => [...prev, ...validFiles])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const validFiles = validateFiles(Array.from(e.dataTransfer.files))
    setAttachments((prev) => [...prev, ...validFiles])
  }

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Submit task
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!draft.title || !draft.title.trim()) {
      setError("A task title is required.")
      setLoading(false)
      return
    }

    try {
      const newTask = await addTask(draft)
      if (attachments.length > 0) {
        for (const file of attachments) {
          await uploadAttachment({ taskId: newTask.id, file })
        }
      }
      localStorage.removeItem(draftStorageKey)
      navigate("/dashboard/tasks")
    } catch (error) {
      console.error("Task creation failed", error)
      setError("Failed to create task. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Clear draft
  const clearDraft = async () => {
    setDraft({})
    setAttachments([])
    setSavedAt("")
    try {
      localStorage.removeItem(draftStorageKey)
    } catch {}
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Create Task</h1>
          <p className="small-text">Create a task, attach files, and assign it to your team.</p>
          {savedAt && <p className="small-text">Draft saved at {savedAt}</p>}
        </div>
        <div className="page-actions">
          <button className="button button--ghost" onClick={clearDraft}>Clear Draft</button>
        </div>
      </div>

      <div className="dashboard__grid--two">
        {/* MAIN FORM */}
        <section className="dashboard__panel">
          <form onSubmit={handleSubmit}>
            <TaskForm
              initialValues={draft}
              onChange={handleDraftChange}
              statusControl="buttons"
              assigneeSuggestions={assigneeSuggestions}
              hideSubmit
              renderFormWrapper={false}
            />

            {/* File Upload */}
            <div className="form-group" style={{ marginTop: 30 }}>
              <label>Attach Files</label>
              <div
                className={`upload-dropzone ${dragActive ? "active" : ""}`}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <p>Drag & drop PDF or Excel files here</p>
                <span className="small-text">or click below to upload</span>
                <input type="file" accept=".pdf,.xls,.xlsx" multiple onChange={handleFileUpload} />
              </div>

              {attachments.length > 0 && (
                <div className="attachment-list">
                  {attachments.map((file, index) => (
                    <div key={index} className="attachment-item">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        className="button button--ghost button--small"
                        onClick={() => removeAttachment(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {error && <div className="alert alert--error">{error}</div>}
            </div>

            <button
              type="submit"
              className="button button--primary button--large"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </form>
        </section>

        {/* Productivity Tips */}
        <section className="dashboard__panel dashboard__panel--soft">
          <h3>Task Guidelines</h3>
          <div className="task-list">
            <div className="activity-item"><strong>1. Write a clear task title.</strong></div>
            <div className="activity-item"><strong>2. Assign the responsible teammate.</strong></div>
            <div className="activity-item"><strong>3. Add supporting documents if needed.</strong></div>
            <div className="activity-item"><strong>4. Set priority and due date.</strong></div>
            <div className="activity-item"><strong>5. Review and create your task.</strong></div>
          </div>
        </section>
      </div>

      
    </div>
  )
}