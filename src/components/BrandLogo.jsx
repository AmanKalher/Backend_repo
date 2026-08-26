import { Link } from 'react-router-dom'

export default function BrandLogo({ to = '/', className = '' }) {
  const content = (
    <span className={`brand ${className}`}>
      <img className="brand-symbol" src="/diagnect-symbol.png" alt="" />
      <img className="brand-logo" src="/diagnect-logo.png" alt="DiagNect" />
    </span>
  )

  return to ? (
    <Link to={to} className="brand-link" aria-label="DiagNect home">
      {content}
    </Link>
  ) : (
    content
  )
}
