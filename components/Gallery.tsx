/**
 * Static photo band — imagery that isn't tied to a service or to the
 * FBM-driven events list. Purely presentational; always renders, so the
 * page keeps some visual weight even when the catalog is unreachable.
 */

import Image from 'next/image'
import bowlSetup from '@/public/images/gallery/sound-bowl-setup.jpg'
import pdapSession from '@/public/images/events/pinellas-diaspora-arts-project.jpg'

const SHOTS = [
  {
    src: bowlSetup,
    alt: 'Crystal singing bowls, a prayer rug, and a chakra chart laid out on the floor before a session',
    caption: 'Bowls, mat, and chakra chart, set before the room fills.',
  },
  {
    src: pdapSession,
    alt: 'Sound bath setup in front of a Pinellas Diaspora Arts Project projection',
    caption: 'A sound bath held with the Pinellas Diaspora Arts Project.',
  },
]

export function Gallery() {
  return (
    <section className="section" id="gallery" aria-label="Photographs from recent sessions">
      <div className="container">
        <div className="eyebrow">From the Practice</div>
        <div className="gallery-grid">
          {SHOTS.map((shot) => (
            <figure className="gallery-figure" key={shot.caption}>
              <Image
                src={shot.src}
                alt={shot.alt}
                sizes="(max-width: 720px) 92vw, 46vw"
                placeholder="blur"
              />
              <figcaption>{shot.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
