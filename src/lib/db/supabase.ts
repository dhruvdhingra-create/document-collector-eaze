/**
 * Optional Supabase client — only needed for Supabase-specific features
 * (realtime subscriptions, Supabase Auth, Storage, Row Level Security).
 *
 * For plain database queries, use getDb() from '@/lib/db' instead.
 */

import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (_client) return _client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY

  if (!url || !key) return null

  _client = createClient(url, key)
  return _client
}
