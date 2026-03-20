import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { ArtworkGrid, ArtworkGridSkeleton } from './artwork-grid'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<ArtworkGridSkeleton />}>
        <ArtworkGrid />
      </Suspense>
    </main>
  )
}
