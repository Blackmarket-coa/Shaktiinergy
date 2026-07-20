/**
 * Blackout public API client (server-side).
 *
 * Two unauthenticated endpoints on matrix.theblackout.app:
 *   1. /_matrix/client/v3/profile/{userId}   — standard Matrix profile
 *   2. /_blackout/v1/profile/{userId}        — co.bmc.profile extended data
 *      (served by the PublicProfileModule Synapse module; 404 when the
 *       profile is absent or not public)
 *
 * All calls fail soft — the site renders fully without Blackout data.
 */

import { MATRIX_SERVER, BLACKOUT_CHAT } from './config'

export interface MatrixProfile {
  displayname?: string
  avatar_url?: string // mxc:// URI
}

export interface BlackoutConnection {
  type: string
  username?: string
  url?: string
  label?: string
}

export interface BlackoutProfile {
  bio?: string
  pronouns?: string
  banner?: string // mxc:// URI
  connections?: BlackoutConnection[]
  decoration?: string
  public?: boolean
}

/** mxc://server/mediaId → downloadable https media URL, or null. */
export function mxcToUrl(mxc: string | undefined): string | null {
  if (!mxc?.startsWith('mxc://')) return null
  const [, serverName, mediaId] = mxc.match(/^mxc:\/\/([^/]+)\/(.+)$/) || []
  if (!serverName || !mediaId) return null
  return `${MATRIX_SERVER}/_matrix/media/v3/download/${serverName}/${mediaId}`
}

/** Standard Matrix profile (displayname + avatar). Null on failure. */
export async function getMatrixProfile(userId: string): Promise<MatrixProfile | null> {
  try {
    const res = await fetch(
      `${MATRIX_SERVER}/_matrix/client/v3/profile/${encodeURIComponent(userId)}`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return null
    return (await res.json()) as MatrixProfile
  } catch {
    return null
  }
}

/** Extended co.bmc.profile data. Null when missing, private, or unreachable. */
export async function getBlackoutProfile(userId: string): Promise<BlackoutProfile | null> {
  try {
    const res = await fetch(
      `${MATRIX_SERVER}/_blackout/v1/profile/${encodeURIComponent(userId)}`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return null
    return (await res.json()) as BlackoutProfile
  } catch {
    return null
  }
}

/** Direct-message deep link into the Blackout chat app. */
export function messageLink(userId: string): string {
  return `${BLACKOUT_CHAT}/#/user/${encodeURIComponent(userId)}`
}
