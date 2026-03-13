import React, { useEffect, useState } from "react"

const CommentForm = ({ initialText = "", onSubmit, onCancel }) => {
  const [text, setText] = useState(initialText)
  const [error, setError] = useState("")

  useEffect(() => {
    setText(initialText)
    setError("")
  }, [initialText])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")

    if (!text.trim()) {
      setError("Please enter a comment before saving.")
      return
    }

    onSubmit(text.trim())
    setText("")
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="comment-text">Add a comment</label>
        <textarea
          id="comment-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share an update or note..."
          rows={3}
        />
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="task-form__actions">
        <button type="submit" className="button">
          Add comment
        </button>
        {onCancel && (
          <button type="button" className="button button--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default CommentForm
