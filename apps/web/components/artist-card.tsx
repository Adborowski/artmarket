import Image from 'next/image'
import { Link } from '@/src/i18n/navigation'
import type { Institution } from '@artmarket/institutions'
import { InstitutionBadge } from '@/components/institution-badge'

type ArtistCardProps = {
  artistId: string
  name: string
  bio: string | null
  avatarUrl: string | null
  artworkCount: number
  institution: Institution | null
  labels: { viewProfile: string; artworksCount: string }
}

export function ArtistCard({ artistId, name, bio, avatarUrl, artworkCount, institution, labels }: ArtistCardProps) {
  return (
    <Link
      href={`/artists/${artistId}`}
      className="group flex flex-col items-center rounded-xl border bg-card p-6 text-center transition-shadow hover:shadow-md"
    >
      <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full bg-muted ring-2 ring-border transition-all group-hover:ring-primary">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-bold text-muted-foreground">
            {name[0]}
          </div>
        )}
      </div>
      <p className="font-semibold">{name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {labels.artworksCount}
      </p>
      {institution && (
        <div className="mt-2">
          <InstitutionBadge institution={institution} />
        </div>
      )}
      {bio && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{bio}</p>
      )}
      <span className="mt-4 text-xs font-medium text-primary">{labels.viewProfile} →</span>
    </Link>
  )
}

type FeaturedArtistProps = {
  artistId: string
  name: string
  bio: string | null
  avatarUrl: string | null
  artworkCount: number
  institution: Institution | null
  labels: { featured: string; viewProfile: string; artworksCount: string }
}

export function FeaturedArtist({ artistId, name, bio, avatarUrl, artworkCount, institution, labels }: FeaturedArtistProps) {
  return (
    <div className="mb-10 overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-muted ring-4 ring-border sm:h-40 sm:w-40">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground">
              {name[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {labels.featured}
          </span>
          <h2 className="mt-2 text-2xl font-bold">{name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">{labels.artworksCount}</p>
            {institution && <InstitutionBadge institution={institution} />}
          </div>
          {bio && (
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{bio}</p>
          )}
          <Link
            href={`/artists/${artistId}`}
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {labels.viewProfile}
          </Link>
        </div>
      </div>
    </div>
  )
}
