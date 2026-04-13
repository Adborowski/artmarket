import { Suspense } from 'react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AuctionsSection, AuctionsSectionSkeleton } from './auctions-section'
import { ArtworkGrid, ArtworkGridSkeleton } from './artwork-grid'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('home')

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<AuctionsSectionSkeleton />}>
        <AuctionsSection />
      </Suspense>
      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('explore')}</h2>
        <Suspense fallback={<ArtworkGridSkeleton />}>
          <ArtworkGrid />
        </Suspense>
      </section>
    </main>
  )
}
