import { db } from '@artmarket/db'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export type DisputeMessage = {
  id: string
  body: string
  createdAt: string
  sender: { id: string; name: string }
}

export type DisputeDetail = {
  id: string
  status: string
  createdAt: string
  artworkTitle: string
  buyerId: string
  buyerName: string
  artistUserId: string
  artistName: string
  messages: DisputeMessage[]
}

function assertParticipant(userId: string, buyerId: string, artistUserId: string) {
  if (userId !== buyerId && userId !== artistUserId) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
}

export const disputeRouter = createTRPCRouter({
  // Fetches a dispute by ID. Only accessible to the buyer and artist involved.
  getById: protectedProcedure
    .input(z.object({ disputeId: z.string() }))
    .query(async ({ ctx, input }): Promise<DisputeDetail> => {
      const dispute = await db.dispute.findUnique({
        where: { id: input.disputeId },
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

      if (!dispute) throw new TRPCError({ code: 'NOT_FOUND' })

      const buyerId = dispute.escrowPayment.listing.winningBid?.bidderId ?? ''
      const artistUserId = dispute.escrowPayment.listing.artwork.artist.userId
      assertParticipant(ctx.userId, buyerId, artistUserId)

      return {
        id: dispute.id,
        status: dispute.status,
        createdAt: dispute.createdAt.toISOString(),
        artworkTitle: dispute.escrowPayment.listing.artwork.title,
        buyerId,
        buyerName: dispute.escrowPayment.listing.winningBid?.bidder.name ?? '',
        artistUserId,
        artistName: dispute.escrowPayment.listing.artwork.artist.user.name,
        messages: dispute.messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          sender: { id: m.sender.id, name: m.sender.name },
        })),
      }
    }),

  // Sends a message in a dispute. Only the buyer and artist can send.
  // Returns { ok: true } — Supabase Realtime delivers the message to the other party.
  sendMessage: protectedProcedure
    .input(z.object({ disputeId: z.string(), body: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const dispute = await db.dispute.findUnique({
        where: { id: input.disputeId },
        include: {
          escrowPayment: {
            include: {
              listing: {
                include: {
                  artwork: { select: { artist: { select: { userId: true } } } },
                  winningBid: { select: { bidderId: true } },
                },
              },
            },
          },
        },
      })

      if (!dispute) throw new TRPCError({ code: 'NOT_FOUND' })
      if (dispute.status === 'RESOLVED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Dispute is resolved' })
      }

      const buyerId = dispute.escrowPayment.listing.winningBid?.bidderId ?? ''
      const artistUserId = dispute.escrowPayment.listing.artwork.artist.userId
      assertParticipant(ctx.userId, buyerId, artistUserId)

      await db.disputeMessage.create({
        data: { disputeId: input.disputeId, senderId: ctx.userId, body: input.body },
      })

      return { ok: true }
    }),

  // Opens a dispute for a given escrow payment.
  // Available to both the buyer (winning bidder) and the artist.
  // Freezes the 14-day auto-release by clearing releaseScheduledAt.
  open: protectedProcedure
    .input(z.object({ escrowPaymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const escrow = await db.escrowPayment.findUnique({
        where: { id: input.escrowPaymentId },
        include: {
          listing: {
            include: {
              winningBid: { select: { bidderId: true } },
              artwork: { include: { artist: { select: { userId: true } } } },
            },
          },
          dispute: { select: { id: true } },
        },
      })

      if (!escrow) throw new TRPCError({ code: 'NOT_FOUND' })
      if (escrow.status !== 'HELD') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Dispute can only be opened while payment is held' })
      }
      if (escrow.dispute) {
        throw new TRPCError({ code: 'CONFLICT', message: 'A dispute already exists for this payment' })
      }

      const buyerId = escrow.listing.winningBid?.bidderId ?? ''
      const artistUserId = escrow.listing.artwork.artist.userId
      assertParticipant(ctx.userId, buyerId, artistUserId)

      await db.$transaction([
        db.dispute.create({
          data: { escrowPaymentId: input.escrowPaymentId, openedById: ctx.userId },
        }),
        db.escrowPayment.update({
          where: { id: input.escrowPaymentId },
          data: { releaseScheduledAt: null, status: 'DISPUTED' },
        }),
      ])

      return { ok: true }
    }),
})
