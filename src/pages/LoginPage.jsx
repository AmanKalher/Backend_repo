import { Link } from 'react-router-dom'
import Button from '../components/Button'

export default function LoginPage() {
  return (
    <main className="login-shell">
      <Link className="login-back" to="/" aria-label="Back to DiagNect home" title="Back to home">←</Link>
      <div className="login-brand-panel">
        <Link className="brand" to="/"><span className="brand-mark"><i /><i /><i /></span><span>Diag<span>Nect</span></span></Link>
        <p>Intelligent care starts with<br />a complete picture.</p>
      </div>
      <section className="login-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">Secure access</p>
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to your DiagNect workspace</p>

          {/* Note: This form currently does nothing on submit, which is correct for now! */}
          <form onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="you@hospital.org" />

            <div className="password-label">
              <label htmlFor="password">Password</label>
              <a href="#forgot">Forgot password?</a>
            </div>
            <input id="password" type="password" placeholder="••••••••••" />

            <label className="checkbox-label">
              <input type="checkbox" /> <span>Keep me signed in for 30 days</span>
            </label>

            {/* The main Login button */}
            <Button className="submit-button">Sign in</Button>
          </form>

          <div className="divider"><span>or</span></div>
          <button className="provider-button"><b>G</b> Continue with Google</button>
          <button className="provider-button"><b>⊞</b> Hospital SSO</button>

          {/* The clean, fixed Sign Up link! */}
          <p className="signup-copy">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>

        </div>
      </section>
    </main>
  )
}