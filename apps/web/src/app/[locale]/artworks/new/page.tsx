import { getTranslations } from 'next-intl/server'
import { redirect } from '@/src/i18n/navigation'
import { getSessionUser, getArtist } from '@/src/lib/data'
import { ArtworkForm } from './artwork-form'

export default async function NewArtworkPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getSessionUser()

  if (!user) {
    redirect({ href: '/auth/sign-in', locale })
    return null
  }

  const [t, artist] = await Promise.all([
    getTranslations('artwork.new'),
    getArtist(user.id),
  ])

  if (!artist) {
    redirect({ href: '/artist/register', locale })
    return null
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">{t('title')}</h1>
      <ArtworkForm userId={user.id} />
    </main>
  )
}
