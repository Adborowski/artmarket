import { getTranslations } from 'next-intl/server'
import { redirect } from '@/src/i18n/navigation'
import { getSessionUser } from '@/src/lib/data'
import { db } from '@artmarket/db'
import { notFound } from 'next/navigation'
import { DisputeChat } from './dispute-chat'

export default async function DisputePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  const user = await getSessionUser()
  if (!user) {
    redirect({ href: '/auth/sign-in', locale })
    return null
  }

  const dispute = await db.dispute.findUnique({
    where: { id },
    include: {
      escrowPayment: {
        include: {
          listing: {
            include: {
              artwork: {
                select: {
                  title: true,
                  artist: { select: { userId: true, user: { select: { name: true } } } },
                },
              },
              winningBid: { select: { bidderId: true, bidder: { select: { name: true } } } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  })

  if (!dispute) notFound()

  const buyerId = dispute.escrowPayment.listing.winningBid?.bidderId ?? ''
  const artistUserId = dispute.escrowPayment.listing.artwork.artist.userId

  if (user.id !== buyerId && user.id !== artistUserId) notFound()

  const t = await getTranslations('dispute')
  const artworkTitle = dispute.escrowPayment.listing.artwork.title
  const buyerName = dispute.escrowPayment.listing.winningBid?.bidder.name ?? ''
  const artistName = dispute.escrowPayment.listing.artwork.artist.user.name
  const isResolved = dispute.status === 'RESOLVED'

  const initialMessages = dispute.messages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    sender: { id: m.sender.id, name: m.sender.name },
  }))

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isResolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isResolved ? t('statusResolved') : t('statusOpen')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('regarding')}: <span className="font-medium text-foreground">{artworkTitle}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {t('between')}: {buyerName} &amp; {artistName}
        </p>
      </div>

      <DisputeChat
        disputeId={id}
        initialMessages={initialMessages}
        currentUserId={user.id}
        isResolved={isResolved}
      />
    </main>
  )
}
