import { getTranslations } from 'next-intl/server'
import { getArtworkHistory } from '@/src/lib/data'
import { getTrackingUrl } from '@/src/lib/tracking'

type History = Awaited<ReturnType<typeof getArtworkHistory>>
type Listing = History[number]

function formatDate(date: Date) {
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(date: Date) {
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function ListingStatusBadge({ listing }: { listing: Listing }) {
  if (listing.status === 'ACTIVE') {
    return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">W toku</span>
  }
  if (listing.escrowPayment) {
    if (listing.escrowPayment.status === 'RELEASED') {
      return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Sprzedana</span>
    }
    return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Płatność w toku</span>
  }
  return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Bez sprzedaży</span>
}

export async function ArtworkHistory({ artworkId }: { artworkId: string }) {
  const [history, t] = await Promise.all([
    getArtworkHistory(artworkId),
    getTranslations('artwork.history'),
  ])

  if (history.length === 0) return null

  return (
    <section className="border-t pt-8 mt-4 space-y-6">
      <h2 className="text-lg font-semibold">{t('title')}</h2>

      <div className="space-y-6">
        {history.map((listing, index) => {
          const escrow = listing.escrowPayment
          const saleAmount = escrow ? Number(escrow.amount) : null
          const commission = escrow ? Number(escrow.commissionAmount) : null
          const artistReceives = saleAmount !== null && commission !== null ? saleAmount - commission : null
          const trackingUrl = escrow?.carrier && escrow.trackingNumber
            ? getTrackingUrl(escrow.carrier, escrow.trackingNumber)
            : null

          return (
            <div key={listing.id} className="rounded-lg border p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {t('auctionNo', { n: history.length - index })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(listing.startsAt)} – {formatDate(listing.closedAt ?? listing.endsAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('startPrice')}: {Number(listing.startPrice).toLocaleString('pl-PL')} PLN
                    {listing.reservePrice && (
                      <> · {t('reservePrice')}: {Number(listing.reservePrice).toLocaleString('pl-PL')} PLN</>
                    )}
                  </p>
                </div>
                <ListingStatusBadge listing={listing} />
              </div>

              {/* Bids */}
              {listing.bids.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('bids')} ({listing.bids.length})</p>
                  <div className="rounded-md border divide-y text-sm">
                    {listing.bids.map((bid) => (
                      <div
                        key={bid.id}
                        className={`flex items-center justify-between px-3 py-2 ${bid.isWinning ? 'bg-green-50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{bid.bidder.name}</span>
                          {bid.isWinning && (
                            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                              {t('winningBid')}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${bid.isWinning ? 'text-green-700' : ''}`}>
                            {Number(bid.amount).toLocaleString('pl-PL')} PLN
                          </span>
                          <p className="text-[11px] text-muted-foreground">{formatDateTime(bid.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t('noBids')}</p>
              )}

              {/* Payment & shipping */}
              {escrow && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('paymentShipping')}</p>
                  <div className="rounded-md border text-sm divide-y">
                    {/* Sale breakdown */}
                    <div className="px-3 py-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('salePrice')}</span>
                        <span className="font-medium">{Number(escrow.amount).toLocaleString('pl-PL')} PLN</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('platformFee')} (10%)</span>
                        <span>− {Number(escrow.commissionAmount).toLocaleString('pl-PL')} PLN</span>
                      </div>
                      {artistReceives !== null && (
                        <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                          <span>{t('youReceive')}</span>
                          <span className="text-green-700">{artistReceives.toLocaleString('pl-PL')} PLN</span>
                        </div>
                      )}
                    </div>

                    {/* Shipping */}
                    <div className="px-3 py-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('shipped')}</span>
                        <span>
                          {escrow.shippedAt
                            ? formatDate(escrow.shippedAt)
                            : <span className="text-muted-foreground">{t('notYet')}</span>}
                        </span>
                      </div>
                      {escrow.carrier && escrow.trackingNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('tracking')}</span>
                          {trackingUrl ? (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-2 hover:text-foreground"
                            >
                              {escrow.carrier} · {escrow.trackingNumber}
                            </a>
                          ) : (
                            <span>{escrow.carrier} · {escrow.trackingNumber}</span>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('deliveryConfirmed')}</span>
                        <span>
                          {escrow.deliveredAt
                            ? formatDate(escrow.deliveredAt)
                            : <span className="text-muted-foreground">{t('notYet')}</span>}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('payout')}</span>
                        <span>
                          {escrow.payout?.status === 'PAID'
                            ? <span className="text-green-700">{t('payoutPaid')}</span>
                            : escrow.status === 'RELEASED'
                              ? <span className="text-yellow-700">{t('payoutPending')}</span>
                              : <span className="text-muted-foreground">{t('payoutAwaitingRelease')}</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
