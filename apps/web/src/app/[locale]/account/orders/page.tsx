import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { redirect, Link } from '@/src/i18n/navigation'
import { getSessionUser, getArtist, getPurchases, getSales } from '@/src/lib/data'
import { OpenDisputeButton } from '@/components/open-dispute-button'
import { MarkShippedForm } from './mark-shipped-form'
import { ConfirmDeliveryButton } from './confirm-delivery-button'
import { getTrackingUrl } from '@/src/lib/tracking'

type Tab = 'purchases' | 'sales'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

function TrackingLine({ carrier, trackingNumber, suffix }: { carrier: string; trackingNumber: string; suffix?: React.ReactNode }) {
  const url = getTrackingUrl(carrier, trackingNumber)
  const label = `${carrier} · ${trackingNumber}`
  return (
    <p className="text-muted-foreground">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          {label}
        </a>
      ) : label}
      {suffix}
    </p>
  )
}

function ShippingPhotoGrid({ photos }: { photos: { storagePath: string; order: number }[] }) {
  if (photos.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {photos.map((p) => {
        const src = `${supabaseUrl}/storage/v1/object/public/artworks/${p.storagePath}`
        return (
          <a
            key={p.storagePath}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 overflow-hidden rounded border hover:opacity-80 transition-opacity"
          >
            <Image src={src} alt="" width={56} height={56} className="object-cover" unoptimized />
          </a>
        )
      })}
    </div>
  )
}

function statusKey(order: {
  winningBid: { amount: unknown } | null
  escrowPayment: { status: string; dispute: { id: string } | null } | null
}): string {
  if (!order.winningBid) return 'statusUnsold'
  if (!order.escrowPayment) return 'statusPaymentPending'
  if (order.escrowPayment.dispute) return 'statusInDispute'
  if (order.escrowPayment.status === 'RELEASED') return 'statusComplete'
  return 'statusAwaitingDelivery'
}

const statusColors: Record<string, string> = {
  statusUnsold: 'bg-muted text-muted-foreground',
  statusPaymentPending: 'bg-yellow-100 text-yellow-800',
  statusAwaitingDelivery: 'bg-blue-100 text-blue-800',
  statusInDispute: 'bg-red-100 text-red-800',
  statusComplete: 'bg-green-100 text-green-800',
}

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { locale } = await params
  const { tab } = await searchParams
  const activeTab: Tab = tab === 'sales' ? 'sales' : 'purchases'

  const user = await getSessionUser()
  if (!user) {
    redirect({ href: '/auth/sign-in', locale })
    return null
  }

  const [t, artist, purchases, sales] = await Promise.all([
    getTranslations('orders'),
    getArtist(user.id),
    getPurchases(user.id),
    getArtist(user.id).then((a) => (a ? getSales(user.id) : [])),
  ])

  const orders = activeTab === 'purchases' ? purchases : sales
  const isSalesTab = activeTab === 'sales'

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border p-1 w-fit">
        {(['purchases', 'sales'] as const).map((tabName) => (
          <Link
            key={tabName}
            href={tabName === 'purchases' ? '/account/orders' : '/account/orders?tab=sales'}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tabName
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(tabName)}
          </Link>
        ))}
      </div>

      {/* Sales tab only visible to artists */}
      {isSalesTab && !artist ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const photo = order.artwork.photos[0]
            const imgSrc = photo
              ? `${supabaseUrl}/storage/v1/object/public/artworks/${photo.storagePath}`
              : null
            const sk = statusKey(order)
            const amount = order.winningBid ? Number(order.winningBid.amount) : null
            const escrow = order.escrowPayment
            const isHeld = escrow?.status === 'HELD'
            const hasDispute = !!escrow?.dispute
            const isShipped = !!escrow?.shippedAt

            return (
              <li key={order.id} className="rounded-lg border p-4 space-y-3">
                {/* Top row: thumbnail + info + badge */}
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {imgSrc && (
                      <Image src={imgSrc} alt={order.artwork.title} fill className="object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate font-medium">{order.artwork.title}</p>
                    {isSalesTab && order.winningBid ? (
                      <p className="text-sm text-muted-foreground">
                        {t('soldTo')}: {order.winningBid.bidder.name}
                      </p>
                    ) : !isSalesTab ? (
                      <p className="text-sm text-muted-foreground">
                        {order.artwork.artist.user.name}
                      </p>
                    ) : null}
                    {amount !== null && (
                      <p className="text-sm font-semibold">{amount.toLocaleString('pl-PL')} PLN</p>
                    )}
                  </div>

                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[sk]}`}>
                    {t(sk as Parameters<typeof t>[0])}
                  </span>
                </div>

                {/* Shipment section */}
                {escrow && isHeld && (
                  <div className="border-t pt-3 text-sm space-y-2">
                    {isSalesTab ? (
                      /* Seller view */
                      isShipped ? (
                        <div className="space-y-2">
                          <TrackingLine
                            carrier={escrow.carrier!}
                            trackingNumber={escrow.trackingNumber!}
                            suffix={<>{' · '}<span className="italic">{t('awaitingDeliveryConfirmation')}</span></>}
                          />
                          <ShippingPhotoGrid photos={escrow.shippingPhotos} />
                        </div>
                      ) : (
                        <div>
                          <p className="text-muted-foreground mb-1">{t('markShippedPrompt')}</p>
                          <MarkShippedForm escrowPaymentId={escrow.id} userId={user.id} />
                        </div>
                      )
                    ) : (
                      /* Buyer view */
                      isShipped ? (
                        <div className="space-y-2">
                          <TrackingLine carrier={escrow.carrier!} trackingNumber={escrow.trackingNumber!} />
                          <ShippingPhotoGrid photos={escrow.shippingPhotos} />
                          {!hasDispute && <ConfirmDeliveryButton escrowPaymentId={escrow.id} />}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">{t('statusAwaitingShipment')}</p>
                      )
                    )}

                    {/* Dispute actions */}
                    {hasDispute ? (
                      <Link
                        href={`/account/disputes/${escrow.dispute!.id}` as Parameters<typeof Link>[0]['href']}
                        className="text-xs underline underline-offset-2 text-muted-foreground"
                      >
                        {t('viewDispute')}
                      </Link>
                    ) : (
                      !isSalesTab && isShipped && (
                        <OpenDisputeButton escrowPaymentId={escrow.id} />
                      )
                    )}
                  </div>
                )}

                {/* Completed / dispute view for non-HELD states */}
                {escrow && !isHeld && escrow.dispute && (
                  <div className="border-t pt-3">
                    <Link
                      href={`/account/disputes/${escrow.dispute.id}` as Parameters<typeof Link>[0]['href']}
                      className="text-xs underline underline-offset-2 text-muted-foreground"
                    >
                      {t('viewDispute')}
                    </Link>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
