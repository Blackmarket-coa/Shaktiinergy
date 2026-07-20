/**
 * Events + Offerings sections, rendered from the FreeBlackMarket vendor
 * catalog (FBM Connect / Store API v2 shape). Server component — data
 * arrives via props from the page's server-side fetch. Renders nothing
 * when the catalog is unavailable (site works fully without FBM).
 *
 * Events section = interactive month calendar (client, visitor-local
 * times) + server-rendered upcoming list (crawlable fallback).
 */

import {
  type FBMCatalogResponse,
  type FBMEvent,
  type FBMProduct,
  formatPrice,
  upcomingDates,
} from '@/lib/fbm'
import { FBM_STORE } from '@/lib/config'
import { EventsCalendar } from '@/components/EventsCalendar'

function EventRow({ ev }: { ev: FBMEvent }) {
  // Next upcoming occurrence; falls back to the first listed date.
  // "now" freezes per ISR render, refreshed every revalidate cycle.
  const dt =
    upcomingDates(ev, new Date())[0] ??
    (ev.dates?.length && !Number.isNaN(new Date(ev.dates[0]).getTime())
      ? new Date(ev.dates[0])
      : null)
  return (
    <a className="event-row" href={ev.url ?? undefined} target="_blank" rel="noreferrer">
      <div className="event-date">
        <div className="day">{dt ? dt.getUTCDate() : '–'}</div>
        <div className="mon">
          {dt ? dt.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase() : ''}
        </div>
      </div>
      <div className="event-info">
        <div className="title">{ev.title}</div>
        <div className="meta">
          {[ev.venue?.name, ev.dates.length > 1 ? `${ev.dates.length} dates` : null]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
      <div className="event-price">{formatPrice(ev.price)}</div>
    </a>
  )
}

function ProductCard({ p }: { p: FBMProduct }) {
  return (
    <a className="card product-card" href={p.url ?? undefined} target="_blank" rel="noreferrer">
      {/* Plain <img>: FBM thumbnails are remote and already sized for cards */}
      {p.thumbnail && <img src={p.thumbnail} alt={p.title} />}
      <div className="pad">
        {p.type && <div className="tag">{p.type}</div>}
        <div className="title">{p.title}</div>
        <div className="price">{formatPrice(p.price)}</div>
      </div>
    </a>
  )
}

export function Storefront({ data }: { data: FBMCatalogResponse | null }) {
  if (!data) return null

  const { vendor, capabilities } = data
  const events = capabilities?.events_enabled === false ? [] : (data.events ?? [])
  const groups = data.product_groups
  const offerings = groups
    ? [...groups.digital, ...groups.services, ...groups.physical]
    : (data.products ?? []).filter((p) => p.type !== 'event')
  if (events.length === 0 && offerings.length === 0) return null

  const storefrontUrl = data._meta?.storefront_url ?? FBM_STORE
  const vendorUrl = vendor.url ?? `${storefrontUrl}/us/sellers/${vendor.handle}`

  return (
    <>
      {events.length > 0 && (
        <section className="section" id="events">
          <div className="container">
            <div className="eyebrow">Upcoming Events</div>
            <h2 className="display" style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.4rem)' }}>
              Gather. Breathe. Heal.
            </h2>

            <EventsCalendar events={events} />

            <div className="event-list">
              {events.map((ev) => (
                <EventRow key={ev.id} ev={ev} />
              ))}
            </div>
            <div className="powered-by">
              <span>Powered by</span>
              <a href={storefrontUrl} target="_blank" rel="noreferrer">
                FreeBlackMarket
              </a>
            </div>
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
              <a href={vendorUrl} target="_blank" rel="noreferrer">
                {vendor.name} on FreeBlackMarket
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
