import { useState } from "react"
import { supabase } from "../../services/supabaseClient"
import { useNavigate, Link } from "react-router-dom"

function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please complete all fields.")
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
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim()
        }
      }
    })
    setIsLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(
        "Account created! Check your email for a confirmation link, then log in."
      )
      setName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")

      setTimeout(() => {
        navigate("/")
      }, 1200)
    }
  }

  return (
    <div className="auth-shell auth-shell--simple">
      <div className="auth-simple-card auth-simple-card--wide">
        <div className="auth-split">
          <div className="auth-split__side">
            <div className="auth-simple-logo">TF</div>
            <h1>Collaborative Task Management System</h1>
            <p>Bring clarity to your final year project with a real SaaS workflow.</p>
            <ul className="auth-feature-list">
              <li>Smart drafts & templates</li>
              <li>Team invites with approval</li>
              <li>Professional dashboards</li>
            </ul>
          </div>

          <div className="auth-split__form">
            <div className="auth-simple-header">
              <h2>Create your account</h2>
              <p>Please enter your details to sign up</p>
            </div>

          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                required
              />
            </div>

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

            <label className="auth-checkbox">
              <input type="checkbox" required />
              <span>
                I accept <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms and conditions</span>
              </span>
            </label>

            <button className="button button--block" type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create an account"}
            </button>

            {error && <div className="alert">{error}</div>}
            {success && <div className="alert alert--success">{success}</div>}
          </form>

          <p className="auth-simple-footer">
            Already have an account? <Link to="/">Login</Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
