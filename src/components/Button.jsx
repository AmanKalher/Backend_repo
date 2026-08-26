import { Link } from 'react-router-dom'

export default function Button({ children, to, variant = 'primary', className = '' }) {
  const classes = `button button-${variant} ${className}`
  return to ? <Link className={classes} to={to}>{children}</Link> : <button className={classes}>{children}</button>
}
