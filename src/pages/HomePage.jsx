import Navbar from '../components/Navbar'
import Button from '../components/Button'
import TrustBar from '../components/TrustBar'
import Stethoscope from '../components/Stethoscope'
import ContactTeam from '../components/ContactTeam'
import { TextEffect } from '../components/core/text-effect'

export default function HomePage() {
  return (
    <main className="site-shell">
      <Navbar />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span />Clinical intelligence platform</p>
          <h1>Better clinical<br />decisions, <em>every<br className="desktop-break" /> time.</em></h1>
          <p className="hero-description">DiagNect brings a patient&apos;s complete medical history into one secure clinical workspace — giving doctors the context they need to make faster, safer decisions.</p>
          <div className="hero-actions">
            <Button to="/login" className="explore-button">Explore DiagNect <b aria-hidden="true">→</b></Button>
          </div>
          <TrustBar />
        </div>
        <div className="hero-visual">
          <Stethoscope />
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-intro">
            <p className="eyebrow"><span />About DiagNect</p>
          <h2>
            <TextEffect per="char" preset="fade" animateOnVisible>
              {'Tired of explaining your entire\nmedical history every single time?\nWe\'re here to fix that.'}
            </TextEffect>
          </h2>
        </div>

        <div className="about-grid">
          <article className="about-card">
            <h3>The problem</h3>
            <p>
              You know the drill: new doctor, new visit, and suddenly you&apos;re trying to remember medicine names,
              old allergies, past surgeries, and that one medication that made you feel awful six months ago.
              It&apos;s stressful, and when the full picture is missing, the wrong treatment can happen.
            </p>
          </article>

          <article className="about-card">
            <h3>The solution</h3>
            <p>
              We put your whole health story in one secure place. When you visit a doctor, you just share your QR
              code—boom, they see exactly what they need for that visit. Once you leave, access ends automatically,
              so your information stays private and intentional.
            </p>
          </article>

          <article className="about-card">
            <h3>Real-time updates</h3>
            <p>
              Doctors can update notes on the spot, and our built-in smart AI flags risks, allergy clashes, and
              medication issues in real time so nothing slips through the cracks. It helps catch what humans miss,
              before it turns into a problem.
            </p>
          </article>
        </div>

        <div className="about-callout">
          <p>
            Your health data belongs entirely to you. We make it easier to carry your story with you, without the
            stress, repetition, or guesswork.
          </p>
        </div>
      </section>

      <ContactTeam />

      <div className="help-button">?</div>
    </main>
  )
}
