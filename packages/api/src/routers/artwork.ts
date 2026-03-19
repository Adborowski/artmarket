import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, artistProcedure, protectedProcedure } from '../trpc'

const photoInput = z.object({
  storagePath: z.string().min(1),
  order: z.number().int().min(0),
  isPrimary: z.boolean(),
})

const createArtworkInput = z.object({
  title: z.string().min(1).max(200),
  medium: z.string().max(100).optional(),
  dimensions: z.string().max(100).optional(),
  year: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  description: z.string().max(2000).optional(),
  photos: z.array(photoInput).min(1),
})

export const artworkRouter = createTRPCRouter({
  // Create a new artwork with photos (artist only).
  create: artistProcedure
    .input(createArtworkInput)
    .mutation(async ({ ctx, input }) => {
      const { photos, ...artworkData } = input
      return db.$transaction(async (tx) => {
        const artwork = await tx.artwork.create({
          data: {
            artistId: ctx.artistId,
            title: artworkData.title,
            medium: artworkData.medium ?? null,
            dimensions: artworkData.dimensions ?? null,
            year: artworkData.year ?? null,
            description: artworkData.description ?? null,
          },
        })
        await tx.artworkPhoto.createMany({
          data: photos.map((p) => ({ ...p, artworkId: artwork.id })),
        })
        return artwork
      })
    }),

  // List the signed-in artist's own artworks.
  list: artistProcedure.query(async ({ ctx }) => {
    return db.artwork.findMany({
      where: { artistId: ctx.artistId },
      include: {
        photos: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  // Get a single artwork by ID (owner only for now).
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const artwork = await db.artwork.findUnique({
        where: { id: input.id },
        include: {
          photos: { orderBy: { order: 'asc' } },
          artist: { select: { userId: true } },
        },
      })
      if (!artwork) throw new TRPCError({ code: 'NOT_FOUND' })
      if (artwork.artist.userId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' })
      return artwork
    }),
})
