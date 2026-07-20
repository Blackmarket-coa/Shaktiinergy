/**
 * apps/web/src/app/pages/PublicProfile.tsx
 *
 * Renders a public creator profile at theblackout.app/@handle
 * No auth required. Fetches:
 *   1. Matrix profile via /_matrix/client/v3/profile/{userId}
 *   2. co.bmc.profile account data (public room fallback)
 *   3. FBM catalog via api.freeblackmarket.com/store/vendors/{handle}
 *      if fbm_handle is set in co.bmc.profile connections
 *
 * Route: /@:handle  (add to your React Router config)
 * e.g.   theblackout.app/@malinda  → @malinda:theblackout.app
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

// ── Config ────────────────────────────────────────────────
const MATRIX_SERVER = 'https://matrix.theblackout.app'
const FBM_API       = 'https://api.freeblackmarket.com'
const FBM_STORE     = 'https://freeblackmarket.com'
const HOMESERVER    = 'theblackout.app'

// ── Types ─────────────────────────────────────────────────
interface MatrixProfile {
  displayname?: string
  avatar_url?:  string  // mxc:// URI
}

interface BMCProfile {
  bio?:         string
  pronouns?:    string
  banner?:      string  // mxc:// URI
  connections?: Connection[]
  decoration?:  string
  public?:      boolean
}

interface Connection {
  type:     string   // 'fbm' | 'github' | 'instagram' | 'website' | 'twitter' | etc
  username?: string
  label?:   string
  url?:     string
}

interface FBMCatalog {
  vendor:  { name: string; handle: string; description?: string; photo?: string }
  catalog: { events: any[]; digital: any[]; services: any[]; physical: any[]; all: any[] }
}

// ── Matrix media URL resolver ─────────────────────────────
function mxcToUrl(mxc: string | undefined): string | null {
  if (!mxc?.startsWith('mxc://')) return null
  const [, serverName, mediaId] = mxc.match(/^mxc:\/\/([^/]+)\/(.+)$/) || []
  if (!serverName || !mediaId) return null
  return `${MATRIX_SERVER}/_matrix/media/v3/download/${serverName}/${mediaId}`
}

function price(variants: any[]): string | null {
  const amt = variants?.[0]?.prices?.[0]?.amount
  if (amt == null) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amt / 100)
}

// ── Component ─────────────────────────────────────────────
export default function PublicProfile() {
  const { handle } = useParams<{ handle: string }>()
  const userId = `@${handle}:${HOMESERVER}`

  const [matrix,  setMatrix]  = useState<MatrixProfile | null>(null)
  const [profile, setProfile] = useState<BMCProfile | null>(null)
  const [fbm,     setFbm]     = useState<FBMCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!handle) return
    setLoading(true)
    setNotFound(false)

    async function load() {
      // 1. Matrix profile (public — no auth)
      const mRes = await fetch(
        `${MATRIX_SERVER}/_matrix/client/v3/profile/${encodeURIComponent(userId)}`
      )
      if (!mRes.ok) { setNotFound(true); setLoading(false); return }
      const mData: MatrixProfile = await mRes.json()
      setMatrix(mData)

      // 2. co.bmc.profile from public profile room
      //    Synapse exposes account data for the profile room event type
      //    if the user has set their profile public.
      //    Endpoint: /_matrix/client/v3/profile/{userId}/co.bmc.profile
      //    (custom extension — see Synapse module notes below)
      try {
        const pRes = await fetch(
          `${MATRIX_SERVER}/_blackout/v1/profile/${encodeURIComponent(userId)}`
        )
        if (pRes.ok) {
          const pData: BMCProfile = await pRes.json()
          if (pData.public === false) { setNotFound(true); setLoading(false); return }
          setProfile(pData)

          // 3. FBM catalog — only if fbm connection exists
          const fbmConn = pData.connections?.find(c => c.type === 'fbm')
          if (fbmConn?.username) {
            fetch(`${FBM_API}/store/vendors/${fbmConn.username}`)
              .then(r => r.ok ? r.json() : null)
              .then(d => d && setFbm(d))
              .catch(() => null)
          }
        }
      } catch (_) { /* bmc profile optional */ }

      setLoading(false)
    }

    load()
  }, [handle, userId])

  if (loading) return <ProfileSkeleton />
  if (notFound) return <ProfileNotFound handle={handle!} />

  const displayName = matrix?.displayname || handle
  const avatarUrl   = mxcToUrl(matrix?.avatar_url)
  const bannerUrl   = mxcToUrl(profile?.banner)

  const socialLinks = (profile?.connections || []).filter(
    c => c.type !== 'fbm' && c.url
  )

  return (
    <div style={S.page}>
      {/* BANNER */}
      <div style={{
        ...S.banner,
        background: bannerUrl
          ? `url(${bannerUrl}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1a0a2e 0%, #261242 50%, #1a2e1a 100%)',
      }} />

      {/* PROFILE HEADER */}
      <div style={S.header}>
        <div style={S.avatarWrap}>
          {avatarUrl
            ? <img src={avatarUrl} alt={displayName} style={S.avatar} />
            : <div style={S.avatarFallback}>{displayName[0]?.toUpperCase()}</div>
          }
        </div>

        <div style={S.headerInfo}>
          <div style={S.displayName}>{displayName}</div>
          {profile?.pronouns && (
            <div style={S.pronouns}>{profile.pronouns}</div>
          )}
          <div style={S.handle}>@{handle}:theblackout.app</div>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div style={S.links}>
              {socialLinks.map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" style={S.link}>
                  {ICONS[c.type] || '🔗'} {c.label || c.username || c.type}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Blackout CTA */}
        <a
          href={`https://chat.theblackout.app/#/user/${encodeURIComponent(userId)}`}
          target="_blank"
          rel="noreferrer"
          style={S.connectBtn}
        >
          Message on Blackout
        </a>
      </div>

      <div style={S.body}>
        {/* BIO */}
        {profile?.bio && (
          <section style={S.section}>
            <p style={S.bio}>{profile.bio}</p>
          </section>
        )}

        {/* FBM STOREFRONT */}
        {fbm && (
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
                  {fbm.catalog.events.slice(0, 4).map((ev: any) => {
                    const m = ev.metadata || {}
                    const dt = m.event_date ? new Date(m.event_date) : null
                    const variantId = ev.variants?.[0]?.id
                    return (
                      <a
                        key={ev.id}
                        href={variantId
                          ? `${FBM_STORE}/cart?add=${variantId}&vendor=${fbm.vendor.handle}`
                          : `${FBM_STORE}/products/${ev.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        style={S.eventRow}
                      >
                        <div style={S.eventDate}>
                          <div style={S.eventDay}>{dt?.getDate() ?? '–'}</div>
                          <div style={S.eventMon}>
                            {dt?.toLocaleString('default', { month: 'short' }).toUpperCase() ?? ''}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={S.eventTitle}>{ev.title}</div>
                          <div style={S.eventMeta}>
                            {[m.venue_name, m.event_time].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div style={S.eventPrice}>{price(ev.variants)}</div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Products / Services */}
            {[...fbm.catalog.digital, ...fbm.catalog.services].length > 0 && (
              <div>
                <div style={S.subhead}>Offerings</div>
                <div style={S.productGrid}>
                  {[...fbm.catalog.digital, ...fbm.catalog.services]
                    .slice(0, 3)
                    .map((p: any) => (
                      <a
                        key={p.id}
                        href={`${FBM_STORE}/products/${p.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        style={S.productCard}
                      >
                        {p.thumbnail && (
                          <img src={p.thumbnail} alt={p.title} style={S.productThumb} />
                        )}
                        <div style={{ padding: '0.9rem' }}>
                          <div style={S.productTag}>{p.type?.value}</div>
                          <div style={S.productTitle}>{p.title}</div>
                          <div style={S.productPrice}>{price(p.variants)}</div>
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            )}

            <div style={S.fbmBadge}>
              <span>Commerce via</span>
              <a href={FBM_STORE} target="_blank" rel="noreferrer" style={{ color: '#1ABC9C', textDecoration: 'none' }}>
                FreeBlackMarket
              </a>
            </div>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <div style={S.footer}>
        <a href="https://theblackout.app" style={S.footerBrand}>Blackout</a>
        <span style={{ color: '#444' }}>·</span>
        <a href="https://freeblackmarket.com" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>
          FreeBlackMarket
        </a>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div style={S.page}>
      <div style={{ ...S.banner, background: '#1a1a2e' }} />
      <div style={S.header}>
        <div style={{ ...S.avatarFallback, background: '#2a2a3e', color: 'transparent' }}>·</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' }}>
          <div style={{ width: 180, height: 24, background: '#2a2a3e', borderRadius: 4 }} />
          <div style={{ width: 120, height: 16, background: '#222', borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )
}

function ProfileNotFound({ handle }: { handle: string }) {
  return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' as const, color: '#aaa' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>◎</div>
        <div style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>@{handle} not found</div>
        <div style={{ fontSize: '0.85rem' }}>This profile doesn't exist or isn't public.</div>
        <a href="https://theblackout.app" style={{ display: 'inline-block', marginTop: '2rem', color: '#1ABC9C', textDecoration: 'none', fontSize: '0.85rem' }}>
          Join Blackout →
        </a>
      </div>
    </div>
  )
}

// ── Icons map ─────────────────────────────────────────────
const ICONS: Record<string, string> = {
  instagram: '📸',
  twitter:   '🐦',
  github:    '🐙',
  website:   '🌐',
  youtube:   '▶️',
  tiktok:    '🎵',
  linkedin:  '💼',
  email:     '✉️',
}

// ── Styles ────────────────────────────────────────────────
const S = {
  page: {
    background: '#0d0d14',
    minHeight: '100vh',
    color: '#e8e4dc',
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  },
  banner: {
    width: '100%',
    height: 220,
    position: 'relative' as const,
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
    flexWrap: 'wrap' as const,
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    border: '3px solid #0d0d14',
    objectFit: 'cover' as const,
    display: 'block',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    border: '3px solid #0d0d14',
    background: '#1ABC9C',
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
    flexWrap: 'wrap' as const,
    marginTop: '0.75rem',
  },
  link: {
    fontSize: '0.8rem',
    color: '#aaa',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    transition: 'color 0.2s',
  },
  connectBtn: {
    background: '#1ABC9C',
    color: '#0d0d14',
    padding: '0.6rem 1.3rem',
    fontWeight: 700,
    fontSize: '0.82rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
    display: 'inline-block',
    flexShrink: 0,
    marginBottom: '0.5rem',
    transition: 'background 0.2s',
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
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  eyebrow: {
    fontSize: '0.7rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase' as const,
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
    textTransform: 'uppercase' as const,
    color: '#555',
    marginBottom: '0.75rem',
  },
  bio: {
    fontSize: '0.95rem',
    color: '#bbb',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column' as const,
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
    transition: 'background 0.15s',
  },
  eventDate: {
    textAlign: 'center' as const,
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
    textTransform: 'uppercase' as const,
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
    whiteSpace: 'nowrap' as const,
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
    transition: 'border-color 0.2s',
  },
  productThumb: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover' as const,
    display: 'block',
  },
  productTag: {
    fontSize: '0.62rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
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
