import { useState } from "react"
import { supabase } from "../../services/supabaseClient"
import { useNavigate, Link } from "react-router-dom"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resetError, setResetError] = useState("")
  const [resetMessage, setResetMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!email.trim() || !password) {
      setError("Please enter both email and password.")
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    setIsLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess("Login successful. Redirecting to dashboard...")
      setTimeout(() => navigate("/dashboard"), 700)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setResetError("")
    setResetMessage("")

    if (!email.trim()) {
      setResetError("Enter your email above to receive reset instructions.")
      return
    }

    setIsResetting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`
    })
    setIsResetting(false)

    if (error) {
      setResetError(error.message)
    } else {
      setResetMessage("Password reset email sent. Check your inbox.")
    }
  }

  return (
    <div className="auth-shell auth-shell--simple">
      <div className="auth-simple-card auth-simple-card--wide">
        <div className="auth-split">
          <div className="auth-split__side">
            <div className="auth-simple-logo">CTMS</div>
            <h1>Collaborative Task Management System</h1>
            <p>Plan, assign, and deliver with clarity across the team.</p>
            <ul className="auth-feature-list">
              <li>Collaboration To Achieve Task</li>
              <li>Task assignment approvals</li>
              <li>PDF & Excel reporting</li>
            </ul>
          </div>

          <div className="auth-split__form">
            <div className="auth-simple-header">
              <h2>Welcome back</h2>
              <p>Please enter your details to log in</p>
            </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="auth-simple-row">
              <label className="auth-checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <button
                className="link-button"
                type="button"
                onClick={() => setShowReset((prev) => !prev)}
              >
                Forgot password
              </button>
            </div>

            <button className="button button--block" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </button>

            {error && <div className="alert">{error}</div>}
            {success && <div className="alert alert--success">{success}</div>}
          </form>

          {showReset && (
            <form className="reset-panel" onSubmit={handlePasswordReset}>
              <div className="reset-panel__header">
                <h3>Reset password</h3>
                <p>Send a secure reset link to your email.</p>
              </div>
              <button
                className="button button--ghost button--block"
                type="submit"
                disabled={isResetting}
              >
                {isResetting ? "Sending link..." : "Send reset link"}
              </button>
              {resetError && <div className="alert">{resetError}</div>}
              {resetMessage && (
                <div className="alert alert--success">{resetMessage}</div>
              )}
            </form>
          )}

          <p className="auth-simple-footer">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
