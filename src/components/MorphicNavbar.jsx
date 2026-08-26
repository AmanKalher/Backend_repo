import { useEffect, useRef, useState } from 'react'

export default function MorphicNavbar({
  items = {},
  defaultPath = '/overview',
  activePath,
  onChange,
  className = '',
}) {
  const itemEntries = Object.entries(items)
  const [currentPath, setCurrentPath] = useState(activePath || defaultPath)
  const navRef = useRef(null)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })

  // Synchronize controlled activePath if provided
  useEffect(() => {
    if (activePath && activePath !== currentPath) {
      setCurrentPath(activePath)
    }
  }, [activePath])

  // Animate morphic indicator pill
  useEffect(() => {
    if (!navRef.current) return

    const activeEl = navRef.current.querySelector(`[data-path="${currentPath}"]`)
    if (activeEl) {
      const navRect = navRef.current.getBoundingClientRect()
      const elRect = activeEl.getBoundingClientRect()

      setPillStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      })

      // Smooth horizontal scroll into view if item is partially hidden on small screens
      if (
        activeEl.offsetLeft < navRef.current.scrollLeft ||
        activeEl.offsetLeft + activeEl.offsetWidth >
          navRef.current.scrollLeft + navRef.current.clientWidth
      ) {
        navRef.current.scrollTo({
          left: activeEl.offsetLeft - 32,
          behavior: 'smooth',
        })
      }
    }
  }, [currentPath, items])

  const handleSelect = (path) => {
    setCurrentPath(path)
    if (onChange) {
      onChange(path)
    }
  }

  return (
    <div className={`morphic-navbar-shell ${className}`}>
      <nav ref={navRef} className="morphic-navbar-container" role="tablist">
        {/* Morphic Glass Floating Indicator */}
        <div
          className="morphic-active-pill"
          style={{
            transform: `translateX(${pillStyle.left}px)`,
            width: `${pillStyle.width}px`,
            opacity: pillStyle.opacity,
          }}
          aria-hidden="true"
        />

        {itemEntries.map(([pathKey, itemData]) => {
          const isActive = currentPath === pathKey
          const label = itemData.name || pathKey.replace('/', '')

          return (
            <button
              key={pathKey}
              type="button"
              role="tab"
              data-path={pathKey}
              aria-selected={isActive}
              className={`morphic-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(pathKey)}
            >
              <span className="morphic-tab-text">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
