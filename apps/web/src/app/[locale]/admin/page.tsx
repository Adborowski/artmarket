import { notFound } from 'next/navigation'
import { db } from '@artmarket/db'
import { getSessionUser } from '@/src/lib/data'
import { Link } from '@/src/i18n/navigation'
import { ForceCloseButton } from './force-close-button'
import { ReleaseButton } from './release-button'

// ─── badges ────────────────────────────────────────────────────────────────

const ESCROW_BADGE: Record<string, string> = {
  HELD:     'bg-amber-100 text-amber-700',
  RELEASED: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
  DISPUTED: 'bg-red-100 text-red-700',
}
const PAYOUT_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID:    'bg-green-100 text-green-700',
  FAILED:  'bg-red-100 text-red-700',
}
const DISPUTE_BADGE: Record<string, { label: string; className: string }> = {
  OPEN:                 { label: 'Otwarty',                       className: 'bg-yellow-100 text-yellow-800' },
  PENDING_REFUND_OFFER: { label: 'Oczekuje na potwierdzenie zwrotu', className: 'bg-blue-100  text-blue-800'  },
  ESCALATED:            { label: 'Przekazany do admina',           className: 'bg-red-100    text-red-800'   },
  RESOLVED:             { label: 'Rozwiązany',                     className: 'bg-green-100  text-green-800' },
}

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {text}
    </span>
  )
}

function fmt(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <span className="text-sm text-muted-foreground">{count}</span>
    </div>
  )
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const user = await getSessionUser()
  const adminId = process.env.ADMIN_USER_ID
  if (!adminId || user?.id !== adminId) notFound()

  const [activeListings, escrowPayments, disputes] = await Promise.all([
    db.auctionListing.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { endsAt: 'asc' },
      include: {
        artwork: {
          select: {
            title: true,
            artist: { select: { user: { select: { name: true } } } },
          },
        },
        bids: { orderBy: { amount: 'desc' }, take: 1, select: { amount: true, bidder: { select: { name: true } } } },
      },
    }),

    db.escrowPayment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            artwork: {
              select: {
                title: true,
                artist: { select: { user: { select: { name: true } } } },
              },
            },
            winningBid: { select: { amount: true, bidder: { select: { name: true } } } },
          },
        },
        payout: { select: { status: true } },
        dispute: { select: { id: true, status: true } },
      },
    }),

    db.dispute.findMany({
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
    }),
  ])

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-14">
      <h1 className="text-2xl font-bold">Admin</h1>

      {/* ── Active Auctions ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Aktywne aukcje" count={activeListings.length} />
        {activeListings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak aktywnych aukcji.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {['Praca', 'Artysta', 'Najwyższa oferta', 'Licytant', 'Cena wywoławcza', 'Kończy się', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeListings.map((l) => {
                  const topBid = l.bids[0]
                  return (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/listings/${l.id}` as Parameters<typeof Link>[0]['href']} className="underline underline-offset-2 hover:text-muted-foreground">
                          {l.artwork.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{l.artwork.artist.user.name}</td>
                      <td className="px-4 py-3 font-mono">
                        {topBid ? `${Number(topBid.amount).toLocaleString('pl-PL')} PLN` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{topBid?.bidder.name ?? '—'}</td>
                      <td className="px-4 py-3 font-mono">{Number(l.startPrice).toLocaleString('pl-PL')} PLN</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(l.endsAt)}</td>
                      <td className="px-4 py-3">
                        <ForceCloseButton listingId={l.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Escrow Payments ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Escrow" count={escrowPayments.length} />
        {escrowPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak płatności escrow.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {['Praca', 'Kupujący', 'Artysta', 'Kwota', 'Status', 'Wysłano', 'Auto-zwolnienie', 'Wypłata', 'Spór', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {escrowPayments.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">
                      <a
                        href={`https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test/' : ''}payments/${r.stripePaymentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-muted-foreground"
                      >
                        {r.listing.artwork.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.listing.winningBid?.bidder.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.listing.artwork.artist.user.name}</td>
                    <td className="px-4 py-3 font-mono">{Number(r.amount).toLocaleString('pl-PL')} PLN</td>
                    <td className="px-4 py-3">
                      <Badge text={r.status} className={ESCROW_BADGE[r.status] ?? ''} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(r.shippedAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(r.releaseScheduledAt)}</td>
                    <td className="px-4 py-3">
                      {r.payout
                        ? <Badge text={r.payout.status} className={PAYOUT_BADGE[r.payout.status] ?? ''} />
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.dispute ? (
                        <Badge
                          text={DISPUTE_BADGE[r.dispute.status]?.label ?? r.dispute.status}
                          className={DISPUTE_BADGE[r.dispute.status]?.className ?? ''}
                        />
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'HELD' && <ReleaseButton escrowPaymentId={r.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Disputes ────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Spory" count={disputes.length} />
        {disputes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak sporów.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {['Praca', 'Kupujący', 'Artysta', 'Status', 'Wynik', 'Otwarty'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => {
                  const badge = DISPUTE_BADGE[d.status] ?? { label: d.status, className: '' }
                  const artworkTitle = d.escrowPayment.listing.artwork.title
                  const buyerName = d.escrowPayment.listing.winningBid?.bidder.name ?? '—'
                  const artistName = d.escrowPayment.listing.artwork.artist.user.name
                  const outcomeLabel =
                    d.resolvedOutcome === 'RELEASED' ? 'Przekazano artyście'
                    : d.resolvedOutcome === 'REFUNDED' ? 'Zwrot kupującemu'
                    : '—'
                  return (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/account/disputes/${d.id}` as Parameters<typeof Link>[0]['href']}
                          className="underline underline-offset-2 hover:text-muted-foreground"
                        >
                          {artworkTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{buyerName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{artistName}</td>
                      <td className="px-4 py-3">
                        <Badge text={badge.label} className={badge.className} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{outcomeLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.createdAt.toLocaleDateString('pl-PL')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
