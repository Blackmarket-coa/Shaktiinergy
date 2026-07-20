/**
 * apps/web/src/app/pages/PublicProfile.tsx
 *
 * Public-facing creator profile at theblackout.app/@handle — NO login required.
 * This component makes zero authenticated Matrix SDK calls; every request is a
 * plain fetch() against public endpoints, so it renders for anonymous visitors.
 *
 * Data sources (all public, all CORS-enabled):
 *   1. Matrix profile   GET /_matrix/client/v3/profile/{userId}   (displayname, avatar_url)
 *   2. co.bmc.profile   GET /_blackout/v1/profile/{userId}        (custom Synapse module — Deliverable 3)
 *   3. FBM catalog      GET api.freeblackmarket.com/store/vendors/{handle}  (only if an fbm connection is set)
 *
 * ── WIRING (Deliverable 4.1) ──────────────────────────────────────────────
 * Register the route in apps/web/src/app/Router.tsx BEFORE any catch-all /
 * wildcard route, otherwise the app shell will swallow /@handle first:
 *
 *   import { PublicProfile } from './pages/PublicProfile'
 *   ...
 *   // Public, unauthenticated — keep it ABOVE the authenticated <Route path="/*"> tree.
 *   <Route path="/@:handle" element={<PublicProfile />} />
 *
 * ── WIRING (Deliverable 4.4) — Nginx ──────────────────────────────────────
 * The frontend container serves a SPA, so /@handle must fall back to the app
 * shell instead of 404ing on a missing static file. Add this location block to
 * the frontend server {} in nginx.conf, above the generic `location /` block:
 *
 *   # Public profile pages — serve the React app; React Router handles /@handle.
 *   location ~ ^/@[^/]+ {
 *     try_files $uri /index.html;
 *   }
 *
 * If deploying the web app on Vercel instead of the Nginx container, there is
 * no location block — add the equivalent SPA rewrite to vercel.json so /@handle
 * (and every client route) falls back to the built index.html:
 *
 *   {
 *     "rewrites": [
 *       { "source": "/@:handle", "destination": "/index.html" },
 *       { "source": "/(.*)",     "destination": "/index.html" }
 *     ]
 *   }
 *
 * The co.bmc.profile fetch still targets matrix.theblackout.app directly, so no
 * Vercel serverless function is required for this page — it stays fully static.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'

// ── Config ────────────────────────────────────────────────
const MATRIX_SERVER = 'https://matrix.theblackout.app'
const FBM_API = 'https://api.freeblackmarket.com'
const FBM_STORE = 'https://freeblackmarket.com'
const CHAT_APP = 'https://chat.theblackout.app'
const HOMESERVER = 'theblackout.app'

// ── Types ─────────────────────────────────────────────────
interface MatrixProfile {
  displayname?: string
  avatar_url?: string // mxc:// URI
}

interface Connection {
  type: string // 'fbm' | 'github' | 'instagram' | 'website' | 'twitter' | ...
  username?: string
  label?: string
  url?: string
}

interface BMCProfile {
  bio?: string
  pronouns?: string
  banner?: string // mxc:// URI
  connections?: Connection[]
  decoration?: string
  public?: boolean
}

interface FBMProduct {
  id: string
  title: string
  description?: string
  handle: string
  thumbnail?: string
  status?: string
  type?: { value?: string }
  metadata?: Record<string, any>
  variants?: Array<{ id: string; prices?: Array<{ amount: number }> }>
}

interface FBMCatalog {
  vendor: { id: string; name: string; handle: string; description?: string; photo?: string }
  catalog: {
    events: FBMProduct[]
    digital: FBMProduct[]
    services: FBMProduct[]
    physical: FBMProduct[]
    all: FBMProduct[]
  }
}

// ── Helpers ───────────────────────────────────────────────

/** mxc://server/mediaId → downloadable https media URL, or null. */
function mxcToUrl(mxc: string | undefined): string | null {
  if (!mxc?.startsWith('mxc://')) return null
  const [, serverName, mediaId] = mxc.match(/^mxc:\/\/([^/]+)\/(.+)$/) || []
  if (!serverName || !mediaId) return null
  return `${MATRIX_SERVER}/_matrix/media/v3/download/${serverName}/${mediaId}`
}

/** First variant's first price, formatted as USD. Amounts are stored in cents. */
function price(product: FBMProduct): string | null {
  const amt = product.variants?.[0]?.prices?.[0]?.amount
  if (amt == null) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amt / 100)
}

/** Deep-link that adds the product's first variant to an FBM cart. */
function cartLink(product: FBMProduct, vendorHandle: string): string {
  const variantId = product.variants?.[0]?.id
  return variantId
    ? `${FBM_STORE}/cart?add=${variantId}&vendor=${vendorHandle}`
    : `${FBM_STORE}/products/${product.handle}`
}

// ── Component ─────────────────────────────────────────────
export function PublicProfile() {
  const { handle } = useParams<{ handle: string }>()
  const userId = `@${handle}:${HOMESERVER}`

  const [matrix, setMatrix] = useState<MatrixProfile | null>(null)
  const [profile, setProfile] = useState<BMCProfile | null>(null)
  const [fbm, setFbm] = useState<FBMCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!handle) return

    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setMatrix(null)
    setProfile(null)
    setFbm(null)

    async function load() {
      // 1. Matrix profile (public — no auth). A missing user 404s here.
      let mData: MatrixProfile = {}
      try {
        const mRes = await fetch(
          `${MATRIX_SERVER}/_matrix/client/v3/profile/${encodeURIComponent(userId)}`,
        )
        if (mRes.ok) mData = await mRes.json()
      } catch {
        /* network — fall through to the co.bmc.profile check below */
      }

      // 2. co.bmc.profile — this endpoint is the gate. It 404s when the profile
      //    is absent OR not public, so a non-OK response is a hard not-found.
      let pData: BMCProfile | null = null
      try {
        const pRes = await fetch(
          `${MATRIX_SERVER}/_blackout/v1/profile/${encodeURIComponent(userId)}`,
        )
        if (pRes.ok) pData = await pRes.json()
      } catch {
        /* treated as not-found below */
      }

      if (cancelled) return

      if (!pData || pData.public === false) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setMatrix(mData)
      setProfile(pData)

      // 3. FBM catalog — only if an fbm connection is present. Non-blocking:
      //    the profile renders immediately and the storefront fills in after.
      const fbmConn = pData.connections?.find((c) => c.type === 'fbm')
      if (fbmConn?.username) {
        try {
          const fRes = await fetch(`${FBM_API}/store/vendors/${encodeURIComponent(fbmConn.username)}`)
          if (fRes.ok && !cancelled) setFbm(await fRes.json())
        } catch {
          /* storefront is optional */
        }
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [handle, userId])

  if (loading) return <ProfileSkeleton />
  if (notFound || !profile) return <ProfileNotFound handle={handle ?? ''} />

  const displayName = matrix?.displayname || handle || 'Creator'
  const avatarUrl = mxcToUrl(matrix?.avatar_url)
  const bannerUrl = mxcToUrl(profile.banner)

  // Social links exclude the fbm connection (rendered as a storefront instead).
  const socialLinks = (profile.connections || []).filter((c) => c.type !== 'fbm' && c.url)

  // Everything that isn't an event goes in the offerings grid.
  const offerings = fbm
    ? [...fbm.catalog.digital, ...fbm.catalog.services, ...fbm.catalog.physical]
    : []

  return (
    <div style={S.page}>
      {/* BANNER */}
      <div
        style={{
          ...S.banner,
          background: bannerUrl
            ? `url(${bannerUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1a0a2e 0%, #261242 50%, #1a2e1a 100%)',
        }}
      />

      {/* PROFILE HEADER */}
      <div style={S.header}>
        <div style={S.avatarWrap}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} style={S.avatar} />
          ) : (
            <div style={S.avatarFallback}>{displayName[0]?.toUpperCase()}</div>
          )}
        </div>

        <div style={S.headerInfo}>
          <div style={S.displayName}>{displayName}</div>
          {profile.pronouns && <div style={S.pronouns}>{profile.pronouns}</div>}
          <div style={S.handle}>
            @{handle}:{HOMESERVER}
          </div>

          {socialLinks.length > 0 && (
            <div style={S.links}>
              {socialLinks.map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" style={S.link}>
                  <span aria-hidden>{ICONS[c.type] || '🔗'}</span> {c.label || c.username || c.type}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Blackout CTA */}
        <a
          href={`${CHAT_APP}/#/user/${encodeURIComponent(userId)}`}
          target="_blank"
          rel="noreferrer"
          style={S.connectBtn}
        >
          Message on Blackout
        </a>
      </div>

      <div style={S.body}>
        {/* BIO */}
        {profile.bio && (
          <section style={S.section}>
            <p style={S.bio}>{profile.bio}</p>
          </section>
        )}

        {/* FBM STOREFRONT */}
        {fbm && (fbm.catalog.events.length > 0 || offerings.length > 0) && (
          <section style={S.section}>
            <div style={S.sectionHeader}>
              <span style={S.eyebrow}>Marketplace</span>
              <a
                href={`${FBM_STORE}/vendors/${fbm.vendor.handle}`}
                target="_blank"
                rel="noreferrer"
                style={S.seeAll}
              >
                View full store on FreeBlackMarket →
              </a>
            </div>

            {/* Events */}
            {fbm.catalog.events.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={S.subhead}>Upcoming Events</div>
                <div style={S.eventList}>
                  {fbm.catalog.events.slice(0, 4).map((ev) => {
                    const m = ev.metadata || {}
                    const dt = m.event_date ? new Date(m.event_date) : null
                    return (
                      <a
                        key={ev.id}
                        href={cartLink(ev, fbm.vendor.handle)}
                        target="_blank"
                        rel="noreferrer"
                        style={S.eventRow}
                      >
                        <div style={S.eventDate}>
                          <div style={S.eventDay}>{dt ? dt.getDate() : '–'}</div>
                          <div style={S.eventMon}>
                            {dt ? dt.toLocaleString('default', { month: 'short' }).toUpperCase() : ''}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={S.eventTitle}>{ev.title}</div>
                          <div style={S.eventMeta}>
                            {[m.venue_name, m.event_time].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div style={S.eventPrice}>{price(ev)}</div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Products / Services */}
            {offerings.length > 0 && (
              <div>
                <div style={S.subhead}>Offerings</div>
                <div style={S.productGrid}>
                  {offerings.slice(0, 6).map((p) => (
                    <a
                      key={p.id}
                      href={`${FBM_STORE}/products/${p.handle}`}
                      target="_blank"
                      rel="noreferrer"
                      style={S.productCard}
                    >
                      {p.thumbnail && <img src={p.thumbnail} alt={p.title} style={S.productThumb} />}
                      <div style={{ padding: '0.9rem' }}>
                        {p.type?.value && <div style={S.productTag}>{p.type.value}</div>}
                        <div style={S.productTitle}>{p.title}</div>
                        <div style={S.productPrice}>{price(p)}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Powered-by badge */}
            <div style={S.fbmBadge}>
              <span>Powered by</span>
              <a
                href={FBM_STORE}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#1ABC9C', textDecoration: 'none' }}
              >
                FreeBlackMarket
              </a>
            </div>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <div style={S.footer}>
        <a href="https://theblackout.app" style={S.footerBrand}>
          Blackout
        </a>
        <span style={{ color: '#444' }}>·</span>
        <a
          href="https://freeblackmarket.com"
          style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}
        >
          FreeBlackMarket
        </a>
      </div>
    </div>
  )
}

export default PublicProfile

// ── Sub-components ────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div style={S.page}>
      <div style={{ ...S.banner, background: '#1a1a2e' }} />
      <div style={S.header}>
        <div style={{ ...S.avatarFallback, background: '#2a2a3e', color: 'transparent' }}>·</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: 180, height: 24, background: '#2a2a3e', borderRadius: 4 }} />
          <div style={{ width: 120, height: 16, background: '#222', borderRadius: 4 }} />
        </div>
      </div>
      <div style={S.body}>
        <div style={{ ...S.section, borderTop: 'none' }}>
          <div style={{ width: '100%', height: 14, background: '#1a1a2e', borderRadius: 4, marginBottom: 10 }} />
          <div style={{ width: '80%', height: 14, background: '#1a1a2e', borderRadius: 4, marginBottom: 10 }} />
          <div style={{ width: '60%', height: 14, background: '#1a1a2e', borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )
}

function ProfileNotFound({ handle }: { handle: string }) {
  return (
    <div
      style={{
        ...S.page,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <div style={{ textAlign: 'center', color: '#aaa' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>◎</div>
        <div style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>
          @{handle} not found
        </div>
        <div style={{ fontSize: '0.85rem' }}>This profile doesn&apos;t exist or isn&apos;t public.</div>
        <a
          href="https://theblackout.app"
          style={{
            display: 'inline-block',
            marginTop: '2rem',
            color: '#1ABC9C',
            textDecoration: 'none',
            fontSize: '0.85rem',
          }}
        >
          Join Blackout →
        </a>
      </div>
    </div>
  )
}

// ── Icon map (emoji — no icon dependency) ─────────────────
const ICONS: Record<string, string> = {
  instagram: '📸',
  twitter: '🐦',
  github: '🐙',
  website: '🌐',
  youtube: '▶️',
  tiktok: '🎵',
  linkedin: '💼',
  email: '✉️',
}

// ── Styles (inline only — no external CSS) ────────────────
const S: Record<string, CSSProperties> = {
  page: {
    background: '#0d0d14',
    minHeight: '100vh',
    color: '#e8e4dc',
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  },
  banner: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  header: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '0 1.5rem',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '1.5rem',
    marginTop: -48,
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    border: '3px solid #1ABC9C',
    objectFit: 'cover',
    display: 'block',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    border: '3px solid #1ABC9C',
    background: '#16813D',
    color: '#0d0d14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
    paddingBottom: '0.5rem',
  },
  displayName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
  },
  pronouns: {
    fontSize: '0.82rem',
    color: '#1ABC9C',
    marginTop: '0.2rem',
  },
  handle: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '0.2rem',
    fontFamily: 'monospace',
  },
  links: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginTop: '0.75rem',
  },
  link: {
    fontSize: '0.8rem',
    color: '#aaa',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  connectBtn: {
    background: '#1ABC9C',
    color: '#0d0d14',
    padding: '0.6rem 1.3rem',
    fontWeight: 700,
    fontSize: '0.82rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    display: 'inline-block',
    flexShrink: 0,
    marginBottom: '0.5rem',
  },
  body: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '0 1.5rem 4rem',
  },
  section: {
    borderTop: '1px solid #1e1e2e',
    paddingTop: '2rem',
    marginBottom: '2rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  eyebrow: {
    fontSize: '0.7rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: '#1ABC9C',
  },
  seeAll: {
    fontSize: '0.78rem',
    color: '#666',
    textDecoration: 'none',
  },
  subhead: {
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#555',
    marginBottom: '0.75rem',
  },
  bio: {
    fontSize: '0.95rem',
    color: '#bbb',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    background: '#1e1e2e',
  },
  eventRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
    padding: '1rem 1.2rem',
    background: '#12121e',
    textDecoration: 'none',
  },
  eventDate: {
    textAlign: 'center',
    minWidth: 44,
  },
  eventDay: {
    fontSize: '1.6rem',
    fontWeight: 300,
    color: '#1ABC9C',
    lineHeight: 1,
  },
  eventMon: {
    fontSize: '0.62rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#555',
  },
  eventTitle: {
    fontSize: '0.92rem',
    color: '#e8e4dc',
    marginBottom: '0.2rem',
    fontWeight: 500,
  },
  eventMeta: {
    fontSize: '0.76rem',
    color: '#555',
  },
  eventPrice: {
    fontSize: '1.1rem',
    fontWeight: 300,
    color: '#1ABC9C',
    whiteSpace: 'nowrap',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
  },
  productCard: {
    background: '#12121e',
    border: '1px solid #1e1e2e',
    textDecoration: 'none',
    display: 'block',
  },
  productThumb: {
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    display: 'block',
  },
  productTag: {
    fontSize: '0.62rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#1ABC9C',
    marginBottom: '0.35rem',
  },
  productTitle: {
    fontSize: '0.9rem',
    color: '#e8e4dc',
    fontWeight: 500,
    marginBottom: '0.35rem',
  },
  productPrice: {
    fontSize: '1.1rem',
    color: '#1ABC9C',
    fontWeight: 300,
  },
  fbmBadge: {
    marginTop: '1.5rem',
    fontSize: '0.72rem',
    color: '#444',
    display: 'flex',
    gap: '0.4rem',
    alignItems: 'center',
  },
  footer: {
    borderTop: '1px solid #1e1e2e',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    fontSize: '0.8rem',
  },
  footerBrand: {
    color: '#1ABC9C',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '0.85rem',
  },
}
