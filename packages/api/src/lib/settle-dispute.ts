import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { getStripe } from './stripe'
import { notify } from './notify'

export type DisputeOutcome = 'RELEASED' | 'REFUNDED'

/**
 * Settles a dispute with the given outcome. Shared by both participant tRPC
 * mutations and the admin resolve mutation.
 *
 * RELEASED — escrow marked RELEASED, Payout row created (PENDING), artist
 *            transfers are manual via IBAN. No Stripe transfer is attempted.
 *
 * REFUNDED — Stripe refund is issued against the original PaymentIntent,
 *            escrow marked REFUNDED.
 */
export async function settleDispute(disputeId: string, outcome: DisputeOutcome): Promise<void> {
  const dispute = await db.dispute.findUnique({
    where: { id: disputeId },
    include: {
      escrowPayment: {
        include: {
          listing: {
            include: {
              artwork: {
                select: {
                  title: true,
                  artist: { select: { id: true, userId: true } },
                },
              },
              winningBid: { select: { bidderId: true } },
            },
          },
        },
      },
    },
  })

  if (!dispute) throw new TRPCError({ code: 'NOT_FOUND' })
  if (dispute.status === 'RESOLVED') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Dispute already resolved' })
  }

  const escrow = dispute.escrowPayment
  const artworkTitle = escrow.listing.artwork.title
  const artistId = escrow.listing.artwork.artist.id
  const artistUserId = escrow.listing.artwork.artist.userId
  const buyerId = escrow.listing.winningBid?.bidderId ?? ''
  const now = new Date()

  if (outcome === 'RELEASED') {
    await db.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: { status: 'RESOLVED', resolvedOutcome: 'RELEASED', resolvedAt: now },
      })
      await tx.escrowPayment.update({
        where: { id: escrow.id },
        data: { status: 'RELEASED', releasedAt: now },
      })
      // Create a pending payout — admin will transfer manually via artist's IBAN
      await tx.payout.upsert({
        where: { escrowPaymentId: escrow.id },
        create: {
          artistId,
          escrowPaymentId: escrow.id,
          amount: escrow.amount,
          status: 'PENDING',
        },
        update: {},
      })
    })
  } else {
    // Issue Stripe refund first (cannot be rolled back, so do it before DB writes)
    const stripe = getStripe()
    try {
      await stripe.refunds.create({ payment_intent: escrow.stripePaymentId })
    } catch (err) {
      console.error(`[settle-dispute] Stripe refund failed for escrow ${escrow.id}:`, err)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe refund failed' })
    }

    await db.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: { status: 'RESOLVED', resolvedOutcome: 'REFUNDED', resolvedAt: now },
      })
      await tx.escrowPayment.update({
        where: { id: escrow.id },
        data: { status: 'REFUNDED', releasedAt: now },
      })
    })
  }

  // Notify both parties of the outcome
  const outcomeLabel = outcome === 'RELEASED' ? 'środki przekazane artyście' : 'zwrot środków kupującemu'
  const notifyBoth = [
    buyerId && notify({
      userId: buyerId,
      type: 'DISPUTE_OPENED', // reusing closest type — no dedicated DISPUTE_RESOLVED type yet
      title: 'Spór rozwiązany',
      body: `Spór dotyczący „${artworkTitle}" został rozwiązany: ${outcomeLabel}.`,
      link: `/account/disputes/${disputeId}`,
    }).catch(() => {}),
    artistUserId && notify({
      userId: artistUserId,
      type: 'DISPUTE_OPENED',
      title: 'Spór rozwiązany',
      body: `Spór dotyczący „${artworkTitle}" został rozwiązany: ${outcomeLabel}.`,
      link: `/account/disputes/${disputeId}`,
    }).catch(() => {}),
  ]
  await Promise.allSettled(notifyBoth)
}
