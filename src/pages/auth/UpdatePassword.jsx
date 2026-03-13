import { useState } from "react"
import { supabase } from "../../services/supabaseClient"
import { useNavigate, Link } from "react-router-dom"

function UpdatePassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!password || !confirmPassword) {
      setError("Please complete both fields.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setIsLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess("Password updated. You can sign in now.")
      setPassword("")
      setConfirmPassword("")
      setTimeout(() => navigate("/"), 1200)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card--center">
        <div className="auth-card__header">
          <h2>Set a new password</h2>
          <p>Create a strong password to secure your account.</p>
        </div>

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              autoComplete="new-password"
              required
            />
          </div>

          <button className="button button--block" type="submit" disabled={isLoading}>
            {isLoading ? "Updating password..." : "Update password"}
          </button>

          {error && <div className="alert">{error}</div>}
          {success && <div className="alert alert--success">{success}</div>}

          <p className="small-text">
            Remembered your password? <Link to="/">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default UpdatePassword
