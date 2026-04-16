'use server'

import { createClient } from '@/src/lib/supabase/server'
import { redirect } from '@/src/i18n/navigation'
import { db } from '@artmarket/db'

export async function signIn(locale: string, email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect({ href: '/', locale })
}

export async function signUp(locale: string, email: string, password: string, name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  if (data.user) {
    await db.user.upsert({
      where: { id: data.user.id },
      create: { id: data.user.id, email, name },
      update: { name },
    })
  }
  redirect({ href: '/', locale })
}

export async function signOut(locale: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect({ href: '/', locale })
}
