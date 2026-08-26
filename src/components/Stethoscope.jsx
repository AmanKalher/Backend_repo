const stethoscopeAsset = '/medsync_webp_frames/gemini-stethoscope-high-resolution.png'

export default function Stethoscope() {
  return (
    <div className="stethoscope-scene" aria-label="Floating stethoscope" role="img">
      <div className="stethoscope-frame">
        <div className="pulse-field" aria-hidden="true" />
        <img className="stethoscope-image" src={stethoscopeAsset} alt="" />
      </div>
    </div>
  )
}
