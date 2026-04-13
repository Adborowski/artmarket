import { Suspense } from 'react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { ArtistsList, ArtistsListSkeleton } from './artists-list'

export default async function ArtistsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('artists')

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">{t('title')}</h1>
      <Suspense fallback={<ArtistsListSkeleton />}>
        <ArtistsList />
      </Suspense>
    </main>
  )
}
