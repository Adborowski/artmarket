import { Suspense } from 'react'
import { Link } from '@/src/i18n/navigation'
import { ListingDetail, ListingDetailSkeleton } from './listing-detail'

export default async function ListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Explore
      </Link>
      <Suspense fallback={<ListingDetailSkeleton />}>
        <ListingDetail id={id} />
      </Suspense>
    </main>
  )
}
