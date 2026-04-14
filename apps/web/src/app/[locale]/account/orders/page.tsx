import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { redirect, Link } from '@/src/i18n/navigation'
import { getSessionUser, getArtist, getPurchases, getSales } from '@/src/lib/data'
import { OpenDisputeButton } from '@/components/open-dispute-button'

type Tab = 'purchases' | 'sales'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

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
        {(['purchases', 'sales'] as const).map((tab) => (
          <Link
            key={tab}
            href={tab === 'purchases' ? '/account/orders' : '/account/orders?tab=sales'}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(tab)}
          </Link>
        ))}
      </div>

      {/* Sales tab only visible to artists */}
      {isSalesTab && !artist ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const photo = order.artwork.photos[0]
            const imgSrc = photo
              ? `${supabaseUrl}/storage/v1/object/public/${photo.storagePath}`
              : null
            const sk = statusKey(order)
            const amount = order.winningBid ? Number(order.winningBid.amount) : null
            const canOpenDispute =
              order.escrowPayment?.status === 'HELD' && !order.escrowPayment.dispute

            return (
              <li key={order.id} className="flex items-center gap-4 rounded-lg border p-4">
                {/* Thumbnail */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {imgSrc && (
                    <Image src={imgSrc} alt={order.artwork.title} fill className="object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium">{order.artwork.title}</p>
                  {isSalesTab && order.winningBid ? (
                    <p className="text-sm text-muted-foreground">
                      {t('soldTo')}: {order.winningBid.bidder.name}
                    </p>
                  ) : !order.winningBid && isSalesTab ? (
                    <p className="text-sm text-muted-foreground">{t('noBids')}</p>
                  ) : null}
                  {amount !== null && (
                    <p className="text-sm font-semibold">{amount.toLocaleString('pl-PL')} PLN</p>
                  )}
                </div>

                {/* Status + action */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[sk]}`}>
                    {t(sk as Parameters<typeof t>[0])}
                  </span>
                  {canOpenDispute && order.escrowPayment && (
                    <OpenDisputeButton escrowPaymentId={order.escrowPayment.id} />
                  )}
                  {order.escrowPayment?.dispute && (
                    <Link
                      href={`/account/disputes/${order.escrowPayment.dispute.id}`}
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {t('viewDispute')}
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
