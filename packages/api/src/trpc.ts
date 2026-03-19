import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { db } from '@artmarket/db'

// Context type — extended with auth session in apps/web and apps/mobile.
export interface TRPCContext {
  headers: Headers
  userId: string | null
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router

// Unauthenticated — open to anyone.
export const publicProcedure = t.procedure

// Authenticated — throws UNAUTHORIZED if no session.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})

// Artist — throws FORBIDDEN if user has no Artist row.
export const artistProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const artist = await db.artist.findUnique({
    where: { userId: ctx.userId },
    select: { id: true },
  })
  if (!artist) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not registered as an artist' })
  return next({ ctx: { ...ctx, artistId: artist.id } })
})
