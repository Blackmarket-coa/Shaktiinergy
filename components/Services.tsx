const SERVICES = [
  {
    glyph: '🔥',
    title: 'Life Coaching',
    paragraphs: [
      'In the journey of life, we often encounter invisible barriers that hinder us from realizing our full power and potential. These barriers may manifest as past traumas, ingrained old programming, or the subtle self-sabotage that keeps us from walking confidently in the direction of our dreams.',
      "Together, we'll explore and dismantle these life blocks. Life doesn't have to be a perpetual hamster wheel, where days blend into one another without purpose or direction. I specialize in guiding individuals through the process of self-discovery, helping you identify and overcome obstacles that may be draining your energy and stifling your hope.",
      'I offer more than just guidance — I provide you with simple yet powerful tools and techniques designed to unearth your purpose and reignite the passion within you for life.',
    ],
  },
  {
    glyph: '🌿',
    title: 'Wellness Coaching',
    paragraphs: [
      'In my holistic wellness coaching practice, I guide individuals on a transformative journey toward achieving balance and harmony in their lives. My approach goes beyond conventional methods, as I embrace a comprehensive understanding of health that encompasses not only the physical but also the mental and spiritual facets of our being.',
      "I provide a unique blend of education focused on nutritional health and stress management techniques. Nutrition is not just about what we eat; it's about nourishing the body at its core. Stress management extends beyond momentary relief; it's about creating lasting serenity within.",
      "Through meditation, yoga, chakra balancing, breathwork, and the healing vibrations of sound bowls, we embark on a journey that nurtures every aspect of our being. Together, we'll work towards a state of equilibrium where your mind is clear, your body is vibrant, and your spirit is at peace.",
      "Wellness is not a destination; it's a way of life.",
    ],
  },
  {
    glyph: '🎤',
    title: 'Public Speaking',
    paragraphs: [
      'As a passionate public speaker, my mission is clear: to illuminate the path towards self-empowerment and wellness within the Black and brown communities. I specialize in delivering motivational messages that resonate deeply with diverse audiences, including youth groups, domestic violence organizations, schools, drug and alcohol recovery centers, and wellness and spiritual communities.',
      'Through my engagements, I am dedicated to sparking transformative conversations about nutritional health and stress management. These are the tools I wield in my mission to rewrite the narrative of health and well-being in our communities. By introducing and reinforcing these vital tools, I aim to empower individuals to take charge of their well-being, instilling a sense of self-empowerment and fostering a culture of wellness.',
      "Together, let's rewrite the narrative. Let's break the chains of poor health choices and unrelenting stress. My speaking engagements serve as beacons of inspiration, guiding communities toward a future where individuals not only survive but thrive.",
      "Dare to dream, dare to change. Your journey requires courage, and you've got it in abundance.",
    ],
  },
]

export function Services() {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="eyebrow">Services</div>
        <h2 className="display" style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.4rem)' }}>
          Three ways I can walk with you.
        </h2>
        <div className="service-blocks">
          {SERVICES.map((s) => (
            <div className="service-block" key={s.title}>
              <div className="service-head">
                <div className="glyph" aria-hidden>
                  {s.glyph}
                </div>
                <h3>{s.title}</h3>
              </div>
              <div className="service-copy">
                {s.paragraphs.map((p, i) => (
                  <p key={i} className={i === s.paragraphs.length - 1 ? 'closing' : undefined}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
