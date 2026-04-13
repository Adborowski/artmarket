import Image from 'next/image'
import { Link } from '@/src/i18n/navigation'
import { getAllArtworks } from '@/src/lib/data'
import { HeartIcon } from '@/components/heart-icon'

export async function ArtworkGrid() {
  const artworks = await getAllArtworks()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <div className="columns-2 gap-4 sm:columns-3 md:columns-4">
      {artworks.map((artwork) => {
        const photo = artwork.photos[0]
        const photoUrl = photo
          ? `${supabaseUrl}/storage/v1/object/public/artworks/${photo.storagePath}`
          : null

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
              <p className="truncate text-sm font-medium">{artwork.title}</p>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">{artwork.artist.user.name}</p>
                {artwork._count.interests > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
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
  )
}

export function ArtworkGridSkeleton() {
  // Mimic a masonry grid with varying heights
  const heights = ['h-48', 'h-64', 'h-40', 'h-56', 'h-72', 'h-44', 'h-60', 'h-52']
  return (
    <div className="columns-2 gap-4 sm:columns-3 md:columns-4 animate-pulse">
      {heights.map((h, i) => (
        <div key={i} className="mb-4 break-inside-avoid overflow-hidden rounded-lg border">
          <div className={`${h} bg-muted`} />
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
