import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { redirect } from '@/src/i18n/navigation'
import { Link } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { getSessionUser, getArtistWithArtworks } from '@/src/lib/data'

export default async function ArtworksPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getSessionUser()

  if (!user) {
    redirect({ href: '/auth/sign-in', locale })
    return null
  }

  const [t, artist] = await Promise.all([
    getTranslations('artwork.list'),
    getArtistWithArtworks(user.id),
  ])

  if (!artist) {
    redirect({ href: '/artist/register', locale })
    return null
  }

  const { artworks } = artist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
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
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      No photo
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate font-medium text-sm">{artwork.title}</p>
                  {artwork.year && (
                    <p className="text-xs text-muted-foreground">{artwork.year}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
