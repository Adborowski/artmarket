import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { notify } from './notify'

/**
 * Releases a HELD escrow payment to the artist.
 * Creates a PENDING Payout row (manual IBAN transfer by admin).
 * Optionally records a deliveredAt timestamp (set when buyer confirms delivery).
 */
export async function releaseEscrow(
  escrowPaymentId: string,
  opts?: { deliveredAt?: Date },
): Promise<void> {
  const escrow = await db.escrowPayment.findUnique({
    where: { id: escrowPaymentId },
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
  })

  if (!escrow) throw new TRPCError({ code: 'NOT_FOUND' })
  if (escrow.status !== 'HELD') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Escrow is not in HELD state' })
  }

  const artistId = escrow.listing.artwork.artist.id
  const artistUserId = escrow.listing.artwork.artist.userId
  const buyerId = escrow.listing.winningBid?.bidderId ?? ''
  const artworkTitle = escrow.listing.artwork.title
  const now = new Date()

  await db.$transaction(async (tx) => {
    await tx.escrowPayment.update({
      where: { id: escrowPaymentId },
      data: {
        status: 'RELEASED',
        releasedAt: now,
        releaseScheduledAt: null,
        ...(opts?.deliveredAt && { deliveredAt: opts.deliveredAt }),
      },
    })
    await tx.payout.upsert({
      where: { escrowPaymentId },
      create: { artistId, escrowPaymentId, amount: escrow.amount, status: 'PENDING' },
      update: {},
    })
  })

  await Promise.allSettled([
    buyerId && notify({
      userId: buyerId,
      type: 'PAYMENT_CAPTURED',
      title: 'Transakcja zakończona',
      body: `Środki za „${artworkTitle}" zostały przekazane artyście.`,
      link: '/account/orders',
    }).catch(() => {}),
    artistUserId && notify({
      userId: artistUserId,
      type: 'PAYMENT_CAPTURED',
      title: 'Środki zwolnione',
      body: `Środki za „${artworkTitle}" oczekują na przelew na Twój rachunek.`,
      link: '/account/orders',
    }).catch(() => {}),
  ])
}
