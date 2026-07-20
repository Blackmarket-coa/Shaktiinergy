/**
 * Supabase client scaffold.
 *
 * No feature uses Supabase yet — this wires up the client and env vars
 * so booking-inquiry / contact-form storage can land later without
 * plumbing changes. Set NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example / Vercel env vars).
 *
 * Usage (later):
 *   const supabase = getSupabase()
 *   if (supabase) await supabase.from('inquiries').insert({...})
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Lazily create the shared Supabase client.
 * Returns null when env vars are unset so the site runs without Supabase.
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  client = createClient(url, anonKey)
  return client
}
