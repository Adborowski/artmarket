import { Suspense } from 'react'
import { Link } from '@/src/i18n/navigation'
import { ArtistProfile, ArtistProfileSkeleton } from './artist-profile'

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/artists" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Artists
      </Link>
      <Suspense fallback={<ArtistProfileSkeleton />}>
        <ArtistProfile id={id} />
      </Suspense>
    </main>
  )
}
