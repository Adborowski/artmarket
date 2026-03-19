import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      include: { artist: { select: { id: true, verificationStatus: true } } },
    })
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
    return user
  }),
})
