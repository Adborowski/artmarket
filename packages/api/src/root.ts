import { createTRPCRouter } from './trpc'
import { userRouter } from './routers/user'
import { artistRouter } from './routers/artist'
import { artworkRouter } from './routers/artwork'
import { listingRouter } from './routers/listing'

export const appRouter = createTRPCRouter({
  user: userRouter,
  artist: artistRouter,
  artwork: artworkRouter,
  listing: listingRouter,
})

export type AppRouter = typeof appRouter
