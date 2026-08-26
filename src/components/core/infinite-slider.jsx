export default function InfiniteSlider({ children, gap = 24, duration = 42, reverse = false }) {
  return (
    <div className="infinite-slider" style={{ '--slider-gap': `${gap}px`, '--slider-duration': `${duration}s` }} aria-label="Infinite slider">
      <div className={`infinite-slider-track${reverse ? ' is-reverse' : ''}`}>
        <div className="infinite-slider-group">{children}</div>
        <div className="infinite-slider-group" aria-hidden="true">{children}</div>
      </div>
    </div>
  )
}
