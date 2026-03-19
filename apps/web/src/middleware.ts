import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { routing } from './i18n/routing'

type CookieToSet = { name: string; value: string; options?: Partial<ResponseCookie> }

const handleI18n = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Handle locale routing (detects locale, redirects / → /pl, etc.)
  let response = handleI18n(request) ?? NextResponse.next({ request })

  // 2. Refresh Supabase session on every request, preserving the i18n response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            options ? response.cookies.set(name, value, options) : response.cookies.set(name, value),
          )
        },
      },
    },
  )

  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
