import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { doctor, loginDoctor } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(doctor?.email || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    setError('')

    setTimeout(() => {
      loginDoctor(email, password)
      setLoading(false)
      navigate('/dashboard')
    }, 600)
  }

  return (
    <main className="login-shell">
      <div className="login-brand-panel">
        <Link className="login-back" to="/" aria-label="Back to DiagNect home" title="Back to home">
          ←
        </Link>
        <div className="login-brand-logo"><BrandLogo /></div>

        <div className="login-visual-wrap">
          <p className="login-visual-kicker">PATIENT CONTEXT • CLINICAL INTELLIGENCE • SECURE ACCESS</p>
          <img
            className="login-medical-visual"
            src="/visual 2.png"
            alt="Medical professionals reviewing patient care information"
          />
        </div>

        <div className="login-supporting-copy">
          <h2>Intelligent care starts with<br />a complete picture.</h2>
          <p>Every patient has a story. DiagNect brings the<br />right clinical context together when it matters.</p>
        </div>
      </div>

      <section className="login-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">Secure access</p>
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to your DiagNect clinical workspace</p>

          {error && <div className="auth-alert-error">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="doctor@hospital.org"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                required
              />
            </div>

            <div className="field-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please sign in or create a new doctor account.'); }}>
                  Forgot password?
                </a>
              </div>
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M4 4 20 20" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div className="divider"><span>or</span></div>
          <button
            type="button"
            className="provider-button"
            onClick={() => {
              loginDoctor(email || 'doctor@hospital.org', 'google-sso')
              navigate('/dashboard')
            }}
          >
            <b>G</b> Continue with Google Workspace
          </button>
          <button
            type="button"
            className="provider-button"
            onClick={() => {
              loginDoctor(email || 'doctor@hospital.org', 'hospital-sso')
              navigate('/dashboard')
            }}
          >
            <b>⊞</b> Hospital SSO
          </button>

          <p className="signup-copy">
            Don't have an account? <Link to="/signup">Create doctor account</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
