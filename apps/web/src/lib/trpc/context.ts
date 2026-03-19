import type { TRPCContext } from '@artmarket/api'
import { createClient } from '@/src/lib/supabase/server'

export async function createTRPCContext(opts: { headers: Headers }): Promise<TRPCContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // TODO: on first sign-in, upsert a public.User row so our DB stays in sync
  // with auth.users. Implement as part of the onboarding flow in Phase 2.

  return {
    headers: opts.headers,
    userId: user?.id ?? null,
  }
}
