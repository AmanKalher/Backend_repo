const trustItems = [
  { label: 'Built for clinicians', icon: <><path d="M8 2v7a4 4 0 0 0 8 0V2" /><path d="M8 5H5a3 3 0 0 0 0 6h1" /><path d="M16 5h3a3 3 0 0 1 0 6h-1" /><circle cx="12" cy="17" r="3" /><path d="M12 20v2" /></> },
  { label: 'AI-assisted', icon: <><circle cx="12" cy="12" r="3" /><circle cx="5" cy="7" r="1.5" /><circle cx="19" cy="7" r="1.5" /><circle cx="5" cy="17" r="1.5" /><circle cx="19" cy="17" r="1.5" /><path d="m7 8 3 2M17 8l-3 2M7 16l3-2M17 16l-3-2" /></> },
  { label: 'Secure by design', icon: <><path d="M12 2 20 5v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5l8-3Z" /><rect x="9" y="10" width="6" height="5" rx="1" /><path d="M10 10V8a2 2 0 0 1 4 0v2" /></> }
]

export default function TrustBar() {
  return (
    <div className="trust-bar">
      {trustItems.map((item) => <span className="trust-item" key={item.label}><b className="feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg></b>{item.label}</span>)}
    </div>
  )
}
