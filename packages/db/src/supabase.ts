import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client (service role — bypasses RLS, use only on server).
// For browser/mobile clients, instantiate per-app using @supabase/ssr or the JS SDK directly.
export const supabaseAdmin = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
)
