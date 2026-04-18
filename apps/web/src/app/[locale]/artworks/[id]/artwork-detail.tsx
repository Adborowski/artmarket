import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { getArtworkById, getSessionUser, getArtworkInterestForUser, getArtworkEscrowBlock } from '@/src/lib/data'
import { ArtworkHistory } from './artwork-history'
import { deleteArtwork } from '@/src/lib/artwork/actions'
import { DeleteArtworkButton } from '@/components/delete-artwork-button'
import { ArtistBanner } from '@/components/artist-banner'
import { InterestedButton } from '@/components/interested-button'
import { getInstitutionByEmail } from '@artmarket/institutions'

export async function ArtworkDetail({ id, locale }: { id: string; locale: string }) {
  const [t, tArtists, artwork, user] = await Promise.all([
    getTranslations('artwork.detail'),
    getTranslations('artists'),
    getArtworkById(id),
    getSessionUser(),
  ])

  if (!artwork) notFound()

  const isOwner = user?.id === artwork.artist.userId
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const primaryPhoto = artwork.photos.find((p) => p.isPrimary) ?? artwork.photos[0]
  const activeListing = artwork.listings?.[0] ?? null
  const [userInterested, escrowBlock] = await Promise.all([
    user && !isOwner ? getArtworkInterestForUser(artwork.id, user.id) : Promise.resolve(false),
    isOwner && !activeListing ? getArtworkEscrowBlock(artwork.id) : Promise.resolve(null),
  ])

  return (
    <div className="space-y-10">
    <div className="grid gap-10 md:grid-cols-2">
      {/* Photo */}
      <div className="space-y-2">
        {primaryPhoto && (
          <div className="overflow-hidden rounded-lg border">
            <Image
              src={`${supabaseUrl}/storage/v1/object/public/artworks/${primaryPhoto.storagePath}`}
              alt={artwork.title}
              width={800}
              height={1000}
              className="w-full object-cover"
            />
          </div>
        )}
        {artwork.photos.length > 1 && (
          <div className="flex gap-2">
            {artwork.photos.map((photo, i) => (
              <div key={i} className="w-16 overflow-hidden rounded border">
                <Image
                  src={`${supabaseUrl}/storage/v1/object/public/artworks/${photo.storagePath}`}
                  alt={`${artwork.title} ${i + 1}`}
                  width={64}
                  height={80}
                  className="w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {t('by')} {artwork.artist.user.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{artwork.title}</h1>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {artwork.medium && (
            <>
              <dt className="text-muted-foreground">Medium</dt>
              <dd>{artwork.medium}</dd>
            </>
          )}
          {artwork.dimensions && (
            <>
              <dt className="text-muted-foreground">Dimensions</dt>
              <dd>{artwork.dimensions}</dd>
            </>
          )}
          {artwork.year && (
            <>
              <dt className="text-muted-foreground">Year</dt>
              <dd>{artwork.year}</dd>
            </>
          )}
        </dl>

        {artwork.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{artwork.description}</p>
        )}

        <div className="border-t pt-4">
          <ArtistBanner
            artistId={artwork.artist.id}
            name={artwork.artist.user.name}
            avatarUrl={artwork.artist.user.avatarUrl}
            institution={getInstitutionByEmail(artwork.artist.user.email)}
            viewProfileLabel={tArtists('viewProfile')}
          />
        </div>

        <div className="border-t pt-4">
          {isOwner ? (
            <div className="space-y-3">
              {activeListing ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">{t('auctionInProgress')}</p>
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/listings/${activeListing.id}`}>{t('viewAuction')}</Link>
                  </Button>
                </div>
              ) : escrowBlock ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 space-y-2">
                  <p className="text-sm font-medium text-green-900">{t('auctionClosedShipPrompt')}</p>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/account/orders">{t('goToOrders')}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <DeleteArtworkButton
                    label={t('delete')}
                    action={deleteArtwork.bind(null, artwork.id, locale)}
                  />
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href={`/listings/new?artworkId=${artwork.id}`}>{t('startAuction')}</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {activeListing && (
                <Button asChild className="w-full" size="lg">
                  <Link href={`/listings/${activeListing.id}`}>{t('placeBid')}</Link>
                </Button>
              )}
              <InterestedButton
                artworkId={artwork.id}
                initialInterested={!!userInterested}
                initialCount={artwork._count.interests}
                label={t('interested')}
                signInHref={`/${locale}/auth/sign-in`}
                isLoggedIn={!!user}
              />
              <Button asChild variant="outline" className="w-full" size="lg">
                <a href={`mailto:${artwork.artist.user.email}?subject=${encodeURIComponent(t('contactSubject', { title: artwork.title }))}`}>
                  {t('contactArtist')}
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>

    {isOwner && <ArtworkHistory artworkId={artwork.id} />}
    </div>
  )
}

export function ArtworkDetailSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-2 animate-pulse">
      {/* Photo */}
      <div className="space-y-2">
        <div className="aspect-[4/5] w-full rounded-lg border bg-muted" />
      </div>
      {/* Details */}
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-8 w-3/4 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-muted" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-4/6 rounded bg-muted" />
        </div>
        <div className="border-t pt-4 space-y-3">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
