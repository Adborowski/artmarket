import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { env } from '@/src/env'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Partial<ResponseCookie> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            options ? cookieStore.set(name, value, options) : cookieStore.set(name, value),
          )
        } catch {
          // Called from a Server Component — session refresh is handled by middleware
        }
      },
    },
  })
}
