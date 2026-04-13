import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const artistRouter = createTRPCRouter({
  register: protectedProcedure
    .input(z.object({
      bio: z.string().max(1000).optional(),
      ibanNumber: z.string().min(15).max(34).regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, 'Invalid IBAN format'),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.artist.findUnique({ where: { userId: ctx.userId } })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Already registered as an artist' })

      return db.artist.create({
        data: { userId: ctx.userId, bio: input.bio ?? null, ibanNumber: input.ibanNumber },
      })
    }),
})
