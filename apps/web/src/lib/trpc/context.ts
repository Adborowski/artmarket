import type { TRPCContext } from '@artmarket/api'
import { db } from '@artmarket/db'
import { createClient } from '@/src/lib/supabase/server'

export async function createTRPCContext(opts: { headers: Headers }): Promise<TRPCContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Ensure a User row exists for every authenticated Supabase session.
  // Uses upsert so it's safe to call on every request (no-op if already exists).
  if (user) {
    await db.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email ?? '',
        name: (user.email ?? '').split('@')[0] ?? '',
      },
      update: {},
    })
  }

  return {
    headers: opts.headers,
    userId: user?.id ?? null,
  }
}
