import { createTRPCReact, type CreateTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@artmarket/api'
import { supabase } from './supabase'
import { env } from '@/src/env'

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>()

export function makeTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: env.EXPO_PUBLIC_API_URL,
        transformer: superjson,
        async headers() {
          const { data } = await supabase.auth.getSession()
          const token = data.session?.access_token
          return token ? { Authorization: `Bearer ${token}` } : {}
        },
      }),
    ],
  })
}
