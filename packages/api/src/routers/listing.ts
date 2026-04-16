import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, artistProcedure, protectedProcedure, publicProcedure } from '../trpc'
import { notify } from '../lib/notify'

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

      const escrowBlock = await db.auctionListing.findFirst({
        where: {
          artworkId: input.artworkId,
          status: 'ENDED',
          escrowPayment: { status: { in: ['HELD', 'DISPUTED'] } },
        },
        select: { id: true },
      })
      if (escrowBlock) throw new TRPCError({ code: 'CONFLICT', message: 'Cannot relist while payment is in escrow' })

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
          artwork: { select: { title: true, artist: { select: { userId: true } } } },
          bids: { orderBy: { amount: 'desc' }, take: 1, select: { id: true, amount: true, bidderId: true } },
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

      const artworkTitle = listing.artwork.title
      const artistUserId = listing.artwork.artist.userId
      const amountFormatted = input.amount.toLocaleString('pl-PL')

      // Notify artist: new bid on their listing
      notify({
        userId: artistUserId,
        type: 'NEW_BID',
        title: 'Nowa oferta',
        body: `Nowa oferta ${amountFormatted} PLN na „${artworkTitle}".`,
        link: `/listings/${input.listingId}`,
      }).catch(() => {})

      // Notify previous top bidder: they were outbid
      if (highest && highest.bidderId !== ctx.userId) {
        notify({
          userId: highest.bidderId,
          type: 'OUTBID',
          title: 'Przebita oferta',
          body: `Twoja oferta na „${artworkTitle}" została przebita. Złóż nową, aby wygrać.`,
          link: `/listings/${input.listingId}`,
        }).catch(() => {})
      }
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
