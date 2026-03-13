import { Link } from "react-router-dom"

function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">Collaborative Task Management System</div>
        <div className="landing-actions">
          <Link className="button button--ghost" to="/">
            Login
          </Link>
          <Link className="button" to="/signup">
            Sign Up
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div>
          <h1>Collaborate. Manage. Deliver.</h1>
          <p>
            A clean, professional workspace for teams to plan, track, and export
            their tasks with confidence.
          </p>
          <div className="landing-actions">
            <Link className="button" to="/signup">
              Get Started
            </Link>
            <Link className="button button--ghost" to="/dashboard">
              View Demo
            </Link>
          </div>
        </div>
        <div className="landing-hero-card">
          <div className="landing-hero-pill">Team Productivity</div>
          <h3>Everything your FYP needs</h3>
          <ul>
            <li>Kanban task tracking</li>
            <li>Collaboration invites</li>
            <li>PDF and Excel exports</li>
            <li>Progress insights</li>
          </ul>
        </div>
      </section>

      <section className="landing-features">
        <div className="feature-card">
          <h3>Collaborative Task Management</h3>
          <p>Organize tasks by status, priority, and due date.</p>
        </div>
        <div className="feature-card">
          <h3>Team Collaboration</h3>
          <p>Invite teammates and share task progress in real time.</p>
        </div>
        <div className="feature-card">
          <h3>Reports</h3>
          <p>Export polished PDF and Excel reports instantly.</p>
        </div>
        <div className="feature-card">
          <h3>Fast Performance</h3>
          <p>Lightweight UI with instant updates and clean visuals.</p>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready to build your best project?</h2>
        <p>Start now and showcase a modern SaaS experience.</p>
        <Link className="button" to="/signup">
          Create your workspace
        </Link>
      </section>

      <footer className="landing-footer">
        <span>Built for your Final Year Project</span>
        <span>PDF and Excel reporting included</span>
      </footer>
    </div>
  )
}

export default Landing
