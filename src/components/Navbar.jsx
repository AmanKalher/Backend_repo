import { Link, useLocation } from 'react-router-dom'
import BrandLogo from './BrandLogo'

export default function Navbar() {
  const location = useLocation()
  const isSignup = location.pathname === '/signup'
  const isLogin = location.pathname === '/login'

  return (
    <header className="navbar">
      <BrandLogo />
      <nav className="nav-links" aria-label="Main navigation">
        <a href="#about">About</a>
        <a href="#contact" className="scroll-smooth">Contact</a>
        <a href="#how-it-works">How it works</a>
      </nav>
      <div className="nav-actions">
        <Link
          to="/login"
          className={`button ${isLogin ? 'button-primary nav-active-btn' : 'button-outline'} login-button`}
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className={`button button-primary signup-button ${isSignup ? 'nav-active-btn' : ''}`}
        >
          Sign up
        </Link>
      </div>
      <button className="menu-button" aria-label="Open navigation"><span /><span /><span /></button>
    </header>
  )
}
