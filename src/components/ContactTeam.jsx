import InfiniteSlider from './core/infinite-slider'

const teamMembers = [
  { name: 'Taniya', email: 'taniya.20253299@mnnit.ac.in', phone: '9389822108', image: '/team/Taniya.jpeg' },
  { name: 'Aman', email: 'amankalher26@gmail.com', phone: '7404616794', image: '/team/Aman.jpeg' },
  { name: 'Aditya Pratap Singh', email: 'harsh8285793258@gmail.com', phone: '9214057519', image: '/team/Aditya Pratap Singh.png' },
  { name: 'Fialin Flery Mon', email: 'fialinflery@gmail.com', phone: '9789592130', image: '/team/Fialin.jpeg' },
  { name: 'Surya Sai Charan Challa', email: 'suryasaicharan999@gmail.com', phone: '6300815877', image: '/team/Surya .png' },
  { name: 'Shachi Tiwari', email: 'shachi.20250045@mnnit.ac.in', phone: '8576873978', image: '/team/Shachi Tiwari.jpeg' }
]

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h3l2 5-2 1.5a14 14 0 0 0 4.5 4.5L16 12l5 2v3c0 1.1-.9 2-2 2C10.7 19 5 13.3 5 6a2 2 0 0 1 2-2Z" /></svg>
}

function TeamCard({ member }) {
  return (
    <article className="team-card">
      <img className={member.name === 'Shachi Tiwari' ? 'team-photo-shachi' : ''} src={member.image} alt={`${member.name} portrait`} />
      <h3>{member.name}</h3>
      <a href={`mailto:${member.email}`}><MailIcon />{member.email}</a>
      <a href={`tel:${member.phone}`}><PhoneIcon />{member.phone}</a>
    </article>
  )
}

export default function ContactTeam() {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-heading">
        <p className="eyebrow"><span />Get in touch</p>
        <h2>Meet Our Team</h2>
        <p>Reach out directly to any member of our clinical intelligence and engineering team.</p>
      </div>
      <InfiniteSlider gap={24}>
        {teamMembers.map((member) => <TeamCard member={member} key={member.email} />)}
      </InfiniteSlider>
    </section>
  )
}
