import { redirect } from '@/src/i18n/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { db } from '@artmarket/db'
import { RegisterArtistForm } from './register-form'

export default async function RegisterArtistPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: '/auth/sign-in', locale })
    return null
  }

  const artist = await db.artist.findUnique({ where: { userId: user.id }, select: { id: true } })
  if (artist) {
    redirect({ href: '/artworks', locale })
    return null
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <RegisterArtistForm />
    </main>
  )
}
