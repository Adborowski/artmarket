import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { redirect, Link } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { getArtistWithArtworks } from '@/src/lib/data'

export async function ArtworkList({ userId, locale }: { userId: string; locale: string }) {
  const [t, artist] = await Promise.all([
    getTranslations('artwork.list'),
    getArtistWithArtworks(userId),
  ])

  if (!artist) {
    redirect({ href: '/artist/register', locale })
    return null
  }

  const { artworks } = artist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button asChild>
          <Link href="/artworks/new">{t('addNew')}</Link>
        </Button>
      </div>

      {artworks.length === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {artworks.map((artwork) => {
            const primaryPhoto = artwork.photos[0]
            const photoUrl = primaryPhoto
              ? `${supabaseUrl}/storage/v1/object/public/artworks/${primaryPhoto.storagePath}`
              : null

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
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{artwork.title}</p>
                  {artwork.year && (
                    <p className="text-xs text-muted-foreground">{artwork.year}</p>
                  )}
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
