const SERVICES = [
  {
    glyph: '🔥',
    title: 'Life Coaching',
    body: 'Identify and dismantle the invisible barriers created by past trauma, old programming, and self-sabotage — with tools designed to reignite your purpose and passion.',
  },
  {
    glyph: '🌿',
    title: 'Wellness Coaching',
    body: 'A holistic approach combining meditation, yoga, chakra balancing, breathwork, crystal singing bowl sound healing, and nutritional guidance to align mind, body, and spirit.',
  },
  {
    glyph: '🎤',
    title: 'Public Speaking',
    body: 'Motivational engagements for youth groups, domestic violence organizations, schools, recovery centers, wellness communities, and spiritual organizations.',
  },
]

export function Services() {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="eyebrow">Services</div>
        <h2 className="display" style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.4rem)' }}>
          Three paths back to your power.
        </h2>
        <div className="services-grid">
          {SERVICES.map((s) => (
            <div className="card service-card" key={s.title}>
              <div className="glyph" aria-hidden>
                {s.glyph}
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
