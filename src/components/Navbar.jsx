import { Link } from 'react-router-dom'
import Button from './Button'

export default function Navbar() {
  return (
    <header className="navbar">
      <Link className="brand" to="/" aria-label="DiagNect home">
        <img className="brand-symbol" src="/diagnect-symbol.png" alt="" />
        <img className="brand-logo" src="/diagnect-logo.png" alt="DiagNect" />
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        <a href="#about">About</a>
        <a href="#contact" className="scroll-smooth">Contact</a>
        <a href="#how-it-works">How it works</a>
      </nav>
      <Button to="/login" variant="outline" className="login-button">Log in <b>→</b></Button>
      <button className="menu-button" aria-label="Open navigation"><span /><span /><span /></button>
    </header>
  )
}
