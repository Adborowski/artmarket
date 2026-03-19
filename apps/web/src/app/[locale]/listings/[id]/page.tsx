import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/src/i18n/navigation'
import { db } from '@artmarket/db'
import { getSessionUser } from '@/src/lib/data'
import { BidPanel } from './bid-panel'

export default async function ListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const [t, user] = await Promise.all([
    getTranslations('listing.detail'),
    getSessionUser(),
  ])

  let listing = await db.auctionListing.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      startPrice: true,
      reservePrice: true,
      startsAt: true,
      endsAt: true,
      winningBidId: true,
      artwork: {
        select: {
          id: true,
          title: true,
          medium: true,
          dimensions: true,
          year: true,
          artist: {
            select: {
              userId: true,
              user: { select: { name: true } },
            },
          },
          photos: {
            where: { isPrimary: true },
            take: 1,
            select: { storagePath: true },
          },
        },
      },
      bids: {
        orderBy: { amount: 'desc' },
        take: 20,
        select: {
          id: true,
          amount: true,
          createdAt: true,
          isWinning: true,
          bidder: { select: { name: true } },
        },
      },
    },
  })

  if (!listing) notFound()

  // Auto-close expired listings
  if (listing.status === 'ACTIVE' && listing.endsAt < new Date()) {
    const highestBid = listing.bids[0]
    const reserveMet =
      !listing.reservePrice ||
      (highestBid && Number(highestBid.amount) >= Number(listing.reservePrice))
    await db.auctionListing.update({
      where: { id },
      data: {
        status: 'ENDED',
        closedAt: new Date(),
        winningBidId: reserveMet && highestBid ? highestBid.id : null,
      },
    })
    listing = { ...listing, status: 'ENDED', winningBidId: reserveMet && highestBid ? highestBid.id : null }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const photo = listing.artwork.photos[0]

  // Serialize for client (Decimal → number, Date → ISO string)
  const listingData = {
    id: listing.id,
    status: listing.status,
    startPrice: Number(listing.startPrice),
    reservePrice: listing.reservePrice ? Number(listing.reservePrice) : null,
    endsAt: listing.endsAt.toISOString(),
    winningBidId: listing.winningBidId,
    artwork: { artist: { userId: listing.artwork.artist.userId } },
  }
  const initialBids = listing.bids.map((b) => ({
    id: b.id,
    amount: Number(b.amount),
    createdAt: b.createdAt.toISOString(),
    isWinning: b.isWinning,
    bidder: b.bidder,
  }))

  const winningBid = listing.winningBidId ? listing.bids.find((b) => b.id === listing.winningBidId) : null

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Explore
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        {/* Left: artwork info */}
        <div>
          {photo && (
            <div className="overflow-hidden rounded-lg border">
              <Image
                src={`${supabaseUrl}/storage/v1/object/public/artworks/${photo.storagePath}`}
                alt={listing.artwork.title}
                width={800}
                height={1000}
                className="w-full object-cover"
              />
            </div>
          )}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{listing.artwork.artist.user.name}</p>
            <h1 className="mt-1 text-2xl font-bold">{listing.artwork.title}</h1>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {listing.artwork.medium && (
                <><dt className="text-muted-foreground">Medium</dt><dd>{listing.artwork.medium}</dd></>
              )}
              {listing.artwork.dimensions && (
                <><dt className="text-muted-foreground">Dimensions</dt><dd>{listing.artwork.dimensions}</dd></>
              )}
              {listing.artwork.year && (
                <><dt className="text-muted-foreground">Year</dt><dd>{listing.artwork.year}</dd></>
              )}
            </dl>
          </div>
        </div>

        {/* Right: bid panel */}
        <div>
          {listing.status === 'ENDED' ? (
            <div className="rounded-lg border p-6 space-y-4">
              <p className="text-lg font-semibold text-muted-foreground">{t('ended')}</p>
              {winningBid ? (
                <div>
                  <p className="text-sm text-muted-foreground">{t('winner')}</p>
                  <p className="text-xl font-bold">{winningBid.bidder.name}</p>
                  <p className="text-2xl font-bold mt-1">{Number(winningBid.amount).toLocaleString('pl-PL')} PLN</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('reserveNotMet')}</p>
              )}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">{t('bids')}</p>
                {listing.bids.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noBids')}</p>
                ) : (
                  <ul className="space-y-2">
                    {listing.bids.map((bid) => (
                      <li key={bid.id} className="flex justify-between text-sm">
                        <span>{bid.bidder.name}</span>
                        <span className="font-medium">{Number(bid.amount).toLocaleString('pl-PL')} PLN</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <BidPanel
              listing={listingData}
              initialBids={initialBids}
              userId={user?.id ?? null}
            />
          )}
        </div>
      </div>
    </main>
  )
}
