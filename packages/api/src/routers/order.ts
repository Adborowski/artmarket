import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { assertAdmin } from '../lib/assert-admin'
import { releaseEscrow } from '../lib/release-escrow'
import { notify } from '../lib/notify'

export const orderRouter = createTRPCRouter({
  // Artist: record shipment details for a sold artwork.
  markShipped: protectedProcedure
    .input(z.object({
      escrowPaymentId: z.string(),
      carrier: z.string().min(1).max(100),
      trackingNumber: z.string().min(1).max(200),
      photoPaths: z.array(z.string().max(500)).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const escrow = await db.escrowPayment.findUnique({
        where: { id: input.escrowPaymentId },
        include: {
          listing: {
            include: {
              artwork: {
                select: {
                  title: true,
                  artist: { select: { userId: true } },
                },
              },
              winningBid: { select: { bidderId: true } },
            },
          },
        },
      })

      if (!escrow) throw new TRPCError({ code: 'NOT_FOUND' })
      if (escrow.listing.artwork.artist.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      if (escrow.status !== 'HELD') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot mark shipped in current state' })
      }

      await db.$transaction(async (tx) => {
        await tx.escrowPayment.update({
          where: { id: input.escrowPaymentId },
          data: {
            shippedAt: new Date(),
            carrier: input.carrier,
            trackingNumber: input.trackingNumber,
          },
        })
        if (input.photoPaths && input.photoPaths.length > 0) {
          await tx.shippingPhoto.createMany({
            data: input.photoPaths.map((storagePath, order) => ({
              escrowPaymentId: input.escrowPaymentId,
              storagePath,
              order,
            })),
          })
        }
      })

      const buyerId = escrow.listing.winningBid?.bidderId
      if (buyerId) {
        await notify({
          userId: buyerId,
          type: 'PAYMENT_CAPTURED',
          title: 'Paczka w drodze',
          body: `Artysta wysłał „${escrow.listing.artwork.title}" (${input.carrier} · ${input.trackingNumber}).`,
          link: '/account/orders',
        }).catch(() => {})
      }

      return { ok: true }
    }),

  // Buyer: confirm receipt — immediately releases escrow to artist.
  confirmDelivery: protectedProcedure
    .input(z.object({ escrowPaymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const escrow = await db.escrowPayment.findUnique({
        where: { id: input.escrowPaymentId },
        include: {
          listing: { include: { winningBid: { select: { bidderId: true } } } },
        },
      })

      if (!escrow) throw new TRPCError({ code: 'NOT_FOUND' })
      if (escrow.listing.winningBid?.bidderId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      if (escrow.status !== 'HELD') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Escrow already settled' })
      }

      await releaseEscrow(input.escrowPaymentId, { deliveredAt: new Date() })
      return { ok: true }
    }),

  // Admin: list all escrow payments across the platform.
  adminListEscrow: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.userId)

    const rows = await db.escrowPayment.findMany({
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
    })

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      amount: Number(r.amount),
      shippedAt: r.shippedAt?.toISOString() ?? null,
      carrier: r.carrier,
      trackingNumber: r.trackingNumber,
      deliveredAt: r.deliveredAt?.toISOString() ?? null,
      releaseScheduledAt: r.releaseScheduledAt?.toISOString() ?? null,
      releasedAt: r.releasedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      artworkTitle: r.listing.artwork.title,
      artistName: r.listing.artwork.artist.user.name,
      buyerName: r.listing.winningBid?.bidder.name ?? null,
      winningAmount: r.listing.winningBid ? Number(r.listing.winningBid.amount) : null,
      payoutStatus: r.payout?.status ?? null,
      disputeId: r.dispute?.id ?? null,
      disputeStatus: r.dispute?.status ?? null,
    }))
  }),

  // Admin: manually release a specific escrow payment.
  adminReleaseEscrow: protectedProcedure
    .input(z.object({ escrowPaymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.userId)
      await releaseEscrow(input.escrowPaymentId)
      return { ok: true }
    }),
})
