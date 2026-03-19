import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const artistRouter = createTRPCRouter({
  register: protectedProcedure
    .input(z.object({ bio: z.string().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.artist.findUnique({ where: { userId: ctx.userId } })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Already registered as an artist' })

      return db.artist.create({
        data: { userId: ctx.userId, bio: input.bio ?? null },
      })
    }),
})
