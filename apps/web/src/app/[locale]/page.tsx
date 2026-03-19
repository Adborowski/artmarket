import Image from 'next/image'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/src/i18n/navigation'
import { getAllArtworks } from '@/src/lib/data'

// Derives a stable price from the artwork ID so it's consistent across renders.
function priceFromId(id: string): number {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (8 + (hash % 117)) * 100 // 800–12 400 PLN in steps of 100
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const artworks = await getAllArtworks()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="columns-2 gap-4 sm:columns-3 md:columns-4">
        {artworks.map((artwork) => {
          const photo = artwork.photos[0]
          const photoUrl = photo
            ? `${supabaseUrl}/storage/v1/object/public/artworks/${photo.storagePath}`
            : null
          const price = priceFromId(artwork.id)

          return (
            <Link
              key={artwork.id}
              href={`/artworks/${artwork.id}`}
              className="mb-4 block break-inside-avoid overflow-hidden rounded-lg border transition-opacity hover:opacity-80"
            >
              {photoUrl && (
                <Image
                  src={photoUrl}
                  alt={artwork.title}
                  width={400}
                  height={500}
                  className="w-full object-cover"
                />
              )}
              <div className="p-3">
                <p className="truncate font-medium text-sm">{artwork.title}</p>
                <p className="text-xs text-muted-foreground">{artwork.artist.user.name}</p>
                <p className="mt-1 text-sm font-semibold">
                  {price.toLocaleString('pl-PL')} PLN
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
