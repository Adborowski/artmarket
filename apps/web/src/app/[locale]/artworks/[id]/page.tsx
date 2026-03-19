import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { getArtworkById, getSessionUser } from '@/src/lib/data'
import { deleteArtwork } from '@/src/lib/artwork/actions'
import { DeleteArtworkButton } from '@/components/delete-artwork-button'

function priceFromId(id: string): number {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (8 + (hash % 117)) * 100
}

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const [t, artwork, user] = await Promise.all([
    getTranslations('artwork.detail'),
    getArtworkById(id),
    getSessionUser(),
  ])

  if (!artwork) notFound()

  const isOwner = user?.id === artwork.artist.userId
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const primaryPhoto = artwork.photos.find((p) => p.isPrimary) ?? artwork.photos[0]
  const price = priceFromId(artwork.id)
  const activeListing = artwork.listings?.[0] ?? null

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Explore
      </Link>

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

          {artwork.artist.bio && (
            <div className="border-t pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {artwork.artist.user.name}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{artwork.artist.bio}</p>
            </div>
          )}

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
                <p className="text-xs text-muted-foreground">{t('startingPrice')}</p>
                <p className="mt-1 text-2xl font-bold">{price.toLocaleString('pl-PL')} PLN</p>
                {activeListing ? (
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/listings/${activeListing.id}`}>{t('placeBid')}</Link>
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    {t('placeBid')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
