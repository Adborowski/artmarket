import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { getArtistWithArtworks } from '@/src/lib/data'
import { HeartIcon } from '@/components/heart-icon'

export async function ArtworkList({ userId }: { userId: string }) {
  const [t, artist] = await Promise.all([
    getTranslations('artwork.list'),
    getArtistWithArtworks(userId),
  ])

  const artworks = artist?.artworks ?? []
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {artist && (
          <Button asChild>
            <Link href="/artworks/new">{t('addNew')}</Link>
          </Button>
        )}
      </div>

      {!artist && (
        <div className="mb-6 rounded-lg border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-700">
          {t('completeProfile')}{' '}
          <Link href="/account/profile" className="font-medium underline underline-offset-2">
            {t('completeProfileLink')}
          </Link>
        </div>
      )}

      {artworks.length === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {artworks.map((artwork) => {
            const primaryPhoto = artwork.photos[0]
            const photoUrl = primaryPhoto
              ? `${supabaseUrl}/storage/v1/object/public/artworks/${primaryPhoto.storagePath}`
              : null

            const listing = artwork.listings[0] ?? null
            const badge = (() => {
              if (!listing) return null
              if (listing.status === 'ACTIVE') return { label: t('badgeInAuction'), className: 'bg-blue-100 text-blue-700' }
              if (listing.escrowPayment) return { label: t('badgeSold'), className: 'bg-green-100 text-green-700' }
              return { label: t('badgeNoSale'), className: 'bg-muted text-muted-foreground' }
            })()

            return (
              <Link
                key={artwork.id}
                href={`/artworks/${artwork.id}`}
                className="block overflow-hidden rounded-lg border transition-opacity hover:opacity-80"
              >
                <div className="relative aspect-square bg-muted">
                  {photoUrl ? (
                    <Image src={photoUrl} alt={artwork.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No photo
                    </div>
                  )}
                  {badge && (
                    <span className={`absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
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

export function ArtworkListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-36 rounded bg-muted" />
        <div className="h-9 w-28 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <div className="aspect-square bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
