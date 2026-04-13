import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, artistProcedure, protectedProcedure, publicProcedure } from '../trpc'

const MIN_INCREMENT = 50

export const listingRouter = createTRPCRouter({
  create: artistProcedure
    .input(z.object({
      artworkId: z.string(),
      startPrice: z.number().int().positive(),
      reservePrice: z.number().int().positive().optional(),
      durationDays: z.union([z.literal(7), z.literal(14), z.literal(30)]),
    }))
    .mutation(async ({ ctx, input }) => {
      const artwork = await db.artwork.findUnique({ where: { id: input.artworkId }, select: { artistId: true } })
      if (!artwork || artwork.artistId !== ctx.artistId) throw new TRPCError({ code: 'FORBIDDEN' })

      const existing = await db.auctionListing.findFirst({
        where: { artworkId: input.artworkId, status: 'ACTIVE' },
        select: { id: true },
      })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'An active listing already exists for this artwork' })

      const now = new Date()
      const endsAt = new Date(now)
      endsAt.setDate(endsAt.getDate() + input.durationDays)

      const listing = await db.auctionListing.create({
        data: {
          artworkId: input.artworkId,
          startPrice: input.startPrice,
          reservePrice: input.reservePrice ?? null,
          startsAt: now,
          endsAt,
          status: 'ACTIVE',
        },
      })
      return { id: listing.id }
    }),

  placeBid: protectedProcedure
    .input(z.object({ listingId: z.string(), amount: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.auctionListing.findUnique({
        where: { id: input.listingId },
        select: {
          status: true,
          endsAt: true,
          startPrice: true,
          artwork: { select: { artist: { select: { userId: true } } } },
          bids: { orderBy: { amount: 'desc' }, take: 1, select: { id: true, amount: true } },
        },
      })

      if (!listing) throw new TRPCError({ code: 'NOT_FOUND' })
      if (listing.status !== 'ACTIVE') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Listing is not active' })
      if (new Date() > listing.endsAt) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Auction has ended' })
      if (listing.artwork.artist.userId === ctx.userId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot bid on your own artwork' })

      const bidder = await db.user.findUnique({ where: { id: ctx.userId }, select: { stripePaymentMethodId: true } })
      if (!bidder?.stripePaymentMethodId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'A saved payment method is required to bid' })

      const highest = listing.bids[0]
      const minimumBid = highest ? Number(highest.amount) + MIN_INCREMENT : Number(listing.startPrice)
      if (input.amount < minimumBid) throw new TRPCError({ code: 'BAD_REQUEST', message: `Minimum bid is ${minimumBid} PLN` })

      await db.$transaction(async (tx) => {
        if (highest) await tx.bid.update({ where: { id: highest.id }, data: { isWinning: false } })
        await tx.bid.create({
          data: { listingId: input.listingId, bidderId: ctx.userId, amount: input.amount, isWinning: true },
        })
      })
    }),

  getBids: publicProcedure
    .input(z.object({ listingId: z.string() }))
    .query(async ({ input }) => {
      const bids = await db.bid.findMany({
        where: { listingId: input.listingId },
        orderBy: { amount: 'desc' },
        take: 20,
        select: { id: true, bidderId: true, amount: true, createdAt: true, isWinning: true, bidder: { select: { name: true } } },
      })
      return bids.map((b) => ({ ...b, amount: Number(b.amount), createdAt: b.createdAt.toISOString() }))
    }),
})
