/**
 * Central site configuration for Shakti Innergy.
 * Handles are env-configurable so staging/production can point at
 * different FBM vendors or Blackout accounts without code changes.
 */

export const SITE = {
  name: 'Shakti Innergy',
  tagline: 'The Ultimate Feminine Power Lies Within You Too',
  description:
    "I'm Malinda D. Ellis — holistic life & wellness coach, sound healer, and motivational speaker in Columbia, South Carolina.",
  url: 'https://shaktiinnergy.com',
} as const

export const CONTACT = {
  email: 'malinda_ellis@outlook.com',
  phone: '(803) 716-8396',
  phoneHref: 'tel:+18037168396',
  address: '4464 Devine Street, Columbia, SC 29205',
  instagram: 'malindashaktiinnergy',
  instagramUrl: 'https://instagram.com/malindashaktiinnergy',
} as const

// ── FreeBlackMarket ────────────────────────────────────────
export const FBM_API = 'https://api.freeblackmarket.com'
export const FBM_STORE = 'https://freeblackmarket.com'
export const FBM_HANDLE = process.env.NEXT_PUBLIC_FBM_HANDLE ?? 'shaktiinnergy'

// ── Blackout ───────────────────────────────────────────────
export const MATRIX_SERVER = 'https://matrix.theblackout.app'
export const BLACKOUT_CHAT = 'https://chat.theblackout.app'
export const BLACKOUT_HOMESERVER = 'theblackout.app'
export const BLACKOUT_HANDLE = process.env.NEXT_PUBLIC_BLACKOUT_HANDLE ?? 'malinda'
export const BLACKOUT_USER_ID = `@${BLACKOUT_HANDLE}:${BLACKOUT_HOMESERVER}`
