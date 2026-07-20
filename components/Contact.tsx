import { CONTACT } from '@/lib/config'

export function Contact() {
  return (
    <section className="section" id="contact">
      <div className="container">
        <div className="eyebrow">Contact</div>
        <h2 className="display" style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.4rem)' }}>
          Begin the conversation.
        </h2>
        <div className="contact-grid">
          <div className="card contact-card">
            <div className="label">Email</div>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </div>
          <div className="card contact-card">
            <div className="label">Phone</div>
            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          </div>
          <div className="card contact-card">
            <div className="label">Studio</div>
            <div className="value">{CONTACT.address}</div>
          </div>
          <div className="card contact-card">
            <div className="label">Instagram</div>
            <a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer">
              @{CONTACT.instagram}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
