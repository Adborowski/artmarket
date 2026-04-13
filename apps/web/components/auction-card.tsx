import Image from 'next/image'
import { Link } from '@/src/i18n/navigation'
import { HeartIcon } from '@/components/heart-icon'

type AuctionCardProps = {
  listingId: string
  title: string
  artistName: string
  photoPath: string | null
  currentBid: number | null
  startPrice: number
  endsAt: Date
  supabaseUrl: string
  likeCount: number
  labels: { currentBid: string; startingAt: string; live: string; ending: string }
}

function formatTimeLeft(endsAt: Date, endingLabel: string): { label: string; urgent: boolean } {
  const ms = endsAt.getTime() - Date.now()
  if (ms <= 0) return { label: endingLabel, urgent: true }

  const totalMinutes = Math.floor(ms / 1000 / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const minutes = totalMinutes % 60

  if (days > 0) return { label: `${days}d ${hours}h left`, urgent: false }
  if (totalHours > 0) return { label: `${hours}h ${minutes}m left`, urgent: totalHours < 6 }
  return { label: `${minutes}m left`, urgent: true }
}

export function AuctionCard({
  listingId,
  title,
  artistName,
  photoPath,
  currentBid,
  startPrice,
  endsAt,
  supabaseUrl,
  likeCount,
  labels,
}: AuctionCardProps) {
  const { label, urgent } = formatTimeLeft(endsAt, labels.ending)
  const displayPrice = currentBid ?? startPrice
  const hasBid = currentBid !== null

  return (
    <Link
      href={`/listings/${listingId}`}
      className="group block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {photoPath ? (
          <Image
            src={`${supabaseUrl}/storage/v1/object/public/artworks/${photoPath}`}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No photo
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
            urgent
              ? 'bg-red-100 text-red-700'
              : 'bg-black/50 text-white backdrop-blur-sm'
          }`}
        >
          {label}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold">{title}</p>
          {likeCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <HeartIcon />
              {likeCount}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{artistName}</p>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{hasBid ? labels.currentBid : labels.startingAt}</p>
            <p className="text-lg font-bold">{displayPrice.toLocaleString('pl-PL')} PLN</p>
          </div>
          {hasBid && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {labels.live}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
