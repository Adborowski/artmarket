import { createTRPCRouter } from './trpc'
import { userRouter } from './routers/user'
import { artistRouter } from './routers/artist'
import { artworkRouter } from './routers/artwork'
import { listingRouter } from './routers/listing'
import { feedbackRouter } from './routers/feedback'
import { billingRouter } from './routers/billing'
import { disputeRouter } from './routers/dispute'
import { notificationRouter } from './routers/notification'

export const appRouter = createTRPCRouter({
  user: userRouter,
  artist: artistRouter,
  artwork: artworkRouter,
  listing: listingRouter,
  feedback: feedbackRouter,
  billing: billingRouter,
  dispute: disputeRouter,
  notification: notificationRouter,
})

export type AppRouter = typeof appRouter
