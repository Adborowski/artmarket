'use server'

import { createClient } from '@/src/lib/supabase/server'
import { redirect } from '@/src/i18n/navigation'

export async function signIn(locale: string, email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect({ href: '/', locale })
}

export async function signUp(locale: string, email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  redirect({ href: '/', locale })
}

export async function signOut(locale: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect({ href: '/', locale })
}
