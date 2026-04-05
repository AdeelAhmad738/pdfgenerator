import React, { useState } from "react"
import { useTasks } from "../context/TaskContext"

const AssignTaskForm = ({ task, onAssignSuccess, onCancel, suggestedEmails = [] }) => {
  const { assignTaskToUser } = useTasks()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("Please enter an email address.")
      return
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    setLoading(true)
    try {
      await assignTaskToUser(task.id, trimmedEmail)
      onAssignSuccess?.()
      setEmail("")
    } catch (err) {
      console.error("Assignment failed:", err)
      setError("Failed to assign task. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="assign-task-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="assign-email">Assign to (email)</label>
        <input
          id="assign-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter teammate's email"
          disabled={loading}
          autoFocus
        />
        {suggestedEmails.length > 0 && (
          <div className="suggestion-row">
            {suggestedEmails.slice(0, 5).map((suggestedEmail) => (
              <button
                key={suggestedEmail}
                type="button"
                className="suggestion-chip"
                onClick={() => setEmail(suggestedEmail)}
                disabled={loading}
              >
                {suggestedEmail}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="task-form__actions">
        <button
          type="submit"
          className="button button--primary"
          disabled={loading}
        >
          {loading ? "Assigning..." : "Assign Task"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="button button--ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default AssignTaskForm
