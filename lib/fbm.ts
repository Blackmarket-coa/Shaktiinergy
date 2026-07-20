/**
 * FreeBlackMarket public store API client (server-side).
 *
 * GET https://api.freeblackmarket.com/store/vendors/{handle}
 * No auth required — /store/ routes are public with open CORS.
 *
 * Fetches run in server components with ISR (revalidate) so the
 * catalog stays fresh without a rebuild, and every call fails soft:
 * a network error or 404 renders the site without the storefront
 * instead of breaking the page or the build.
 */

import { FBM_API, FBM_STORE } from './config'

export interface FBMPrice {
  amount: number // cents
}

export interface FBMVariant {
  id: string
  prices?: FBMPrice[]
}

export interface FBMProduct {
  id: string
  title: string
  description?: string
  handle: string
  thumbnail?: string
  status?: string
  type?: { value?: string }
  metadata?: {
    event_date?: string
    event_time?: string
    venue_name?: string
    venue_location?: string
    recurring?: boolean
    [key: string]: unknown
  }
  variants?: FBMVariant[]
}

export interface FBMVendor {
  id: string
  name: string
  handle: string
  description?: string
  photo?: string
}

export interface FBMCatalogResponse {
  vendor: FBMVendor
  catalog: {
    events: FBMProduct[]
    digital: FBMProduct[]
    services: FBMProduct[]
    physical: FBMProduct[]
    all: FBMProduct[]
  }
}

/** Fetch a vendor's public catalog. Returns null on any failure. */
export async function getVendorCatalog(handle: string): Promise<FBMCatalogResponse | null> {
  try {
    const res = await fetch(`${FBM_API}/store/vendors/${encodeURIComponent(handle)}`, {
      // ISR: re-fetch at most every 5 minutes; serves stale while revalidating.
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as FBMCatalogResponse
  } catch {
    return null
  }
}

/** First variant's first price, formatted as USD. Amounts are in cents. */
export function formatPrice(product: FBMProduct): string | null {
  const amt = product.variants?.[0]?.prices?.[0]?.amount
  if (amt == null) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amt / 100)
}

/** Deep-link that adds the product's first variant to an FBM cart. */
export function cartLink(product: FBMProduct, vendorHandle: string): string {
  const variantId = product.variants?.[0]?.id
  return variantId
    ? `${FBM_STORE}/cart?add=${variantId}&vendor=${vendorHandle}`
    : `${FBM_STORE}/products/${product.handle}`
}

/** Product page link on the FBM storefront. */
export function productLink(product: FBMProduct): string {
  return `${FBM_STORE}/products/${product.handle}`
}

/** Vendor storefront link. */
export function vendorLink(vendorHandle: string): string {
  return `${FBM_STORE}/vendors/${vendorHandle}`
}
