import { useEffect, useRef, useState } from 'react'

export function TextEffect({ children, per = 'char', preset = 'fade', className = '', animateOnVisible = false }) {
  const text = String(children ?? '')
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(!animateOnVisible)

  useEffect(() => {
    if (!animateOnVisible || !ref.current) return

    const node = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [animateOnVisible])

  if (!text) return null

  const classes = ['text-effect', preset, className, animateOnVisible && isVisible ? 'is-visible' : '']
    .filter(Boolean)
    .join(' ')

  if (per !== 'char') {
    return <span ref={ref} className={classes.trim()}>{text}</span>
  }

  return (
    <span ref={ref} className={classes.trim()} aria-label={text}>
      {Array.from(text).map((char, index) => (
        <span key={`${char}-${index}`} style={{ transitionDelay: `${index * 0.03}s` }}>
          {char}
        </span>
      ))}
    </span>
  )
}
