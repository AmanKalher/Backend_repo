import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tabContentVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.99,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 30 : -30,
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.99,
  }),
}

export default function SmoothTab({
  tabs = [],
  activeTabId,
  onChange,
  className = '',
}) {
  const [selectedId, setSelectedId] = useState(activeTabId || (tabs[0] && tabs[0].id))
  const [direction, setDirection] = useState(0)

  const currentTabId = activeTabId !== undefined ? activeTabId : selectedId
  const currentIndex = tabs.findIndex((t) => t.id === currentTabId)

  const handleTabClick = (newId) => {
    const newIndex = tabs.findIndex((t) => t.id === newId)
    setDirection(newIndex > currentIndex ? 1 : -1)
    setSelectedId(newId)
    if (onChange) {
      onChange(newId)
    }
  }

  const activeTab = tabs.find((t) => t.id === currentTabId) || tabs[0]

  return (
    <div className={`smooth-tab-wrapper ${className}`}>
      {/* Top Floating Morphic Pill Menu */}
      <div className="smooth-tab-nav-container" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === currentTabId
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`smooth-tab-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {isActive && (
                <motion.div
                  layoutId="smooth-active-tab-indicator"
                  className="smooth-tab-active-indicator"
                  transition={{
                    type: 'spring',
                    stiffness: 480,
                    damping: 34,
                  }}
                  aria-hidden="true"
                />
              )}
              <span className="smooth-tab-pill-text">
                {tab.icon && <span className="tab-pill-icon">{tab.icon}</span>}
                {tab.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* Animated Tab Content Container */}
      <div className="smooth-tab-content-area">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentTabId}
            custom={direction}
            variants={tabContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 350, damping: 32 },
              opacity: { duration: 0.22 },
              filter: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            className="smooth-tab-pane"
            role="tabpanel"
          >
            {activeTab && activeTab.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
