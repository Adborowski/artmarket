import { db } from '@artmarket/db'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { notify } from '../lib/notify'
import { settleDispute } from '../lib/settle-dispute'

export type DisputeMessage = {
  id: string
  body: string
  createdAt: string
  sender: { id: string; name: string }
}

export type DisputeDetail = {
  id: string
  status: string
  resolvedOutcome: string | null
  createdAt: string
  artworkTitle: string
  buyerId: string
  buyerName: string
  artistUserId: string
  artistName: string
  messages: DisputeMessage[]
}

export type DisputeSummary = {
  id: string
  status: string
  resolvedOutcome: string | null
  createdAt: string
  artworkTitle: string
  buyerName: string
  artistName: string
}

function assertParticipant(userId: string, buyerId: string, artistUserId: string) {
  if (userId !== buyerId && userId !== artistUserId) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
}

function assertAdmin(userId: string) {
  const adminId = process.env.ADMIN_USER_ID
  if (!adminId || userId !== adminId) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
}

export const disputeRouter = createTRPCRouter({
  // Fetches a dispute by ID. Accessible to the buyer, artist, and admin.
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
      const isAdmin = process.env.ADMIN_USER_ID && ctx.userId === process.env.ADMIN_USER_ID
      if (!isAdmin) assertParticipant(ctx.userId, buyerId, artistUserId)

      return {
        id: dispute.id,
        status: dispute.status,
        resolvedOutcome: dispute.resolvedOutcome,
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
                  artwork: { select: { title: true, artist: { select: { userId: true } } } },
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

      const recipientId = ctx.userId === buyerId ? artistUserId : buyerId
      if (recipientId) {
        notify({
          userId: recipientId,
          type: 'DISPUTE_MESSAGE',
          title: 'Nowa wiadomość w sporze',
          body: `Masz nową wiadomość dotyczącą „${dispute.escrowPayment.listing.artwork.title}".`,
          link: `/account/disputes/${input.disputeId}`,
        }).catch(() => {})
      }

      return { ok: true }
    }),

  // Opens a dispute for a given escrow payment.
  open: protectedProcedure
    .input(z.object({ escrowPaymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const escrow = await db.escrowPayment.findUnique({
        where: { id: input.escrowPaymentId },
        include: {
          listing: {
            include: {
              winningBid: { select: { bidderId: true } },
              artwork: { select: { title: true, artist: { select: { userId: true } } } },
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

      const [dispute] = await db.$transaction([
        db.dispute.create({
          data: { escrowPaymentId: input.escrowPaymentId, openedById: ctx.userId },
        }),
        db.escrowPayment.update({
          where: { id: input.escrowPaymentId },
          data: { releaseScheduledAt: null, status: 'DISPUTED' },
        }),
      ])

      const recipientId = ctx.userId === buyerId ? artistUserId : buyerId
      const artworkTitle = escrow.listing.artwork.title
      if (recipientId) {
        notify({
          userId: recipientId,
          type: 'DISPUTE_OPENED',
          title: 'Otwarto spór',
          body: `Zgłoszono spór dotyczący „${artworkTitle}". Przejdź do panelu sporów, aby odpowiedzieć.`,
          link: `/account/disputes/${dispute.id}`,
        }).catch(() => {})
      }

      return { ok: true, disputeId: dispute.id }
    }),

  // Buyer releases funds to the artist (unilateral — buyer gives up their claim).
  releaseFunds: protectedProcedure
    .input(z.object({ disputeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dispute = await db.dispute.findUnique({
        where: { id: input.disputeId },
        include: {
          escrowPayment: {
            include: { listing: { include: { winningBid: { select: { bidderId: true } } } } },
          },
        },
      })

      if (!dispute) throw new TRPCError({ code: 'NOT_FOUND' })
      if (dispute.status === 'RESOLVED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Dispute already resolved' })
      }

      const buyerId = dispute.escrowPayment.listing.winningBid?.bidderId ?? ''
      if (ctx.userId !== buyerId) throw new TRPCError({ code: 'FORBIDDEN' })

      await settleDispute(input.disputeId, 'RELEASED')
      return { ok: true }
    }),

  // Artist offers a refund to the buyer (buyer must confirm).
  offerRefund: protectedProcedure
    .input(z.object({ disputeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dispute = await db.dispute.findUnique({
        where: { id: input.disputeId },
        include: {
          escrowPayment: {
            include: {
              listing: {
                include: {
                  artwork: { select: { title: true, artist: { select: { userId: true } } } },
                  winningBid: { select: { bidderId: true } },
                },
              },
            },
          },
        },
      })

      if (!dispute) throw new TRPCError({ code: 'NOT_FOUND' })
      if (dispute.status !== 'OPEN') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Refund offer only allowed when dispute is OPEN' })
      }

      const artistUserId = dispute.escrowPayment.listing.artwork.artist.userId
      if (ctx.userId !== artistUserId) throw new TRPCError({ code: 'FORBIDDEN' })

      await db.dispute.update({
        where: { id: input.disputeId },
        data: { status: 'PENDING_REFUND_OFFER' },
      })

      // Notify buyer
      const buyerId = dispute.escrowPayment.listing.winningBid?.bidderId ?? ''
      if (buyerId) {
        notify({
          userId: buyerId,
          type: 'DISPUTE_MESSAGE',
          title: 'Artysta zaproponował zwrot',
          body: `Artysta zaproponował zwrot środków za „${dispute.escrowPayment.listing.artwork.title}". Potwierdź lub odrzuć propozycję.`,
          link: `/account/disputes/${input.disputeId}`,
        }).catch(() => {})
      }

      return { ok: true }
    }),

  // Buyer confirms the artist's refund offer → executes refund.
  confirmRefund: protectedProcedure
    .input(z.object({ disputeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dispute = await db.dispute.findUnique({
        where: { id: input.disputeId },
        include: {
          escrowPayment: {
            include: { listing: { include: { winningBid: { select: { bidderId: true } } } } },
          },
        },
      })

      if (!dispute) throw new TRPCError({ code: 'NOT_FOUND' })
      if (dispute.status !== 'PENDING_REFUND_OFFER') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No pending refund offer' })
      }

      const buyerId = dispute.escrowPayment.listing.winningBid?.bidderId ?? ''
      if (ctx.userId !== buyerId) throw new TRPCError({ code: 'FORBIDDEN' })

      await settleDispute(input.disputeId, 'REFUNDED')
      return { ok: true }
    }),

  // Buyer rejects the artist's refund offer → dispute goes back to OPEN.
  rejectRefund: protectedProcedure
    .input(z.object({ disputeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dispute = await db.dispute.findUnique({
        where: { id: input.disputeId },
        include: {
          escrowPayment: {
            include: {
              listing: {
                include: {
                  artwork: { select: { title: true, artist: { select: { userId: true } } } },
                  winningBid: { select: { bidderId: true } },
                },
              },
            },
          },
        },
      })

      if (!dispute) throw new TRPCError({ code: 'NOT_FOUND' })
      if (dispute.status !== 'PENDING_REFUND_OFFER') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No pending refund offer' })
      }

      const buyerId = dispute.escrowPayment.listing.winningBid?.bidderId ?? ''
      if (ctx.userId !== buyerId) throw new TRPCError({ code: 'FORBIDDEN' })

      await db.dispute.update({
        where: { id: input.disputeId },
        data: { status: 'OPEN' },
      })

      // Notify artist their offer was rejected
      const artistUserId = dispute.escrowPayment.listing.artwork.artist.userId
      notify({
        userId: artistUserId,
        type: 'DISPUTE_MESSAGE',
        title: 'Kupujący odrzucił propozycję zwrotu',
        body: `Kupujący odrzucił Twoją propozycję zwrotu środków za „${dispute.escrowPayment.listing.artwork.title}".`,
        link: `/account/disputes/${input.disputeId}`,
      }).catch(() => {})

      return { ok: true }
    }),

  // Either party escalates to admin review.
  escalate: protectedProcedure
    .input(z.object({ disputeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dispute = await db.dispute.findUnique({
        where: { id: input.disputeId },
        include: {
          escrowPayment: {
            include: {
              listing: {
                include: {
                  artwork: { select: { title: true, artist: { select: { userId: true } } } },
                  winningBid: { select: { bidderId: true } },
                },
              },
            },
          },
        },
      })

      if (!dispute) throw new TRPCError({ code: 'NOT_FOUND' })
      if (dispute.status === 'RESOLVED' || dispute.status === 'ESCALATED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot escalate in current state' })
      }

      const buyerId = dispute.escrowPayment.listing.winningBid?.bidderId ?? ''
      const artistUserId = dispute.escrowPayment.listing.artwork.artist.userId
      assertParticipant(ctx.userId, buyerId, artistUserId)

      await db.dispute.update({
        where: { id: input.disputeId },
        data: { status: 'ESCALATED' },
      })

      // Notify both parties
      const artworkTitle = dispute.escrowPayment.listing.artwork.title
      const otherPartyId = ctx.userId === buyerId ? artistUserId : buyerId
      if (otherPartyId) {
        notify({
          userId: otherPartyId,
          type: 'DISPUTE_OPENED',
          title: 'Spór przekazany do admina',
          body: `Spór dotyczący „${artworkTitle}" został przekazany do weryfikacji przez administratora.`,
          link: `/account/disputes/${input.disputeId}`,
        }).catch(() => {})
      }

      return { ok: true }
    }),

  // Admin: resolve any dispute with either outcome.
  adminResolve: protectedProcedure
    .input(z.object({ disputeId: z.string(), outcome: z.enum(['RELEASED', 'REFUNDED']) }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.userId)
      await settleDispute(input.disputeId, input.outcome)
      return { ok: true }
    }),

  // Admin: list all disputes across the platform.
  adminListAll: protectedProcedure
    .query(async ({ ctx }): Promise<DisputeSummary[]> => {
      assertAdmin(ctx.userId)

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

      return disputes.map((d) => ({
        id: d.id,
        status: d.status,
        resolvedOutcome: d.resolvedOutcome,
        createdAt: d.createdAt.toISOString(),
        artworkTitle: d.escrowPayment.listing.artwork.title,
        buyerName: d.escrowPayment.listing.winningBid?.bidder.name ?? '—',
        artistName: d.escrowPayment.listing.artwork.artist.user.name,
      }))
    }),
})
