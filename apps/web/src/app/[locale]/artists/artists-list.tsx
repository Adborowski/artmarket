import { getTranslations } from 'next-intl/server'
import { getArtists } from '@/src/lib/data'
import { getInstitutionByEmail } from '@artmarket/institutions'
import { ArtistCard, FeaturedArtist } from '@/components/artist-card'

export async function ArtistsList() {
  const [t, artists] = await Promise.all([
    getTranslations('artists'),
    getArtists(),
  ])

  if (artists.length === 0) {
    return <p className="text-muted-foreground">{t('noArtists')}</p>
  }

  // Pick a random featured artist deterministically per build — stable within a request
  const featuredIndex = Math.floor(Math.random() * artists.length)
  const featured = artists[featuredIndex]!
  const rest = artists.filter((_, i) => i !== featuredIndex)

  const labels = {
    featured: t('featured'),
    viewProfile: t('viewProfile'),
    artworksCount: t('artworksCount', { count: 0 }).replace('0', '{count}'),
  }

  return (
    <>
      <FeaturedArtist
        artistId={featured.id}
        name={featured.user.name}
        bio={featured.bio}
        avatarUrl={featured.user.avatarUrl}
        artworkCount={featured._count.artworks}
        institution={getInstitutionByEmail(featured.user.email)}
        labels={{
          ...labels,
          artworksCount: t('artworksCount', { count: featured._count.artworks }),
        }}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {rest.map((artist) => (
          <ArtistCard
            key={artist.id}
            artistId={artist.id}
            name={artist.user.name}
            bio={artist.bio}
            avatarUrl={artist.user.avatarUrl}
            artworkCount={artist._count.artworks}
            institution={getInstitutionByEmail(artist.user.email)}
            labels={{
              viewProfile: t('viewProfile'),
              artworksCount: t('artworksCount', { count: artist._count.artworks }),
            }}
          />
        ))}
      </div>
    </>
  )
}

export function ArtistsListSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Featured skeleton */}
      <div className="mb-10 overflow-hidden rounded-2xl border">
        <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center">
          <div className="h-40 w-40 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-28 rounded-full bg-muted" />
            <div className="h-7 w-48 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="space-y-2 pt-1">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
              <div className="h-4 w-4/6 rounded bg-muted" />
            </div>
            <div className="h-9 w-32 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center rounded-xl border p-6">
            <div className="mb-4 h-24 w-24 rounded-full bg-muted" />
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="mt-1 h-3 w-20 rounded bg-muted" />
            <div className="mt-3 w-full space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-5/6 rounded bg-muted" />
              <div className="h-3 w-4/6 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
