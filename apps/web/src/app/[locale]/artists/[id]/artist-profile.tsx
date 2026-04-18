import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/src/i18n/navigation'
import { getArtistById } from '@/src/lib/data'
import { getInstitutionByEmail } from '@artmarket/institutions'
import { InstitutionBadge } from '@/components/institution-badge'
import { HeartIcon } from '@/components/heart-icon'

export async function ArtistProfile({ id }: { id: string }) {
  const [t, tCard, artist] = await Promise.all([
    getTranslations('artists'),
    getTranslations('listing.card'),
    getArtistById(id),
  ])

  if (!artist) notFound()

  const institution = getInstitutionByEmail(artist.user.email)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <>
      {/* Cover photo */}
      {artist.coverUrl && (
        <div className="relative mb-8 h-48 w-full overflow-hidden rounded-2xl sm:h-56">
          <Image src={artist.coverUrl} alt={artist.user.name} fill className="object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-muted ring-4 ring-border">
          {artist.user.avatarUrl ? (
            <Image src={artist.user.avatarUrl} alt={artist.user.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground">
              {artist.user.name[0]}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold">{artist.user.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {t('artworksCount', { count: artist.artworks.length })}
            </p>
            {institution && <InstitutionBadge institution={institution} />}
          </div>
          {artist.bio && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {artist.bio}
            </p>
          )}
          <a
            href={`mailto:${artist.user.email}?subject=${encodeURIComponent(t('contactSubject'))}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t('contactArtist')}
          </a>
        </div>
      </div>

      {/* Artworks grid */}
      {artist.artworks.length === 0 ? (
        <p className="text-muted-foreground">No artworks yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {artist.artworks.map((artwork) => {
            const photo = artwork.photos[0]
            const photoUrl = photo
              ? `${supabaseUrl}/storage/v1/object/public/artworks/${photo.storagePath}`
              : null
            const activeListing = artwork.listings[0]

            return (
              <Link
                key={artwork.id}
                href={activeListing ? `/listings/${activeListing.id}` : `/artworks/${artwork.id}`}
                className="group block overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square bg-muted">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={artwork.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No photo
                    </div>
                  )}
                  {activeListing && (
                    <span className="absolute right-2 top-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {tCard('live')}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{artwork.title}</p>
                  <div className="mt-0.5 flex items-center justify-between gap-1">
                    {artwork.year ? (
                      <p className="text-xs text-muted-foreground">{artwork.year}</p>
                    ) : (
                      <span />
                    )}
                    {artwork._count.interests > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <HeartIcon />
                        {artwork._count.interests}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

export function ArtistProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Cover */}
      <div className="mb-8 h-48 w-full rounded-2xl bg-muted sm:h-56" />
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="h-32 w-32 shrink-0 rounded-full bg-muted ring-4 ring-border" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full max-w-2xl rounded bg-muted" />
            <div className="h-4 w-5/6 max-w-2xl rounded bg-muted" />
            <div className="h-4 w-4/6 max-w-2xl rounded bg-muted" />
          </div>
        </div>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <div className="aspect-square bg-muted" />
            <div className="p-3 space-y-1">
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
