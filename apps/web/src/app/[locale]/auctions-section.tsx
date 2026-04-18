import { getTranslations } from 'next-intl/server'
import { getActiveListings, getUserBidListingIds, getSessionUser } from '@/src/lib/data'
import { AuctionCard } from '@/components/auction-card'

export async function AuctionsSection() {
  const [t, tHome, listings, user] = await Promise.all([
    getTranslations('listing.card'),
    getTranslations('home'),
    getActiveListings(),
    getSessionUser(),
  ])

  if (listings.length === 0) return null

  const userBidListingIds = user ? await getUserBidListingIds(user.id) : new Set<string>()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const labels = {
    currentBid: t('currentBid'),
    startingAt: t('startingAt'),
    live: t('live'),
    ending: t('ending'),
    topBidder: t('topBidder'),
    outbid: t('outbid'),
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-lg font-semibold">{tHome('liveAuctions')}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {listings.map((listing) => {
          const photo = listing.artwork.photos[0]
          const highestBid = listing.bids[0]
          const hasBid = userBidListingIds.has(listing.id)
          const isTop = hasBid && !!user && highestBid?.bidderId === user.id
          const bidStatus = !hasBid ? null : isTop ? 'top' : 'outbid'

          return (
            <AuctionCard
              key={listing.id}
              listingId={listing.id}
              title={listing.artwork.title}
              artistName={listing.artwork.artist.user.name}
              photoPath={photo?.storagePath ?? null}
              currentBid={highestBid ? Number(highestBid.amount) : null}
              startPrice={Number(listing.startPrice)}
              endsAt={listing.endsAt}
              supabaseUrl={supabaseUrl}
              likeCount={listing.artwork._count.interests}
              labels={labels}
              bidStatus={bidStatus}
            />
          )
        })}
      </div>
    </section>
  )
}

export function AuctionsSectionSkeleton() {
  return (
    <section className="mb-12 animate-pulse">
      <div className="mb-4 h-6 w-32 rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            <div className="aspect-[3/4] bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="mt-3 h-6 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
