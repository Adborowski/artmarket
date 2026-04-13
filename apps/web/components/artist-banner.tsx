import Image from 'next/image'
import { Link } from '@/src/i18n/navigation'
import type { Institution } from '@artmarket/institutions'
import { InstitutionBadge } from '@/components/institution-badge'

type ArtistBannerProps = {
  artistId: string
  name: string
  avatarUrl: string | null
  institution: Institution | null
  viewProfileLabel: string
}

export function ArtistBanner({ artistId, name, avatarUrl, institution, viewProfileLabel }: ArtistBannerProps) {
  return (
    <Link
      href={`/artists/${artistId}`}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-shadow hover:shadow-md"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-muted-foreground">
            {name[0]}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-medium">{name}</span>
        {institution && <InstitutionBadge institution={institution} />}
      </div>
      <span className="shrink-0 text-xs font-medium text-primary">{viewProfileLabel} →</span>
    </Link>
  )
}
