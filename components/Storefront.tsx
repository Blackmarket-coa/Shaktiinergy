/**
 * Events + Offerings sections, rendered from the FreeBlackMarket vendor
 * catalog. Server component — data arrives via props from the page's
 * server-side fetch. Renders nothing when the catalog is unavailable
 * (site works fully without FBM).
 */

import {
  type FBMCatalogResponse,
  type FBMProduct,
  formatPrice,
  cartLink,
  productLink,
  vendorLink,
} from '@/lib/fbm'
import { FBM_STORE } from '@/lib/config'

function EventRow({ ev, vendorHandle }: { ev: FBMProduct; vendorHandle: string }) {
  const m = ev.metadata ?? {}
  const dt = m.event_date ? new Date(m.event_date) : null
  return (
    <a className="event-row" href={cartLink(ev, vendorHandle)} target="_blank" rel="noreferrer">
      <div className="event-date">
        <div className="day">{dt ? dt.getDate() : '–'}</div>
        <div className="mon">
          {dt ? dt.toLocaleString('en-US', { month: 'short' }).toUpperCase() : ''}
        </div>
      </div>
      <div className="event-info">
        <div className="title">{ev.title}</div>
        <div className="meta">{[m.venue_name, m.event_time].filter(Boolean).join(' · ')}</div>
      </div>
      <div className="event-price">{formatPrice(ev)}</div>
    </a>
  )
}

function ProductCard({ p }: { p: FBMProduct }) {
  return (
    <a className="card product-card" href={productLink(p)} target="_blank" rel="noreferrer">
      {/* Plain <img>: FBM thumbnails are remote and already sized for cards */}
      {p.thumbnail && <img src={p.thumbnail} alt={p.title} />}
      <div className="pad">
        {p.type?.value && <div className="tag">{p.type.value}</div>}
        <div className="title">{p.title}</div>
        <div className="price">{formatPrice(p)}</div>
      </div>
    </a>
  )
}

function PoweredBy() {
  return (
    <div className="powered-by">
      <span>Powered by</span>
      <a href={FBM_STORE} target="_blank" rel="noreferrer">
        FreeBlackMarket
      </a>
    </div>
  )
}

export function Storefront({ data }: { data: FBMCatalogResponse | null }) {
  if (!data) return null

  const { vendor, catalog } = data
  const offerings = [...catalog.digital, ...catalog.services, ...catalog.physical]
  if (catalog.events.length === 0 && offerings.length === 0) return null

  return (
    <>
      {catalog.events.length > 0 && (
        <section className="section" id="events">
          <div className="container">
            <div className="eyebrow">Upcoming Events</div>
            <h2 className="display" style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.4rem)' }}>
              Gather. Breathe. Heal.
            </h2>
            <div className="event-list">
              {catalog.events.map((ev) => (
                <EventRow key={ev.id} ev={ev} vendorHandle={vendor.handle} />
              ))}
            </div>
            <PoweredBy />
          </div>
        </section>
      )}

      {offerings.length > 0 && (
        <section className="section" id="offerings">
          <div className="container">
            <div className="eyebrow">Offerings</div>
            <h2 className="display" style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.4rem)' }}>
              Tools for the journey.
            </h2>
            <div className="product-grid">
              {offerings.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
            <div className="powered-by">
              <span>Full store at</span>
              <a href={vendorLink(vendor.handle)} target="_blank" rel="noreferrer">
                freeblackmarket.com/vendors/{vendor.handle}
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
