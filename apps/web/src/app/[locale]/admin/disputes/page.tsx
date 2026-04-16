import { notFound } from 'next/navigation'
import { redirect } from '@/src/i18n/navigation'
import { getSessionUser } from '@/src/lib/data'
import { db } from '@artmarket/db'
import { Link } from '@/src/i18n/navigation'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'bg-yellow-100 text-yellow-800' },
  PENDING_REFUND_OFFER: { label: 'Pending refund offer', className: 'bg-blue-100 text-blue-800' },
  ESCALATED: { label: 'Escalated', className: 'bg-red-100 text-red-800' },
  RESOLVED: { label: 'Resolved', className: 'bg-green-100 text-green-800' },
}

export default async function AdminDisputesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const user = await getSessionUser()
  if (!user) {
    redirect({ href: '/auth/sign-in', locale })
    return null
  }

  if (!process.env.ADMIN_USER_ID || user.id !== process.env.ADMIN_USER_ID) {
    notFound()
  }

  const disputes = await db.dispute.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      escrowPayment: {
        include: {
          listing: {
            include: {
              artwork: {
                select: {
                  title: true,
                  artist: { select: { user: { select: { name: true } } } },
                },
              },
              winningBid: { select: { bidder: { select: { name: true } } } },
            },
          },
        },
      },
    },
  })

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">All disputes</h1>

      {disputes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No disputes yet.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Artwork</th>
                <th className="text-left px-4 py-3 font-medium">Buyer</th>
                <th className="text-left px-4 py-3 font-medium">Artist</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Outcome</th>
                <th className="text-left px-4 py-3 font-medium">Opened</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {disputes.map((d) => {
                const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.OPEN
                const artworkTitle = d.escrowPayment.listing.artwork.title
                const buyerName = d.escrowPayment.listing.winningBid?.bidder.name ?? '—'
                const artistName = d.escrowPayment.listing.artwork.artist.user.name
                return (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{artworkTitle}</td>
                    <td className="px-4 py-3 text-muted-foreground">{buyerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{artistName}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.resolvedOutcome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.createdAt.toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/account/disputes/${d.id}` as Parameters<typeof Link>[0]['href']}
                        className="text-sm font-medium underline underline-offset-2"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
