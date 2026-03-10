import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Buat client dengan masjid_id dikirim via custom header
// Header ini dibaca Supabase Postgres via current_setting('request.headers')
// dan di-forward ke RLS policy
export function createMasjidClient(masjidId) {
  return createClient(URL, KEY, {
    global: {
      headers: { 'x-masjid-id': masjidId || '' },
    },
  })
}

// Client tanpa context — hanya untuk auth check
export const supabase = createClient(URL, KEY)
