/**
 * FreeBlackMarket public store API client (server-side).
 *
 * Contract: FBM Connect / Store API v2 (docs/integrations/fbm-connect.md
 * in blackmarket-coa/free-black-market).
 *
 * GET https://api.freeblackmarket.com/store/vendors/{handle}
 * Public, unauthenticated, open CORS. Money amounts are MAJOR units
 * (Medusa v2 convention): amount 24 = $24.00.
 *
 * Fetches run in server components with ISR (revalidate) so the catalog
 * stays fresh without a rebuild, and every call fails soft: a network
 * error or 404 renders the site without the storefront instead of
 * breaking the page or the build.
 */

import { FBM_API } from './config'

export interface FBMPrice {
  amount: number // major units: 24 = $24.00
  currency_code: string
}

export interface FBMVariant {
  id: string
  title?: string
  price?: FBMPrice
}

export interface FBMProduct {
  id: string
  title: string
  handle: string
  subtitle?: string | null
  description?: string
  thumbnail?: string | null
  price?: FBMPrice | null
  variants?: FBMVariant[]
  url?: string | null
  type?: 'physical' | 'digital' | 'service' | 'event' | string
}

export interface FBMEvent {
  id: string
  title: string
  handle: string | null
  thumbnail?: string | null
  dates: string[] // ISO UTC instants; may hold several dates for recurring events
  venue?: { name: string; address?: string | null } | null
  price?: FBMPrice | null
  url?: string | null
}

export interface FBMVendor {
  id: string
  handle: string
  name: string
  description?: string
  photo?: string
  vendor_type?: string
  verified?: boolean
  rating?: number | null
  review_count?: number
  website_url?: string | null
  url?: string
}

export interface FBMCapabilities {
  vendor_enabled?: boolean
  products_enabled?: boolean
  digital_enabled?: boolean
  services_enabled?: boolean
  events_enabled?: boolean
  reviews_enabled?: boolean
  chat_enabled?: boolean
  booking_enabled?: boolean
}

export interface FBMCatalogResponse {
  vendor: FBMVendor
  products?: FBMProduct[]
  product_groups?: {
    physical: FBMProduct[]
    digital: FBMProduct[]
    services: FBMProduct[]
    events: FBMProduct[]
  }
  events?: FBMEvent[]
  capabilities?: FBMCapabilities
  reviews_summary?: { average: number | null; count: number }
  _meta?: {
    handle: string
    currency_code: string
    storefront_url: string
    checkout_url: string
  }
}

/** Fetch a vendor's public catalog. Returns null on any failure. */
export async function getVendorCatalog(handle: string): Promise<FBMCatalogResponse | null> {
  try {
    const res = await fetch(`${FBM_API}/store/vendors/${encodeURIComponent(handle)}`, {
      // ISR: re-fetch at most every 5 minutes; the API itself sends
      // Cache-Control public,max-age=60,s-maxage=300.
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as FBMCatalogResponse
  } catch {
    return null
  }
}

/** Format an FBM price (major units) as currency, e.g. "$24". */
export function formatPrice(price: FBMPrice | null | undefined): string | null {
  if (price?.amount == null) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (price.currency_code || 'usd').toUpperCase(),
    minimumFractionDigits: price.amount % 1 === 0 ? 0 : 2,
  }).format(price.amount)
}

/** Upcoming occurrences of an event, soonest first (past dates dropped). */
export function upcomingDates(ev: FBMEvent, now: Date): Date[] {
  return (ev.dates ?? [])
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())
}
