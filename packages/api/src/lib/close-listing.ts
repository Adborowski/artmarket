import { db } from '@artmarket/db'
import { getStripe } from './stripe'

const PLATFORM_COMMISSION_RATE = 0.10 // 10%

/**
 * Closes a single listing by ID. Idempotent — safe to call multiple times.
 * - Sets status to ENDED, records closedAt
 * - If there is a winning bid, charges the winner and creates an EscrowPayment
 * - Sets releaseScheduledAt to 14 days after close
 */
export async function closeListing(listingId: string): Promise<void> {
  const listing = await db.auctionListing.findUnique({
    where: { id: listingId },
    include: {
      bids: { orderBy: { amount: 'desc' }, take: 1 },
      escrowPayment: { select: { id: true } },
    },
  })

  if (!listing) throw new Error(`Listing ${listingId} not found`)
  if (listing.status === 'ENDED' || listing.status === 'CANCELLED') return

  const now = new Date()
  const winningBid = listing.bids[0] ?? null

  await db.$transaction(async (tx) => {
    // Mark listing as ended
    await tx.auctionListing.update({
      where: { id: listingId },
      data: {
        status: 'ENDED',
        closedAt: now,
        winningBidId: winningBid?.id ?? null,
      },
    })

    if (winningBid) {
      await tx.bid.update({ where: { id: winningBid.id }, data: { isWinning: true } })
    }
  })

  // Charge the winner outside the DB transaction (Stripe call can't be rolled back)
  if (winningBid) {
    // Re-check for an existing EscrowPayment to guard against overlapping cron runs
    const existingEscrow = await db.escrowPayment.findUnique({ where: { listingId } })
    if (existingEscrow) return

    const winner = await db.user.findUnique({
      where: { id: winningBid.bidderId },
      select: { stripeCustomerId: true, stripePaymentMethodId: true },
    })

    if (winner?.stripeCustomerId && winner?.stripePaymentMethodId) {
      const stripe = getStripe()
      const amount = Number(winningBid.amount)
      const amountCents = Math.round(amount * 100)
      const commissionAmount = Math.round(amount * PLATFORM_COMMISSION_RATE * 100) / 100

      let paymentIntent
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: 'pln',
          customer: winner.stripeCustomerId,
          payment_method: winner.stripePaymentMethodId,
          off_session: true,
          confirm: true,
          metadata: { listingId, bidId: winningBid.id },
        })
      } catch (err) {
        // Card declined or other Stripe error — listing is already ENDED, needs manual follow-up
        console.error(`[close-listing] Stripe charge failed for listing ${listingId}:`, err)
        return
      }

      const releaseScheduledAt = new Date(now)
      releaseScheduledAt.setDate(releaseScheduledAt.getDate() + 14)

      await db.escrowPayment.create({
        data: {
          listingId,
          stripePaymentId: paymentIntent.id,
          amount,
          commissionAmount,
          status: 'HELD',
          releaseScheduledAt,
        },
      })
    }
  }
}

/**
 * Closes all listings whose endsAt has passed and are still ACTIVE.
 * Called by the Vercel Cron job every minute.
 */
export async function closeExpiredListings(): Promise<number> {
  const expired = await db.auctionListing.findMany({
    where: { status: 'ACTIVE', endsAt: { lte: new Date() } },
    select: { id: true },
  })

  await Promise.all(expired.map((l) => closeListing(l.id)))
  return expired.length
}
