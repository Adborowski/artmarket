import { Suspense } from 'react'
import { Link } from '@/src/i18n/navigation'
import { ArtworkDetail, ArtworkDetailSkeleton } from './artwork-detail'

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Explore
      </Link>
      <Suspense fallback={<ArtworkDetailSkeleton />}>
        <ArtworkDetail id={id} locale={locale} />
      </Suspense>
    </main>
  )
}
